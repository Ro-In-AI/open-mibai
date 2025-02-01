import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { useRef, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { RoboEyes } from './components/RoboEyes';

export default function App() {
  // 添加一个状态来控制圆环的显示
  const [showRings, setShowRings] = useState(false);
  
  // 创建三个动画值用于控制三个同心圆的动画
  const ringAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;
  
  // 定义情绪类型
  type EmotionType = 'happy' | 'curious' | 'bubble';

  // 状态管理
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('happy');  // 当前情绪状态
  // 蓝牙相关状态
  const [bluetoothStatus, setBluetoothStatus] = useState('开发中...');  // 蓝牙连接状态
  const [isScanning, setIsScanning] = useState(false);  // 是否正在扫描设备

  // 启动同心圆扩散动画
  /**
   * 启动同心圆扩散动画
   * 该函数为每个圆环创建一个循环动画，实现波纹扩散效果
   */
  const startRingAnimation = () => {
    // 遍历所有圆环动画值
    ringAnims.forEach((anim, index) => {
      // 重置动画初始值为0
      anim.setValue(0);
      
      // 创建循环动画
      Animated.loop(
        // 使用序列动画，按顺序执行多个动画
        Animated.sequence([
          // 第一个动画：圆环从小变大，同时透明度降低
          Animated.timing(anim, {
            toValue: 1,        // 动画目标值
            duration: 2000,    // 动画持续时间（毫秒）
            delay: index * 400,  // 错开每个圆环的动画时间，营造波纹效果
            useNativeDriver: false,  // 不使用原生动画驱动，因为需要改变非transform属性
          }),
          // 第二个动画：瞬间重置动画值
          Animated.timing(anim, {
            toValue: 0,        // 重置为初始值
            duration: 0,       // 立即执行，无过渡时间
            useNativeDriver: false,
          })
        ])
      ).start();  // 开始执行循环动画
    });
  };
  // 模拟蓝牙扫描和连接过程
  const startScan = async () => {
    setBluetoothStatus('正在扫描设备...');
    setIsScanning(true);
    setShowRings(true);
    startRingAnimation();

    setTimeout(() => {
      setBluetoothStatus('已连接');
      setIsScanning(false);
      
      ringAnims.forEach(anim => anim.stopAnimation());
      
      Animated.parallel(
        ringAnims.map(anim =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          })
        )
      ).start(() => {
        ringAnims.forEach(anim => anim.setValue(0));
        setShowRings(false);  // 在动画完成后隐藏圆环
      });
    }, 3000);
  };

  // 处理机器人点击事件
  const handleRobotPress = () => {
    if (bluetoothStatus === '已连接') {
      // 如果已连接，则断开连接
      setBluetoothStatus('开发中...');
      setIsScanning(false);
    } else {
      // 如果未连接，则开始扫描
      startScan();
    }
  };

  // 切换表情：在三种情绪状态间循环
  const changeEmotion = () => {
    const emotionsList: EmotionType[] = ['happy', 'curious', 'bubble'];
    const nextEmotion = emotionsList[(emotionsList.indexOf(currentEmotion) + 1) % emotionsList.length];
    setCurrentEmotion(nextEmotion);
  };

  return (
    <View style={styles.container}>
      {/* 只在 showRings 为 true 时渲染圆环 */}
      {showRings && ringAnims.map((anim, index) => (
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
                  outputRange: [0.01, 2]  // 从一个很小的点开始
                })
              }]
            }
          ]}
        />
      ))}

      {/* 机器人眼睛部分 */}
      <RoboEyes currentEmotion={currentEmotion} onPress={handleRobotPress} />

      {/* 状态面板 */}
      <View style={styles.statusPanel}>
        <Text style={styles.statusText}>蓝牙状态: {bluetoothStatus}</Text>
        <Text style={styles.statusText}>点击机器人开始连接</Text>
      </View>

      <TouchableOpacity style={styles.blinkButton} onPress={changeEmotion}>
        <Text style={styles.buttonText}>Change Emotion</Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
}

// 修改 ring 样式
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',  // 黑色背景
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 4,  // 增加边框宽度使小点时更明显
    borderColor: '#00f7ff',
    opacity: 0.5,
    top: '50%',
    left: '50%',
    marginLeft: -125,
    marginTop: -125,
  },

  statusPanel: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',  // 半透明黑色背景
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#00f7ff',  // 青色边框
  },
  statusText: {
    color: '#ffffff',  // 白色文字
    fontSize: 16,
    marginBottom: 5,
  },
  blinkButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#00f7ff',  // 青色按钮
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10
  },
  buttonText: {
    color: '#000',  // 黑色文字
    fontSize: 16,
  },
});