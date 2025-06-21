#include "app_router.h"
#include "config.h"

// 模块按需引入
#ifdef ENTRY_TEST_PWM
  #include "tests/test_PWMServo/test_PWMServo.h"
#elif defined(ENTRY_APP_EXAMPLE)
  #include "apps/app_example/app_example.h"
#elif defined(ENTRY_APP_MAIN)
  #include "apps/app_main/app_main.h"
#else
  #error "❌ 请在 config.h 中定义一个 ENTRY_XXX 宏作为入口模块"
#endif

// 初始化函数
void runSetup() {
#ifdef ENTRY_TEST_PWM
  setup_PWMServo();
#elif defined(ENTRY_APP_EXAMPLE)
  setup_example();
#elif defined(ENTRY_APP_MAIN)
  setup_main();
#endif
}

// 主循环函数
void runLoop() {
#ifdef ENTRY_TEST_PWM
  loop_PWMServo();
#elif defined(ENTRY_APP_EXAMPLE)
  loop_example();
#elif defined(ENTRY_APP_MAIN)
  loop_main();
#endif
}
