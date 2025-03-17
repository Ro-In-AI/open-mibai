import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const LiveKitTest: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LiveKit 测试页面</Text>
      <Text style={styles.description}>这里将实现LiveKit相关功能</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
  },
});

export default LiveKitTest;