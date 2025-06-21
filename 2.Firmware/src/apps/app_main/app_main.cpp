#include "config.h"
#ifdef ENTRY_APP_MAIN

#include "app_main.h"
#include "serial_color_debug.h"
#include "drivers/BLE/BLEServerWrapper.h"
#include "drivers/BLE/MessageDispatcher.h"
#include "controllers/OTAController/OTAController.h"
#include <unordered_map>

BLEServerWrapper bleServer;
MessageDispatcher dispatcher;
TaskHandle_t bleTaskHandle = nullptr;
OTAController otaController;  // 添加OTA控制器实例

std::unordered_map<std::string, MessageConsumer*> uuidHandlerMap = {      // 注册 UUID 与处理函数的映射
    { "ef040001-1000-8000-0080-5f9b34fb0000", &otaController },    // OTAControl
    { "ef040002-1000-8000-0080-5f9b34fb0000", &otaController },    // OTAData
};

// BLE 处理任务句柄
void bleWriteTask(void* pvParameters) {
    while (true) {
        while (dispatcher.hasMessage()) {
            BLEWriteMessage msg = dispatcher.pop();
            if (msg.data.size() == 0) {
                DEBUG_ERRORF("❌ 处理 BLE 消息失败，数据为空，UUID: %s", msg.uuid.c_str());
                continue;
            }

            // 打印接收到的消息详情
            DEBUG_INFOF("📥 收到BLE消息 - UUID: %s, 数据长度: %d", msg.uuid.c_str(), msg.data.size());
            String hex;
            for (uint8_t b : msg.data) {
                char buf[4];
                sprintf(buf, "%02X ", b);
                hex += buf;
            }
            DEBUG_INFOF("📥 消息数据(hex): %s", hex.c_str());

            // 根据 UUID 进行消息分发处理
            if (uuidHandlerMap.count(msg.uuid)) {
                DEBUG_INFOF("✅ 开始处理 UUID: %s", msg.uuid.c_str());
                uuidHandlerMap[msg.uuid]->handleMessage(msg);
                DEBUG_INFOF("✅ 完成处理 UUID: %s", msg.uuid.c_str());
            } else {
                DEBUG_WARNF("⚠️ 未注册的UUID: %s", msg.uuid.c_str());
            }

            vTaskDelay(pdMS_TO_TICKS(1));  // 非常重要！
        }
        vTaskDelay(pdMS_TO_TICKS(10));
    }
}

void printHex(const std::vector<uint8_t>& data) {
    String hex;
    for (uint8_t b : data) {
        char buf[4];
        sprintf(buf, "%02X ", b);
        hex += buf;
    }
    DEBUG_INFOF("✅ 📤 发送状态数据 (hex): %s", hex.c_str());
}

// 触摸状态变化回调函数
void onTouchStateChanged(bool isTouched) {
    // 创建触摸状态数据
    uint8_t touchValue = isTouched ? 1 : 0;
    
    // 通过BLE发送通知
    bleServer.notify(
        "ef030001-1000-8000-0080-5f9b34fb0000",  // TouchRead特征的UUID
        &touchValue,
        sizeof(touchValue)
    );
    
    // 调试信息
    if (isTouched) {
        DEBUG_INFO("触摸传感器被触发");
    } else {
        DEBUG_INFO("触摸传感器释放");
    }
}

void setup_main() {
    Serial.begin(115200);

    DEBUG_INFO("启动完成");
    DEBUG_INFOF("当前开发板: %s", BOARD_NAME);


    // 初始化 BLE 和运动控制器
    bleServer.begin(&dispatcher);
    
    // 初始化OTA控制器
    DEBUG_INFO("正在初始化 OTA 控制器...");
    otaController.begin();
    if (!otaController.initOTA()) {
        DEBUG_ERROR("❌ OTA控制器初始化失败");
        // 继续运行，但 OTA 功能将不可用
    }
    otaController.setBLEServer(&bleServer);
    bleServer.setOTAController(&otaController);
    


    // 创建 BLE 写入处理任务
    xTaskCreatePinnedToCore(
        bleWriteTask,
        "BLEWriteTask",
        8192,
        nullptr,
        1,
        &bleTaskHandle,
        1
    );



    bleServer.setDisconnectCallback([]() {
        otaController.reset();
    });

    DEBUG_INFO("系统初始化完成");
}

void loop_main() {
    // OTA期间暂停高频任务
    if (otaController.getStatus() == OTAStatus::UPDATING) {
        // 只处理OTA相关逻辑，跳过其它高频任务
        otaController.update();
        vTaskDelay(pdMS_TO_TICKS(10));
        return;
    }


    // 根据蓝牙连接状态调整 LED 模式
    static bool lastConnected = false;
    bool currentConnected = bleServer.isConnected();
    
    if (currentConnected != lastConnected) {
        lastConnected = currentConnected;
    }
    


    // 更新OTA控制器状态
    otaController.update();

    vTaskDelay(pdMS_TO_TICKS(10));  // 10ms 延时
}

#endif