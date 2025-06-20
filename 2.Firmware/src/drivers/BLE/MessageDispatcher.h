#pragma once
#include <deque>
#include <vector>
#include <string>
#include <mutex>

struct BLEWriteMessage {            // BLE 写入消息结构体
    std::string uuid;               // 特征 UUID
    std::vector<uint8_t> data;      // 数据
};

class MessageDispatcher {
public:
    void enqueue(const BLEWriteMessage& msg);       // 添加消息到队列
    bool hasMessage();                              // 检查队列是否有消息   
    BLEWriteMessage pop();                          // 从队列中取出消息

private:
    std::deque<BLEWriteMessage> queue;          // 消息队列
    std::mutex mutex;                           // 互斥锁，用于线程安全
    const size_t MAX_SIZE = 256;                // 队列最大大小，适配高频OTA
};
