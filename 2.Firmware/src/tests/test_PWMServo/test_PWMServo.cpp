#include "test_PWMServo.h"
#include "PWMServoController.h"

PWMServoController servo(18, 6);  // GPIO18, LEDC通道6

void setup_PWMServo() {
    Serial.begin(115200);
    Serial.println("======== [舵机测试启动] ========");
    Serial.println("初始化 PWMServoController...");
    servo.setLimits(500, 2500, 0, 180);
    servo.begin();
    Serial.println("舵机初始化完成 ✅");
    Serial.println("--------------------------------");
}

void loop_PWMServo() {
    static int pos = 0;
    static bool dir = true;

    servo.setAngle(pos);
    Serial.printf("🎯 当前目标角度: %3d° → 实际设置角度: %3d°\n", pos, servo.getCurrentAngle());

    pos += dir ? 5 : -5;
    if (pos >= 180 || pos <= 0) {
        dir = !dir;
        Serial.println("🔁 方向切换");
    }

    delay(50);
}
