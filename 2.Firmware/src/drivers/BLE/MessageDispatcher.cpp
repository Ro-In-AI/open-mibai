#include "MessageDispatcher.h"
#include "serial_color_debug.h"

void MessageDispatcher::enqueue(const BLEWriteMessage& msg) {
    std::lock_guard<std::mutex> lock(mutex);
    if (queue.size() >= MAX_SIZE) {
        DEBUG_WARN("⚠️ 写入队列已满，丢弃消息");
        return;
    }
    queue.push_back(msg);
}

bool MessageDispatcher::hasMessage() {
    std::lock_guard<std::mutex> lock(mutex);
    return !queue.empty();
}

BLEWriteMessage MessageDispatcher::pop() {
    std::lock_guard<std::mutex> lock(mutex);
    if (queue.empty()) return {};
    auto msg = queue.front();
    queue.pop_front();
    return msg;
}