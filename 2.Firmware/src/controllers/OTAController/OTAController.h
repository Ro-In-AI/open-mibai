#pragma once

#include <Arduino.h>
#include <Update.h>
#include <esp_ota_ops.h>
#include <esp_partition.h>
#include <esp_system.h>
#include <vector>
#include <string>
#include "MessageConsumer.h"
#include "drivers/BLE/BLEServerWrapper.h"

// OTA状态枚举
enum class OTAStatus {
    IDLE = 0,           // 空闲状态
    READY = 1,          // 准备升级
    UPDATING = 2,       // 升级中
    COMPLETE = 3,       // 升级完成
    FAILED = 4          // 升级失败
};

// OTA控制命令枚举
enum class OTAControlCommand {
    START = 0,          // 开始升级
    CANCEL = 1,         // 取消升级
    CONFIRM = 2         // 确认升级
};

class OTAController : public MessageConsumer {
public:
    OTAController();
    void begin() override;  // 实现基类的虚函数
    bool initOTA();        // 新增：实际的初始化函数
    void handleMessage(const BLEWriteMessage& msg) override;
    void update();
    void setBLEServer(BLEServerWrapper* server);
    void reset();
    OTAStatus getStatus() const { return _status; }

private:
    void processControlCommand(const std::vector<uint8_t>& data);
    void processDataPacket(const std::vector<uint8_t>& data);
    void updateStatus(OTAStatus newStatus);
    void notifyStatus();
    bool startUpdate();
    bool endUpdate();

    OTAStatus _status;
    size_t _totalSize;
    size_t _currentSize;
    bool _updateStarted;
    const esp_partition_t* _updatePartition;
    esp_ota_handle_t _updateHandle;
    std::vector<uint8_t> _buffer;
    static const size_t BUFFER_SIZE = 1024;  // 1KB缓冲区
    BLEServerWrapper* _bleServer = nullptr;
    static const char* OTA_STATUS_UUID;
}; 