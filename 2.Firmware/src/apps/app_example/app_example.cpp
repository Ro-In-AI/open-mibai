#include "app_example.h"
#include <Arduino.h>

void setup_example() {
    Serial.println("🧪 示例模块 setup 启动！");
}

void loop_example() {
    Serial.println("👋 Hello from example loop!");
    delay(1000);  // 1秒打印一次
}
