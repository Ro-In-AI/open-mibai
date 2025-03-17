import React, { useState } from 'react';
import { View, Button, Text, FlatList, StyleSheet, TextInput } from 'react-native';
import { useBluetooth } from '../../hooks/useBluetooth';

const BluetoothTest: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const { 
    devices, 
    isScanning,
    isConnecting,
    connectedDevice,
    error,
    startScan, 
    stopScan,
    connectToDevice,
    disconnectDevice,
    sendData,
    receivedData,
    startListening,
    stopListening,
    clearReceivedData
  } = useBluetooth();

  const handleConnect = async (deviceId: string) => {
    try {
      console.log('准备连接设备:', deviceId);
      const device = await connectToDevice(deviceId);
      if (device) {
        // 直接使用返回的设备对象开始监听
        await startListening(undefined, undefined, device);
        console.log('开始监听数据');
      }
    } catch (error) {
      console.error('连接失败:', error);
    }
  };

  // 断开连接时停止监听
  const handleDisconnect = async () => {
    try {
      await stopListening();
      await disconnectDevice();
    } catch (error) {
      console.error('断开连接失败:', error);
    }
  };

  const handleSendData = async () => {
    if (!connectedDevice || !message) return;
    try {
      await sendData(message);
      setMessage(''); // 发送后清空输入
    } catch (error) {
      console.error('发送数据失败:', error);
    }
  };

  return (
    <View style={styles.container}>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <Button 
        title={isScanning ? "停止扫描" : "开始扫描"} 
        onPress={isScanning ? stopScan : startScan}
      />

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.deviceItem}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>
                {item.name || '未知设备'} ({item.id})
              </Text>
              <Text style={styles.deviceStatus}>
                {connectedDevice?.id === item.id ? '已连接' : '未连接'}
              </Text>
            </View>
            <Button
              title={connectedDevice?.id === item.id ? "断开连接" : "连接"}
              onPress={() => connectedDevice?.id === item.id 
                ? disconnectDevice()
                : handleConnect(item.id)
              }
              disabled={isConnecting}
            />
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>
            {isScanning ? '正在搜索设备...' : '暂无发现的设备'}
          </Text>
        )}
      />

      {connectedDevice && (
        <View style={styles.sendPanel}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="输入要发送的数据"
            placeholderTextColor="#999"
          />
          <Button
            title="发送"
            onPress={handleSendData}
            disabled={!message}
          />

          {/* 添加接收数据的显示面板 */}
          <View style={styles.receivedDataPanel}>
            <View style={styles.receivedDataHeader}>
              <Text style={styles.receivedDataTitle}>接收的数据</Text>
              <Button 
                title="清除" 
                onPress={clearReceivedData}
              />
            </View>
            <FlatList
              data={receivedData}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <Text style={styles.receivedDataItem}>{item}</Text>
              )}
              style={styles.receivedDataList}
              ListEmptyComponent={() => (
                <Text style={styles.emptyText}>暂无接收到的数据</Text>
              )}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  deviceItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  deviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deviceName: {
    fontSize: 16,
  },
  deviceStatus: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  sendPanel: {
    marginTop: 20,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginBottom: 10,
  },
  receivedDataPanel: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
  },
  receivedDataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  receivedDataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  receivedDataList: {
    maxHeight: 200,
  },
  receivedDataItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default BluetoothTest;