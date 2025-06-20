import { Device, BleManager } from 'react-native-ble-plx';
import { checkBlePermissions, checkBluetoothState } from '../utils/permissions';
import { Alert, Platform } from 'react-native';
import base64 from 'react-native-base64';

let bleManager = new BleManager();
let connectedDevice: Device | null = null; // ✅ 全局变量存储当前连接的实例
// ✅ 添加全局断开回调变量
let onDisconnectCallback: ((device: Device) => void) | null = null;

// 蓝牙相关的API服务
export const bluetoothService = {

  // 获取当前设备实例（用于 thunk 中发送指令）
  getConnectedDevice: () => connectedDevice,

  // 初始化蓝牙
  initialize: async () => {
    try {
      const hasPermissions = await checkBlePermissions(bleManager);
      if (!hasPermissions) {
        throw new Error('Bluetooth permissions not granted');
      }
  
      const isBluetoothOn = await checkBluetoothState(bleManager);
      if (!isBluetoothOn) {
        // iOS：只能提示，无法直接跳转设置页
        Alert.alert(
          '蓝牙未开启',
          '请前往"设置 > 蓝牙"中打开蓝牙以使用该功能'
        );
  
        throw new Error('Bluetooth is not enabled');
      }
  
      return true;
    } catch (error) {
      console.error('Bluetooth initialization error:', error);
      throw error;
    }
  },
 
  // 扫描设备
  scanForPeripherals: async (onDeviceFound: (device: Device) => void) => {
      console.log('Scanning for peripherals...');
      try {
          bleManager.startDeviceScan(null, null, (error, device) => {
          if (error) {
              console.error('Error scanning for peripherals:', error);

              // 处理位置服务关闭的错误
              if (error.message.includes('Location services are disabled')) {
                Alert.alert(
                  '位置服务未开启',
                  '请打开手机的"位置服务"以扫描蓝牙设备',
                  [
                    { text: '知道了' },
                    // 可选跳转设置（部分机型支持）
                  ]
                );
              }

              return;
          }
          if (device) {
              onDeviceFound(device);
          }
          });
      } catch (error) {
          console.error('Error scanning for peripherals:', error);
          throw error;
      }
  },

  // 停止扫描
  stopScan: () => {
      try {
        bleManager.stopDeviceScan();
      } catch (error) {
        console.error('Error stopping scan:', error);
        throw error;
      }
  },

  // 连接设备
  connectToDevice: async (deviceId: string) => {
    console.log('Connecting to device...', deviceId);
    try {
      const device = await bleManager.connectToDevice(deviceId,{
        timeout: 10000,
        autoConnect: false,
        requestMTU: 512 // 增加传输单元大小
      });
      const isDeviceConnected = await device.isConnected();         // 检查设备是否已连接
      // Ensure we're connected before proceeding
      if (isDeviceConnected) {
        console.log("Connected to device");
        // 在你尝试写入特征之前，确保你对设备进行了服务和特征的发现。当你连接到一个BLE设备后，通常需要发现它提供的所有服务和特征，这样你才能与它们互动。
        await device.discoverAllServicesAndCharacteristics();   // 发现所有服务和特征 
        connectedDevice = device; // ✅ 缓存设备实例

        // 监听设备的断开连接事件
        device.onDisconnected((error, disconnectedDevice) => {
          if (error) {
              console.error("Disconnect error:", error);
          } else {
              console.log(`Device ${disconnectedDevice.id} is disconnected`);
              connectedDevice = null; // ✅ 断开时清除缓存

              // ✅ 回调通知外部
              if (onDisconnectCallback) {
                onDisconnectCallback(disconnectedDevice);
              }
          }
        });

        return device;
      } else {
        console.log("Device is not connected");
        return null;
      }
    } catch (error) {
      console.error('Connect device error:', error);
      throw error;
    }
  },

  // ✅ 让 Redux 注册断开回调
  setOnDisconnectedListener: (callback: (device: Device) => void) => {
    onDisconnectCallback = callback;
  },

  // 断开设备连接
  disconnectDevice: async (deviceId: string) => {
    try {
      const isDeviceConnected = await bleManager.isDeviceConnected(deviceId);
      if (isDeviceConnected) {
        await bleManager.cancelDeviceConnection(deviceId);
      }
      connectedDevice = null; // ✅ 断开连接后清除缓存
      onDisconnectCallback = null;  // ✅ 断开连接后清除回调
      return true;
    } catch (error) {
      console.error('Disconnect device error:', error);
      throw error;
    }
  },

  // 发送数据到设备
  sendData: async (
    serviceUUID: string,
    characteristicUUID: string,
    data: string
  ) => {
    try {
      // 检查设备是否已连接
      const device = connectedDevice;
      if (!device) throw new Error('Device not connected');
       
      await device.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        base64.encode(data) // 将字符串转换为base64编码
      );
      return true;
    } catch (error) {
      console.error('Send data error:', error);
      throw error;
    }
  },

  sendDataWithEncoding: async (
    serviceUUID: string,
    characteristicUUID: string,
    rawData: Uint8Array | string
  ) => {
    try {
      const device = connectedDevice;
      if (!device) throw new Error('Device not connected');
  
      const base64Data =
        typeof rawData === 'string'
          ? rawData
          : base64.encodeFromByteArray(rawData);
  
      // 使用 writeCharacteristicWithoutResponseForService 替代 writeCharacteristicWithResponseForService
      await device.writeCharacteristicWithoutResponseForService(
        serviceUUID,
        characteristicUUID,
        base64Data
      );
  
      return true;
    } catch (error) {
      console.error('Send data with encoding error:', error);
      throw error;
    }
  },

  // 检查设备连接状态
  isDeviceConnected: async (deviceId: string) => {
    try {
      return await bleManager.isDeviceConnected(deviceId);
    } catch (error) {
      console.error('Check connection error:', error);
      throw error;
    }
  },

  // 监听数据
  startNotifications: async (
    serviceUUID: string = '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
    characteristicUUID: string = 'beb5483e-36e1-4688-b7f5-ea07361b26a9', // 修改为新的通知特征 UUID
    onDataReceived: (data: string) => void
  ) => {
    try {
      const device = connectedDevice;
      if (!device) throw new Error('Device not connected');

      if (!device) {
        throw new Error('Device not found');
      }

      // 开始监听特征值的变化
      device.monitorCharacteristicForService(
        serviceUUID,
        characteristicUUID,
        (error, characteristic) => {
          if (error) {
            console.error('Notification error:', error);
            return;
          }
          if (characteristic?.value) {
            onDataReceived(characteristic.value);
          }
        }
      );
    } catch (error) {
      console.error('Start notifications error:', error);
      throw error;
    }
  },

  // 停止监听数据
  stopNotifications: async (
    serviceUUID: string,
    characteristicUUID: string
  ) => {
    try {
      // 获取已连接的设备
      const device = connectedDevice;
      if (!device) throw new Error('Device not connected');
  
      // 停止监听特定服务和特征的通知
      device.monitorCharacteristicForService(
        serviceUUID,
        characteristicUUID,
        () => {
          // 空回调函数用于停止监听
        }
      );
    } catch (error) {
      console.error('Stop notifications error:', error);
      throw error;
    }
  },
};