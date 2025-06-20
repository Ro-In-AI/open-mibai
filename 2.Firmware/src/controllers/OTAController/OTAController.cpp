#include "OTAController.h"
#include "serial_color_debug.h"
#include <esp_heap_caps.h>

const char* OTAController::OTA_STATUS_UUID = "ef040003-1000-8000-0080-5f9b34fb0000";

OTAController::OTAController()
    : _status(OTAStatus::IDLE),
      _totalSize(0),
      _currentSize(0),
      _updateStarted(false),
      _updatePartition(nullptr),
      _updateHandle(0) {
    _buffer.reserve(BUFFER_SIZE);
}

void OTAController::begin() {
    DEBUG_INFO("🔄 开始初始化 OTA 控制器...");
    if (!initOTA()) {
        DEBUG_ERROR("❌ OTA 初始化失败");
        updateStatus(OTAStatus::FAILED);
    }
}

bool OTAController::initOTA() {
    // 确保之前的更新已经清理
    if (_updateStarted || _updateHandle != 0) {
        DEBUG_INFO("⚠️ 检测到未完成的OTA，正在清理...");
        esp_ota_abort(_updateHandle);
        _updateStarted = false;
        _updateHandle = 0;
    }

    // 获取当前运行的分区
    const esp_partition_t* running = esp_ota_get_running_partition();
    if (running == NULL) {
        DEBUG_ERROR("❌ 无法获取当前运行分区");
        updateStatus(OTAStatus::FAILED);
        return false;
    }
    
    esp_partition_type_t type = running->type;
    esp_partition_subtype_t subtype = running->subtype;
    uint32_t addr = running->address;
    
    DEBUG_INFOF("✅ 当前运行分区: 类型=%d, 子类型=%d, 地址=0x%x", type, subtype, addr);

    // 获取下一个可用的 OTA 分区
    const esp_partition_t* next_update = esp_ota_get_next_update_partition(NULL);
    if (next_update == NULL) {
        DEBUG_ERROR("❌ 无法获取下一个更新分区");
        updateStatus(OTAStatus::FAILED);
        return false;
    }
    
    type = next_update->type;
    subtype = next_update->subtype;
    addr = next_update->address;
    uint32_t size = next_update->size;
    
    DEBUG_INFOF("✅ 下一个更新分区: 类型=%d, 子类型=%d, 地址=0x%x, 大小=%d", 
                type, subtype, addr, size);

    // 验证分区表配置
    if (next_update->address == running->address) {
        DEBUG_ERROR("❌ 更新分区与当前运行分区相同，请检查分区表配置");
        updateStatus(OTAStatus::FAILED);
        return false;
    }

    // 验证分区大小
    if (next_update->size < 0x140000) { // 至少需要 1.25MB
        DEBUG_ERROR("❌ 更新分区大小不足，至少需要 1.5MB");
        updateStatus(OTAStatus::FAILED);
        return false;
    }

    reset();
    DEBUG_INFO("✅ OTA控制器初始化完成");
    return true;
}

void OTAController::handleMessage(const BLEWriteMessage& msg) {
    if (msg.data.empty()) {
        DEBUG_ERROR("❌ 收到空的OTA消息");
        return;
    }

    DEBUG_INFOF("📥 OTA控制器收到消息 - UUID: %s, 数据长度: %d", msg.uuid.c_str(), msg.data.size());
    String hex;
    for (uint8_t b : msg.data) {
        char buf[4];
        sprintf(buf, "%02X ", b);
        hex += buf;
    }
    DEBUG_INFOF("📥 OTA消息数据(hex): %s", hex.c_str());

    // 根据UUID处理不同的消息
    if (msg.uuid == "ef040001-1000-8000-0080-5f9b34fb0000") {
        // OTA控制命令
        DEBUG_INFO("📥 处理OTA控制命令");
        processControlCommand(msg.data);
    } else if (msg.uuid == "ef040002-1000-8000-0080-5f9b34fb0000") {
        // OTA数据包
        DEBUG_INFO("📥 处理OTA数据包");
        processDataPacket(msg.data);
    } else {
        DEBUG_WARNF("⚠️ 未知的OTA UUID: %s", msg.uuid.c_str());
    }
}

