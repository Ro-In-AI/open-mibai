import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, TouchableOpacity, Dimensions } from 'react-native';

// 表情配置对象，定义了不同情绪状态下眼睛的样式
const emotions = {
  default: {
    eyes: { width: 50, height: 72, borderRadius: 15 },  // 默认状态：正方形眼睛
  },
  exploring: {
    eyes: { width: 50, height: 72, borderRadius: 15 },  // 探索状态：竖直长方形眼睛
  }
};

// 定义组件的属性类型
type RoboEyesProps = {
  currentEmotion: 'default' | 'exploring';
  onPress?: () => void;
};

export const RoboEyes: React.FC<RoboEyesProps> = ({ currentEmotion, onPress }) => {
  // 创建左右眼睛高度的动画值（用于眨眼）
  const leftEyeHeightAnim = useRef(new Animated.Value(emotions[currentEmotion].eyes.height)).current;
  const rightEyeHeightAnim = useRef(new Animated.Value(emotions[currentEmotion].eyes.height)).current;

  // 创建眼睛容器的位置动画（用于探索/idle效果）
  const containerAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // 监听情绪变化，更新眼睛高度
  useEffect(() => {
    const newEyeHeight = emotions[currentEmotion].eyes.height;
    leftEyeHeightAnim.setValue(newEyeHeight);
    rightEyeHeightAnim.setValue(newEyeHeight);
  }, [currentEmotion]);

  // 自动眨眼定时器
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      // 随机间隔3-5秒眨眼
      const randomDelay = Math.random() * 2000 + 3000; // 3000-5000ms
      setTimeout(blink, randomDelay);
    }, 5000);
    return () => clearInterval(blinkInterval);
  }, []);

  // 眨眼动画：眼睛高度从正常变为0再恢复
  const blink = () => {
    Animated.sequence([
      // 闭眼动画
      Animated.parallel([
        Animated.timing(leftEyeHeightAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(rightEyeHeightAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: false,
        }),
      ]),
      // 睁眼动画
      Animated.parallel([
        Animated.timing(leftEyeHeightAnim, {
          toValue: emotions[currentEmotion].eyes.height,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(rightEyeHeightAnim, {
          toValue: emotions[currentEmotion].eyes.height,
          duration: 100,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  };

  // 探索状态（Exploring/Idle）的动画：眼睛容器随机移动，范围根据屏幕尺寸和预留边距计算
  useEffect(() => {
    let exploringAnimation: Animated.CompositeAnimation | null = null;
    // 获取屏幕尺寸
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    // 眼睛容器尺寸（与 styles 中 eyesContainer.width 保持一致）
    const containerWidth = 100;
    // 这里假设眼睛容器高度大约为 60（根据眼睛尺寸和 margin 可自行调整）
    const containerHeight = 60;
    // 定义边距，保证眼睛不会贴边
    const horizontalMargin = 20;
    const verticalMargin = 20;
    // 计算允许的最大偏移（容器中心位于屏幕中心时，左右最大可偏移的距离）
    const maxOffsetX = (screenWidth - containerWidth - horizontalMargin * 2) / 2;
    // const maxOffsetY = (screenHeight - containerHeight - verticalMargin * 2) / 2;
    const maxOffsetY = 250; // 将垂直探索范围固定为 500

    const animateExploring = () => {
      // 在 [-maxOffsetX, maxOffsetX] 和 [-maxOffsetY, maxOffsetY] 范围内生成随机偏移
      const randomX = Math.random() * 2 * maxOffsetX - maxOffsetX;
      const randomY = Math.random() * 2 * maxOffsetY - maxOffsetY;
      exploringAnimation = Animated.timing(containerAnim, {
        toValue: { x: randomX, y: randomY },
        duration: 4000,
        useNativeDriver: true,
      });
      exploringAnimation.start(() => {
        // 若当前仍为探索状态，则继续下一个随机动画
        if (currentEmotion === 'exploring') {
          animateExploring();
        }
      });
    };

    if (currentEmotion === 'exploring') {
      animateExploring();
    } else {
      // 非探索状态时，将容器位置重置为中心
      containerAnim.setValue({ x: 0, y: 0 });
    }

    return () => {
      if (exploringAnimation) {
        exploringAnimation.stop();
      }
    };
  }, [currentEmotion, containerAnim]);

  return (
    <TouchableOpacity onPress={onPress}>
      {/* 用 Animated.View 包裹眼睛容器，实现探索状态下的位置动画 */}
      <Animated.View style={[styles.eyesContainer, { transform: containerAnim.getTranslateTransform() }]}>
        {/* 左眼 */}
        <Animated.View
          style={[
            styles.eye,
            {
              width: emotions[currentEmotion].eyes.width,
              height: leftEyeHeightAnim,
              borderRadius: emotions[currentEmotion].eyes.borderRadius,
            },
          ]}
        />
        {/* 右眼 */}
        <Animated.View
          style={[
            styles.eye,
            {
              width: emotions[currentEmotion].eyes.width,
              height: rightEyeHeightAnim,
              borderRadius: emotions[currentEmotion].eyes.borderRadius,
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

// 样式定义
const styles = StyleSheet.create({
  eyesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: 100,
    marginBottom: 20,
    alignSelf: 'center', // 保证容器居中
  },
  eye: {
    backgroundColor: '#00f7ff',  // 青色眼睛
    margin: 5,
  },
});

export default RoboEyes;
