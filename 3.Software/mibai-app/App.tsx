import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Animated, Image } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

const emotionGifs = {
  happy: require('./assets/gif/happy.gif'),
  curious: require('./assets/gif/curious.gif'),
  bubble: require('./assets/gif/bubble.gif'),
};

const emotionSounds = {
  happy: require('./assets/sound/rhappy.mp3'),
  curious: require('./assets/sound/curious.mp3'),
  bubble: require('./assets/sound/bubble.mp3'),
};

export default function App() {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [sound, setSound] = useState<Audio.Sound | undefined>();
  const [currentEmotion, setCurrentEmotion] = useState<string>('happy');

  async function playSound(emotion: string) {
    const { sound } = await Audio.Sound.createAsync(
      emotionSounds[emotion as keyof typeof emotionSounds]
    );
    setSound(sound);
    await sound.playAsync();
  }

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    const emotions = ['happy', 'curious', 'bubble'];
    let currentIndex = 0;

    const changeEmotion = () => {
      setCurrentEmotion(emotions[currentIndex]);
      playSound(emotions[currentIndex]);
      currentIndex = (currentIndex + 1) % emotions.length;
    };

    const interval = setInterval(changeEmotion, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.robotHead, { transform: [{ scale: scaleAnim }] }]}>
        <Image
          source={emotionGifs[currentEmotion as keyof typeof emotionGifs]}
          style={styles.gifImage}
        />
      </Animated.View>
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
  robotHead: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffffff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.35,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gifImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
});
