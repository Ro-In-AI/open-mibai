import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { TouchableOpacity } from 'react-native';

// 表情配置
const emotions = {
  happy: {
    eyes: { width: 30, height: 30, borderRadius: 15 },
  },
  curious: {
    eyes: { width: 35, height: 25, borderRadius: 12 },
  },
  bubble: {
    eyes: { width: 40, height: 40, borderRadius: 20 },
  }
};

export default function App() {
  const ringAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;
  
  // 替换原来的 ringAnim
  // const ringAnim = useRef(new Animated.Value(0)).current;
  
  type EmotionType = 'happy' | 'curious' | 'bubble';

  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('happy');
  const leftEyeHeightAnim = useRef(new Animated.Value(emotions[currentEmotion].eyes.height)).current;
  const rightEyeHeightAnim = useRef(new Animated.Value(emotions[currentEmotion].eyes.height)).current;

  const [bluetoothStatus, setBluetoothStatus] = useState('开发中...');
  const [isScanning, setIsScanning] = useState(false);

  // 监听情绪变化，更新眼睛高度
  useEffect(() => {
    const newEyeHeight = emotions[currentEmotion].eyes.height;
    leftEyeHeightAnim.setValue(newEyeHeight);
    rightEyeHeightAnim.setValue(newEyeHeight);
  }, [currentEmotion]);

  // 环形动画
  const startRingAnimation = () => {
    ringAnims.forEach((anim, index) => {
      anim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            delay: index * 400, // 错开每个圆环的动画时间
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          })
        ])
      ).start();
    });
  };

  // 模拟蓝牙扫描和连接
  const startScan = async () => {
    setBluetoothStatus('正在扫描设备...');
    setIsScanning(true);
    startRingAnimation();

    setTimeout(() => {
      setBluetoothStatus('已连接');
      setIsScanning(false);
      
      // 创建淡出动画
      ringAnims.forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: 0,
          duration: 1000, // 1秒的淡出时间
          useNativeDriver: false,
        }).start(() => {
          // 动画结束后重置动画值
          anim.setValue(0);
        });
      });
    }, 3000);
  };

  const handleRobotPress = () => {
    if (bluetoothStatus !== '已连接') {
      startScan();
    }
  };

  // 眨眼动画函数
  const blink = () => {
    Animated.sequence([
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

  // 切换表情函数
  const changeEmotion = () => {
    const emotionsList: EmotionType[] = ['happy', 'curious', 'bubble'];
    const nextEmotion = emotionsList[(emotionsList.indexOf(currentEmotion) + 1) % emotionsList.length];
    setCurrentEmotion(nextEmotion);
  };

  return (
    <View style={styles.container}>
      {ringAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.ring,
            {
              opacity: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 0]
              }),
              transform: [{
                scale: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 2]
                })
              }]
            }
          ]}
        />
      ))}
      
      <TouchableOpacity onPress={handleRobotPress}>
        <View style={styles.eyesContainer}>
          <Animated.View
            style={[styles.eye, {
              width: emotions[currentEmotion].eyes.width,
              height: leftEyeHeightAnim,
              borderRadius: emotions[currentEmotion].eyes.borderRadius,
            }]}
          />
          <Animated.View
            style={[styles.eye, {
              width: emotions[currentEmotion].eyes.width,
              height: rightEyeHeightAnim,
              borderRadius: emotions[currentEmotion].eyes.borderRadius,
            }]}
          />
        </View>
      </TouchableOpacity>

      <View style={styles.statusPanel}>
        <Text style={styles.statusText}>蓝牙状态: {bluetoothStatus}</Text>
        <Text style={styles.statusText}>点击机器人开始连接</Text>
      </View>

      <TouchableOpacity style={styles.blinkButton} onPress={blink}>
        <Text style={styles.buttonText}>Blink</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.blinkButton} onPress={changeEmotion}>
        <Text style={styles.buttonText}>Change Emotion</Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 2,
    borderColor: '#00f7ff',
    opacity: 0.5,
  },
  eyesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: 100,
    marginBottom: 20,
  },
  eye: {
    backgroundColor: '#00f7ff',
    margin: 5,
  },
  statusPanel: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#00f7ff',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 5,
  },
  blinkButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#00f7ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
  },
});
