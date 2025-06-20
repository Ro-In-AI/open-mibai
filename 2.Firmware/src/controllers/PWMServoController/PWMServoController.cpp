#include "PWMServoController.h"

// 构造函数：保存引脚和通道
PWMServoController::PWMServoController(uint8_t pin, uint8_t channel)
    : pin(pin), channel(channel) {}

// 初始化 PWM 输出（调用此函数后才能控制）
void PWMServoController::begin() {
    ledcSetup(channel, frequency, resolution);
    ledcAttachPin(pin, channel);
    setAngle(currentAngle);  // 设置初始角度
}

// 设置舵机角度（会自动限制在 minAngle ~ maxAngle 内）
bool PWMServoController::setAngle(int angle) {
    if (angle < minAngle) angle = minAngle;
    if (angle > maxAngle) angle = maxAngle;

    // 角度映射为脉冲宽度（单位 μs）
    int us = map(angle, minAngle, maxAngle, minPulseWidth, maxPulseWidth);

    // 将 us 映射为占空比（基于 20ms 周期 = 50Hz）
    uint32_t duty = (us * (1 << resolution)) / 20000;

    ledcWrite(channel, duty);
    currentAngle = angle;
    return true;
}

// 获取当前设置的角度
int PWMServoController::getCurrentAngle() const {
    return currentAngle;
}

// 停止 PWM 输出（舵机会保持当前角度或断电松弛）
void PWMServoController::stop() {
    ledcWrite(channel, 0); // 设置占空比为 0，相当于断 PWM
}

// 设置脉冲宽度 + 角度范围（更灵活）
void PWMServoController::setLimits(int minPulse, int maxPulse, int minAng, int maxAng) {
    minPulseWidth = minPulse;
    maxPulseWidth = maxPulse;
    minAngle = minAng;
    maxAngle = maxAng;
}
