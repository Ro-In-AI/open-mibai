#include <Arduino.h>
#include "config.h"
#include "app_router.h"
#include <esp_system.h>  // 添加 ESP32 系统头文件

void setup() {
    Serial.begin(115200);
    runSetup();
}

void loop() {
    // 检查串口输入
    if (Serial.available()) {
        String cmd = Serial.readStringUntil('\n');
        cmd.trim();
        if (cmd == "restart") {
            Serial.println("🔄 正在重启系统...");
            delay(1000);
            esp_restart();  // 重启 ESP32
            return;
        }
    }
    runLoop();
}
