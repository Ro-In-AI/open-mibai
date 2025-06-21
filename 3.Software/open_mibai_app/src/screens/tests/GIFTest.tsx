import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';
import SoundPlayer from "react-native-sound-player";

// 定义所有的测试资源
const testAssets = [
  {
    name: 'bubble',
    gif: require('../../assets/gifs/bubble.gif'),
    sound: require('../../assets/sounds/bubble.mp3')
  },
  {
    name: 'curious',
    gif: require('../../assets/gifs/curious.gif'),
    sound: require('../../assets/sounds/curious.mp3')
  },
  {
    name: 'happy',
    gif: require('../../assets/gifs/happy.gif'),
    sound: require('../../assets/sounds/rhappy.mp3')
  },
  {
    name: 'sad',
    gif: require('../../assets/gifs/sad.gif'),
    sound: require('../../assets/sounds/rworried.mp3')
  },
  {
    name: 'shock',
    gif: require('../../assets/gifs/shock.gif'),
    sound: require('../../assets/sounds/rscream.mp3')
  },
  {
    name: 'xx',
    gif: require('../../assets/gifs/xx.gif'),
    sound: require('../../assets/sounds/bubble.mp3') // 使用 bubble 作为默认音频
  }
];

const GIFTest: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const playCurrentAsset = () => {
    const currentAsset = testAssets[currentIndex];
    try {
      SoundPlayer.playAsset(currentAsset.sound);
      console.log(`正在播放: ${currentAsset.name}`);
    } catch (e) {
      console.log(`无法播放音频文件 ${currentAsset.name}:`, e);
    }
  };

  const nextAsset = () => {
    setCurrentIndex((prev) => (prev + 1) % testAssets.length);
  };

  const prevAsset = () => {
    setCurrentIndex((prev) => (prev - 1 + testAssets.length) % testAssets.length);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  // 设置音频播放完成的监听器
  useEffect(() => {
    const finishSubscription = SoundPlayer.addEventListener('FinishedPlaying', ({ success }) => {
      console.log('音频播放完成:', success);
      if (success && isAutoPlaying) {
        // 音频播放完成后，如果是自动播放模式，则切换到下一个
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % testAssets.length);
        }, 500); // 稍微延迟一下，让GIF有时间完整显示
      }
    });

    const loadingSubscription = SoundPlayer.addEventListener('FinishedLoading', ({ success }) => {
      console.log('音频加载完成:', success);
    });

    // 如果音频播放出错，也要处理自动播放
    const handlePlaybackError = () => {
      console.log('音频播放出错');
      if (isAutoPlaying) {
        // 如果音频播放失败，在自动播放模式下仍然切换到下一个
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % testAssets.length);
        }, 2000); // 等待2秒后切换
      }
    };

    return () => {
      finishSubscription?.remove();
      loadingSubscription?.remove();
    };
  }, [isAutoPlaying]);

  // 当索引改变时播放音频
  useEffect(() => {
    playCurrentAsset();
  }, [currentIndex]);

  const currentAsset = testAssets[currentIndex];

  return (
    <View style={styles.container}>
      {/* 显示当前测试的资源信息 */}
      <Text style={styles.infoText}>
        测试中: {currentAsset.name} ({currentIndex + 1}/{testAssets.length})
      </Text>
      
      {/* 显示自动播放状态 */}
      {isAutoPlaying && (
        <Text style={styles.statusText}>
          🔄 自动播放中...（播放完成后自动切换）
        </Text>
      )}
      
      {/* 显示当前GIF */}
      <FastImage
        style={styles.image}
        source={currentAsset.gif}
        resizeMode={FastImage.resizeMode.contain}
      />
      
      {/* 控制按钮 */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.button} onPress={prevAsset}>
          <Text style={styles.buttonText}>上一个</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={playCurrentAsset}>
          <Text style={styles.buttonText}>重播</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={nextAsset}>
          <Text style={styles.buttonText}>下一个</Text>
        </TouchableOpacity>
      </View>
      
      {/* 自动播放控制 */}
      <TouchableOpacity 
        style={[styles.autoPlayButton, isAutoPlaying && styles.autoPlayButtonActive]} 
        onPress={toggleAutoPlay}
      >
        <Text style={styles.buttonText}>
          {isAutoPlaying ? '停止自动播放' : '开始自动播放'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  statusText: {
    color: '#4CAF50',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  image: {
    width: 300,
    height: 300,
    marginBottom: 30,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  autoPlayButton: {
    backgroundColor: '#444',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  autoPlayButtonActive: {
    backgroundColor: '#666',
  },
  hiddenVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    opacity: 0,
  },
});

export default GIFTest;
