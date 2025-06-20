import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import SoundPlayer from "react-native-sound-player";

const GIFTest: React.FC = () => {
  useEffect(() => {
    try {
        SoundPlayer.playAsset(require("../../assets/sounds/bubble.mp3"));
      } catch (e) {
        console.log(`cannot play the sound file`, e);
      }
  }, []);

  return (
    <View style={styles.container}>
      <FastImage
        style={styles.image}
        source={require('../../assets/gifs/bubble.gif')}
        resizeMode={FastImage.resizeMode.contain}
      />
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 300,
    height: 300,
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
