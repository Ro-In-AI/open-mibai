#ifndef SERVO_CONTROLLER_H
#define SERVO_CONTROLLER_H

#include <Arduino.h>

class PWMServoController {
private:
    uint8_t pin;                 // 舵机信号线引脚
    uint8_t channel;             // PWM通道
    int currentAngle = 90;          // 初始角度设为90度
    int frequency = 50;         // 50Hz
    int resolution = 16;        // 16位分辨率
    int minPulseWidth = 500;    // 最小脉冲宽度 (μs)
    int maxPulseWidth = 2500;   // 最大脉冲宽度 (μs)
    int minAngle = 0;           // 最小角度
    int maxAngle = 180;         // 最大角度 

public:
    PWMServoController(uint8_t pin, uint8_t channel = 0);           // 构造函数
    void begin();                                                   // 初始化函数
    bool setAngle(int angle);                                       // 设置舵机角度
    int getCurrentAngle() const;                                    // 获取当前角度
    void stop();                                                    // 停止舵机
    void setLimits(                                                 // 设置舵机角度限制
        int minPulse,                                              // 脉冲宽度限制
        int maxPulse,                                             // 脉冲宽度限制
        int minAng,                                               // 角度限制
        int maxAng);                                              // 角度限制
};

#endif
