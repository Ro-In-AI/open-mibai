// BLEServer.cpp
#include "BLEServerWrapper.h"
#include <ArduinoJson.h>
#include <FS.h>         // 包含文件系统库，用于文件操作
#include <SPIFFS.h>     // 包含 SPIFFS 库，用于文件系统操作
#include "serial_color_debug.h"
#include "controllers/OTAController/OTAController.h"

class WriteCallbackHandler : public BLECharacteristicCallbacks {
    public:
    WriteCallbackHandler(const std::string& uuid, MessageDispatcher* dispatcher, BLEServerWrapper* server)
    : uuid(uuid),  dispatcher(dispatcher), server(server) {}

    void onWrite(BLECharacteristic* characteristic) override {
        std::string value = characteristic->getValue();
        // OTA数据包直通处理
        if (uuid == "ef040002-1000-8000-0080-5f9b34fb0000" && server && server->otaController) {
            BLEWriteMessage msg{uuid, std::vector<uint8_t>(value.begin(), value.end())};
            server->otaController->handleMessage(msg);
        } else {
            dispatcher->enqueue({ uuid, std::vector<uint8_t>(value.begin(), value.end()) });
        }
    }

    private:
        std::string uuid;                                                           // 特征 UUID
        MessageDispatcher* dispatcher;                                             // 写入分发器指针
        BLEServerWrapper* server;                                                  // BLEServerWrapper指针
};

class ServerCallbacks : public BLEServerCallbacks {
    public:
        ServerCallbacks(BLEServerWrapper* wrapper) : wrapper(wrapper) {}
    
        void onConnect(BLEServer* pServer) override {
            wrapper->deviceConnected = true;
            DEBUG_INFO("🔗 BLE device connected");
        }
    
        void onDisconnect(BLEServer* pServer) override {
            wrapper->deviceConnected = false;
            DEBUG_WARN("❌ BLE device disconnected");
            // Optionally restart advertising
            pServer->getAdvertising()->start();
            DEBUG_INFO("📣 Restarted BLE advertising");
            // 调用外部注册的回调
            if (wrapper->disconnectCallback) {
                wrapper->disconnectCallback();
            }
        }
    
    private:
        BLEServerWrapper* wrapper;
    };

