import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, TouchableOpacity } from 'react-native';

// 表情配置对象，定义了不同情绪状态下眼睛的样式
const emotions = {
  happy: {
    eyes: { width: 40, height: 25, borderRadius: 8 },  // 开心状态：矩形圆角眼睛
  },
  curious: {
    eyes: { width: 45, height: 20, borderRadius: 6 },  // 好奇状态：扁矩形圆角眼睛
  },
  bubble: {
    eyes: { width: 50, height: 30, borderRadius: 10 },  // 泡泡状态：大矩形圆角眼睛
  }
};

// 定义组件的属性类型
type RoboEyesProps = {
  currentEmotion: 'happy' | 'curious' | 'bubble';
  onPress?: () => void;
};

export const RoboEyes: React.FC<RoboEyesProps> = ({ currentEmotion, onPress }) => {
  // 创建左右眼睛高度的动画值
  const leftEyeHeightAnim = useRef(new Animated.Value(emotions[currentEmotion].eyes.height)).current;
  const rightEyeHeightAnim = useRef(new Animated.Value(emotions[currentEmotion].eyes.height)).current;

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

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.eyesContainer}>
        {/* 左眼 */}
        <Animated.View
          style={[styles.eye, {
            width: emotions[currentEmotion].eyes.width,
            height: leftEyeHeightAnim,
            borderRadius: emotions[currentEmotion].eyes.borderRadius,
          }]}
        />
        {/* 右眼 */}
        <Animated.View
          style={[styles.eye, {
            width: emotions[currentEmotion].eyes.width,
            height: rightEyeHeightAnim,
            borderRadius: emotions[currentEmotion].eyes.borderRadius,
          }]}
        />
      </View>
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
  },
  eye: {
    backgroundColor: '#00f7ff',  // 青色眼睛
    margin: 5,
  },
});