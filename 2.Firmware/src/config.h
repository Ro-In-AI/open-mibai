// config.h
#pragma once  // 🧠 防止重复包含（比传统宏更简单安全）

#define ESP32_DEV      // 只需修改这一行来切换板子

#pragma once

// 🧠 只保留一个定义，表示当前使用哪个模块入口
// #define ENTRY_APP_EXAMPLE
// #define ENTRY_TEST_PWM
#define ENTRY_APP_MAIN

#if defined(ESP32_DEV)
  #pragma message("💡 当前使用开发板：ESP32_DEV")
  #define BOARD_NAME "ESP32_DEV"
#else
  #error "🚨 没有指定当前使用的开发板"
#endif