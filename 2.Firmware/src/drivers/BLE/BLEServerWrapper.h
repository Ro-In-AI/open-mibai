// BLEServer.h
#pragma once
#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <queue>
#include <mutex>
#include <map>
#include <functional>
#include <string>
#include "MessageDispatcher.h"

class OTAController; // 前置声明

class BLEServerWrapper {
    friend class WriteCallbackHandler;  // 允许 WriteCallbackHandler（写入回调） 访问私有成员
    friend class ServerCallbacks;       // 允许 ServerCallbacks（服务回调，例如连接状态等） 访问私有成员
    public:
        void begin(MessageDispatcher* dispatcher);      // 加载 ble_config.json 配置
        void notify(const std::string& uuid, const uint8_t* data, size_t len);
        bool isConnected();                             // ✅ 添加：查询连接状态
        void setDisconnectCallback(std::function<void()> cb) { disconnectCallback = cb; }
        void setOTAController(OTAController* ota) { otaController = ota; }

    private:
        bool connected = false;  // 连接状态
        MessageDispatcher* dispatcher;  // 写入分发器指针
        std::map<std::string, BLECharacteristic*> notifyCharacteristics;   // 通知特征对象映射
        bool deviceConnected = false;
        bool oldDeviceConnected = false;
        BLEServer* server = nullptr;
        std::function<void()> disconnectCallback;
        OTAController* otaController = nullptr; // OTA控制器指针
};