void OTAController::processControlCommand(const std::vector<uint8_t>& data) {
    if (data.empty()) {
        DEBUG_ERROR("❌ 收到空的OTA控制命令");
        return;
    }

    DEBUG_INFOF("📥 收到OTA控制命令: %d", data[0]);
    OTAControlCommand cmd = static_cast<OTAControlCommand>(data[0]);
    
    switch (cmd) {
        case OTAControlCommand::START:
            if (_status == OTAStatus::IDLE) {
                DEBUG_INFO("📥 开始OTA升级流程");
                // 确保系统处于干净状态
                reset();
                updateStatus(OTAStatus::READY);
            } else {
                DEBUG_WARNF("⚠️ 收到START命令但状态不是IDLE，当前状态: %d", _status);
                // 如果不是 IDLE，强制重置
                reset();
                updateStatus(OTAStatus::READY);
            }
            break;
            
        case OTAControlCommand::CANCEL:
            DEBUG_INFO("❌ 取消OTA升级");
            reset();
            break;
            
        case OTAControlCommand::CONFIRM:
            if (_status == OTAStatus::UPDATING || _status == OTAStatus::READY) {
                DEBUG_INFO("✅ 收到CONFIRM命令，准备结束OTA升级");
                if (endUpdate()) {
                    updateStatus(OTAStatus::COMPLETE);
                    DEBUG_INFO("✅ OTA更新成功完成");
                    delay(1000);
                    esp_restart();
                } else {
                    updateStatus(OTAStatus::FAILED);
                    DEBUG_ERROR("❌ OTA更新结束失败");
                }
            } else {
                DEBUG_WARNF("⚠️ 收到CONFIRM命令但状态不是UPDATING/READY，当前状态: %d", _status);
            }
            break;
            
        default:
            DEBUG_ERRORF("❌ 未知的OTA控制命令: %d", data[0]);
            break;
    }
}

void OTAController::processDataPacket(const std::vector<uint8_t>& data) {
    if (_status != OTAStatus::UPDATING && _status != OTAStatus::READY) {
        DEBUG_ERRORF("❌ 收到数据包但OTA未就绪, 当前状态: %d", _status);
        return;
    }

    if (!_updateStarted) {
        DEBUG_INFO("📥 收到第一个数据包，准备开始OTA更新");
        if (!startUpdate()) {
            DEBUG_ERROR("❌ OTA更新初始化失败，状态将设置为FAILED");
            updateStatus(OTAStatus::FAILED);
            return;
        }
    }

    // 写入数据
    esp_err_t err = esp_ota_write(_updateHandle, data.data(), data.size());
    if (err != ESP_OK) {
        DEBUG_ERRORF("❌ OTA写入失败: %s (错误码: %d)", esp_err_to_name(err), err);
        updateStatus(OTAStatus::FAILED);
        return;
    }

    _currentSize += data.size();
    DEBUG_INFOF("📥 已累计接收: %d 字节，剩余堆内存: %u 字节", _currentSize, ESP.getFreeHeap());
    // 不在这里结束OTA，由CONFIRM命令触发endUpdate
}

void OTAController::updateStatus(OTAStatus newStatus) {
    _status = newStatus;
    DEBUG_INFOF("[OTA] 状态变更为: %d，当前剩余堆内存: %u 字节", (int)newStatus, ESP.getFreeHeap());
    notifyStatus();
}

void OTAController::notifyStatus() {
    if (!_bleServer) {
        DEBUG_ERROR("❌ BLE服务器未设置，无法发送OTA状态通知");
        return;
    }

    uint8_t status = static_cast<uint8_t>(_status);
    DEBUG_INFOF("📤 准备发送OTA状态通知: %d", status);
    if (_bleServer->isConnected()) {
        _bleServer->notify(OTA_STATUS_UUID, &status, sizeof(status));
    }
    
    DEBUG_INFOF("✅ OTA状态通知已发送: %d", status);
}