void BLEServerWrapper::begin(MessageDispatcher* dispatcherPtr) {
    dispatcher = dispatcherPtr;                         // 初始化写入分发器指针

    SPIFFS.begin(true);                                 // 初始化 SPIFFS 文件系统       
    File file = SPIFFS.open("/ble_config.json");        // 打开配置文件
    if (!file) {                                        // 检查文件是否成功打开
        // Serial.println("❌ Failed to open ble_config.json");
        DEBUG_ERROR("❌ Failed to open ble_config.json");
        return;
    }

    // Step 1️⃣：尝试从 JSON 配置中读取 ble_json_buffer_size
    size_t estimatedSize = file.size();  // 获取文件大小
    size_t jsonBufferSize = 4096;        // 默认 buffer 大小
    String deviceName = "CLO";  // 默认值
    {           // 括号作用域，作用是为了在这里创建一个临时的 JSON 文档，避免影响后面的代码
        DynamicJsonDocument docHead(512);  // 临时文档
        DeserializationError headErr = deserializeJson(docHead, file);
        // Serial.println(headErr.c_str());  // 打印错误信息
        // Serial.println(docHead.containsKey("ble_json_buffer_size"));  // 检查是否包含 "ble_json_buffer_size" 键
        if (headErr.c_str() == "NoMemory" && docHead.containsKey("ble_json_buffer_size")) {              // 如果包含 "ble_json_buffer_size" 键（内存肯定不足，前面我们设置了一个小内存），就使用配置的大小
            jsonBufferSize = docHead["ble_json_buffer_size"].as<size_t>();
            DEBUG_INFOF("📦 使用配置指定 JSON 缓冲区大小: %d 字节", jsonBufferSize);
        } else {
            // 如果没有指定大小，使用默认大小
            DEBUG_INFOF("📦 使用默认 JSON 缓冲区大小: %d 字节（文件大小约 %d 字节）", jsonBufferSize, estimatedSize);
        }
        if (docHead.containsKey("ble_device_name")) {
            deviceName = docHead["ble_device_name"].as<const char*>();
            DEBUG_INFOF("🔧 使用配置的 BLE 名称: %s", deviceName.c_str());
        }
        // 重新 seek 到文件开头（⚠️ 关键点）
        file.seek(0);  // 重置读指针，无需关闭重开  
    }
    // Step 2️⃣：尝试加载整个 JSON 配置
    // 关于DynamicJsonDocument详细可见博客：https://better-town-aff.notion.site/ESP32-DynamicJsonDocument-1ea63f1a31c380369decfee9585f0fc5?pvs=4
    DynamicJsonDocument doc(jsonBufferSize);
    DeserializationError err = deserializeJson(doc, file);      // 反序列化 JSON 数据
    
    // Step 3️⃣：若失败，则 fallback 使用估算内存重试
    if (err) {
        DEBUG_WARNF("JSON 解析失败，尝试使用估算缓冲区（%.0f 字节）", estimatedSize * 1.3);
    
        file.seek(0);
        size_t fallbackSize = static_cast<size_t>(estimatedSize * 1.3);
        DynamicJsonDocument fallbackDoc(fallbackSize);
        DeserializationError fallbackErr = deserializeJson(fallbackDoc, file);
    
        if (fallbackErr) {
            DEBUG_ERRORF("fallback 解析也失败（大小: %d 字节）: %s", fallbackSize, fallbackErr.c_str());
            return;
        }
    
        DEBUG_INFOF("fallback 解析成功，实际使用大小: %d 字节", fallbackSize);
        doc = std::move(fallbackDoc);       // 使用 std::move 转移所有权
    }

    BLEDevice::init(deviceName.c_str());                     // 初始化 BLE 设备，设置设备名称    
    DEBUG_INFOF("🔧 BLE设备初始化完成，设备名称: %s", deviceName.c_str());  // 添加调试信息
    BLEDevice::setMTU(512);                             // 设置 MTU 上限，客户端需支持
    server = BLEDevice::createServer();                 // 用成员变量存储
    server->setCallbacks(new ServerCallbacks(this));    // ✅ 设置连接回调


    BLEAdvertising* advertising = BLEDevice::getAdvertising();  // 获取 BLE 广播对象

    for (JsonObject service : doc["services"].as<JsonArray>()) {        // 遍历服务数组
        const char* serviceUUID = service["uuid"];                      // 获取服务 UUID
        const char* serviceName = service["name"];                      // 获取服务名称(但是上位机不会显示，所以这里也不需要使用)
        
        // ✅ 校验 serviceUUID 是否合法（4 或 36 个字符）
        if (!serviceUUID || (strlen(serviceUUID) != 4 && strlen(serviceUUID) != 36)) {
            // Serial.printf("❌ Invalid Service UUID for %s: %s\n", serviceName, serviceUUID ? serviceUUID : "null"); // 打印错误信息
            DEBUG_ERRORF("❌ Invalid Service UUID for %s: %s", serviceName, serviceUUID? serviceUUID : "null");
            continue;  // 跳过这个服务
        }

        BLEService* bleService = server->createService(serviceUUID);    // 创建服务对象
        advertising->addServiceUUID(serviceUUID);                       // 添加服务 UUID 到广播中   

        for (JsonObject ch : service["characteristics"].as<JsonArray>()) {      // 遍历特征数组
            const char* uuid = ch["uuid"];                              // 获取特征 UUID
            const char* name = ch["name"];                              // 获取特征名称
            const char* desc = ch["description"] | "";                  // 获取特征描述，如果没有则默认为空字符串
            const char* format = ch["value_format"] | "bytes";                // 获取特征格式，默认为 "bytes"

            JsonArray typeArray = ch["type"];                           // 获取特征类型数组

            // ✅ 校验 characteristic UUID 是否合法
            if (!uuid || (strlen(uuid) != 4 && strlen(uuid) != 36)) {
                // Serial.printf("❌ Invalid Characteristic UUID for %s: %s\n", name, uuid ? uuid : "null"); // 打印错误信息
                DEBUG_ERRORF("❌ Invalid Characteristic UUID for %s: %s", name, uuid ? uuid : "null");
                continue;  // 跳过这个特征
            }

            uint32_t props = 0;                                         // 初始化特征属性为 0  
            for (const char* t : typeArray) {                           // 遍历特征类型数组
                if (strcmp(t, "READ") == 0)      props |= BLECharacteristic::PROPERTY_READ;                 // 读取属性
                if (strcmp(t, "WRITE") == 0)     props |= BLECharacteristic::PROPERTY_WRITE;                // 写入属性
                if (strcmp(t, "NOTIFY") == 0)    props |= BLECharacteristic::PROPERTY_NOTIFY;               // 通知属性
                if (strcmp(t, "WRITE_NO_RESPONSE") == 0)  props |= BLECharacteristic::PROPERTY_WRITE_NR;    // 无响应写入属性
            }

            BLECharacteristic* characteristic = bleService->createCharacteristic(uuid, props);      // 创建特征对象

            // 添加 CCCD 描述符
            if (props & BLECharacteristic::PROPERTY_NOTIFY || props & BLECharacteristic::PROPERTY_INDICATE) {
                BLEDescriptor* cccd = new BLEDescriptor(BLEUUID((uint16_t)0x2902));
                characteristic->addDescriptor(cccd);
            }

            if (ch.containsKey("value")) {  // 如果特征对象包含 "value" 键
                if (strcmp(format, "bytes") == 0) {  // 如果格式为字节数组
                    JsonArray arr = ch["value"];  // 获取字节数组
                    
                    // DEBUG_INFOF("字节数组长度: %d", arr.size());  // 打印字节数组长度
                    if (arr.size() > 0) {  // 如果字节数组非空
                        std::vector<uint8_t> val;  // 创建字节数组
                        for (auto v : arr) val.push_back(v.as<uint8_t>());  // 遍历字节数组并添加到字节数组中
                        characteristic->setValue(val.data(), val.size());  // 设置字节数组值
                        // DEBUG_INFOF("设置字节值，共 %d 字节", val.size());
                        // DEBUG_INFOF("设置字节数组值: %s", val.data());  // 打印设置的字节数组值
                    } else {
                        // DEBUG_INFOF("字节数组为空, 无需设置值");
                    }
                } else if (strcmp(format, "string") == 0) {  // 如果格式为字符串
                    characteristic->setValue(ch["value"].as<const char*>());  // 设置字符串值
                    // DEBUG_INFOF("设置字符串值: %s", ch["value"].as<const char*>());
                } else if (strcmp(format, "json") == 0) {  // 如果格式为 JSON
                    String jsonStr;  // 创建字符串对象
                    serializeJson(ch["value"], jsonStr);  // 序列化 JSON 对象为字符串
                    characteristic->setValue(jsonStr.c_str());  // 设置 JSON 值
                } else if (strcmp(format, "int") == 0) {  // 如果格式为整数
                    uint8_t val = ch["value"].as<uint8_t>();  // 获取整数值
                    characteristic->setValue(&val, 1);  // 设置整数值
                }
            }
            

            if (props & BLECharacteristic::PROPERTY_WRITE || props & BLECharacteristic::PROPERTY_WRITE_NR) {                        // 如果特征对象包含写入属性，则设置回调函数
                characteristic->setCallbacks(new WriteCallbackHandler(uuid, dispatcher, this)); // 设置写入回调函数
            }
            if (props & BLECharacteristic::PROPERTY_NOTIFY || props & BLECharacteristic::PROPERTY_INDICATE) {   // 如果特征对象包含通知或指示属性，则设置通知回调函数
                notifyCharacteristics[uuid] = characteristic;                           // 将特征对象添加到通知特征对象映射中
            }

            // Optional BLE descriptor (0x2901)
            if (strlen(desc) > 0) {                                                     // 如果描述字符串长度大于 0，则创建描述对象并添加到特征对象中
                BLEDescriptor* userDesc = new BLEDescriptor(BLEUUID((uint16_t)0x2901)); // 创建描述对象
                userDesc->setValue(desc);                                               // 设置描述值
                characteristic->addDescriptor(userDesc);                                // 添加描述对象到特征对象中
            }

            // Serial.printf("✅ Registered %s (%s): %s\n", name, uuid, desc);              // 打印注册的特征对象信息
            DEBUG_INFOF("✅ Registered %s (%s): %s", name, uuid, desc);                     // 打印注册的特征对象信息
        }

        bleService->start();            // 启动服务对象
    }

    advertising->start();           // 启动广播
    // Serial.println("📶 BLE Advertising started");   // 打印广播启动信息
    DEBUG_INFO("📶 BLE Advertising started");   // 打印广播启动信息
}

bool BLEServerWrapper::isConnected() {
    return deviceConnected;
}

// 通知函数
void BLEServerWrapper::notify(const std::string& uuid, const uint8_t* data, size_t len) {
    auto it = notifyCharacteristics.find(uuid);
    if (it != notifyCharacteristics.end()) {
        it->second->setValue(std::string((const char*)data, len));               // 设置特征值
        it->second->notify();               // 发送通知（其中，second是指特征值的长度） 
    }
}