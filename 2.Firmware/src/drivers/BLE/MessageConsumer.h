#pragma once
#include <MessageDispatcher.h>  // 引入消息分发器头文件

class MessageConsumer {
    public:
        virtual void begin() = 0;
        virtual void handleMessage(const BLEWriteMessage& msg) = 0;
        virtual ~MessageConsumer() = default;
    };