bool OTAController::startUpdate() {
    DEBUG_INFO("🔄 开始OTA更新流程...");
    
    // 确保之前的更新已经清理
    if (_updateStarted || _updateHandle != 0) {
        DEBUG_INFO("⚠️ 检测到未完成的OTA，正在清理...");
        esp_ota_abort(_updateHandle);
        _updateStarted = false;
        _updateHandle = 0;
    }
    
    // 获取当前运行的分区
    const esp_partition_t* running = esp_ota_get_running_partition();
    if (running == NULL) {
        DEBUG_ERROR("❌ 无法获取当前运行分区");
        return false;
    }
    DEBUG_INFOF("✅ 当前运行分区: 类型=%d, 子类型=%d, 地址=0x%x", 
                running->type, running->subtype, running->address);

    // 获取下一个可用的 OTA 分区
    _updatePartition = esp_ota_get_next_update_partition(NULL);
    if (_updatePartition == NULL) {
        DEBUG_ERROR("❌ 无法获取更新分区");
        return false;
    }
    DEBUG_INFOF("✅ 目标更新分区: 类型=%d, 子类型=%d, 地址=0x%x, 大小=%d", 
                _updatePartition->type, _updatePartition->subtype, 
                _updatePartition->address, _updatePartition->size);

    // 确保不是在当前运行的分区上更新
    if (_updatePartition == running) {
        DEBUG_ERROR("❌ 更新分区与当前运行分区相同");
        return false;
    }

    // 尝试开始 OTA
    esp_err_t err = esp_ota_begin(_updatePartition, OTA_SIZE_UNKNOWN, &_updateHandle);
    if (err != ESP_OK) {
        DEBUG_ERRORF("❌ OTA开始失败: %s (错误码: %d)", esp_err_to_name(err), err);
        
        if (err == ESP_ERR_OTA_PARTITION_CONFLICT) {
            DEBUG_INFO("🔄 检测到分区冲突，尝试修复...");
            
            // 1. 先中止任何可能的进行中的 OTA
            esp_ota_abort(_updateHandle);
            
            // 2. 标记当前启动的分区为有效
            err = esp_ota_mark_app_valid_cancel_rollback();
            if (err != ESP_OK) {
                DEBUG_ERRORF("❌ 标记当前分区有效失败: %s", esp_err_to_name(err));
            }
            
            // 3. 重新获取更新分区并重试
            _updatePartition = esp_ota_get_next_update_partition(NULL);
            if (_updatePartition == NULL) {
                DEBUG_ERROR("❌ 修复后仍无法获取更新分区");
                return false;
            }
            
            // 4. 重试 OTA 开始
            err = esp_ota_begin(_updatePartition, OTA_SIZE_UNKNOWN, &_updateHandle);
            if (err != ESP_OK) {
                DEBUG_ERRORF("❌ 修复后OTA开始仍然失败: %s (错误码: %d)", esp_err_to_name(err), err);
                return false;
            }
            DEBUG_INFO("✅ 分区冲突已修复，OTA开始成功");
        } else {
            return false;
        }
    }
    
    DEBUG_INFO("✅ OTA更新初始化成功");
    _updateStarted = true;
    updateStatus(OTAStatus::UPDATING);
    return true;
}

bool OTAController::endUpdate() {
    if (!_updateStarted) {
        return false;
    }

    esp_err_t err = esp_ota_end(_updateHandle);
    if (err != ESP_OK) {
        DEBUG_ERRORF("❌ OTA结束失败: %d", err);
        return false;
    }

    err = esp_ota_set_boot_partition(_updatePartition);
    if (err != ESP_OK) {
        DEBUG_ERRORF("❌ 设置启动分区失败: %d", err);
        return false;
    }

    return true;
}

void OTAController::reset() {
    DEBUG_INFO("🔄 重置 OTA 控制器状态");
    
    if (_updateStarted) {
        DEBUG_INFO("⚠️ 中止未完成的 OTA 更新");
        esp_ota_abort(_updateHandle);
    }
    
    _status = OTAStatus::IDLE;
    _totalSize = 0;
    _currentSize = 0;
    _updateStarted = false;
    _updatePartition = nullptr;
    _updateHandle = 0;
    _buffer.clear();
    
    notifyStatus();
}

void OTAController::setBLEServer(BLEServerWrapper* server) {
    _bleServer = server;
    DEBUG_INFO("✅ OTA控制器BLE服务器设置完成");
}

void OTAController::update() {
    // 定期检查状态并更新
} 