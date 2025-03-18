import { Device, BleManager } from 'react-native-ble-plx';
import { checkBlePermissions, checkBluetoothState } from '../../utils/permissionUtils';

const bleManager = new BleManager();

// 蓝牙相关的API服务
export const bluetoothService = {
  // 初始化蓝牙
  initialize: async () => {
    try {
      // 检查权限
      const hasPermissions = await checkBlePermissions();
      if (!hasPermissions) {
        throw new Error('Bluetooth permissions not granted');
      }

      // 检查蓝牙状态
      const isBluetoothOn = await checkBluetoothState(bleManager);
      if (!isBluetoothOn) {
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
                return;
            }
            if (device && device.name?.includes("ESP32")) {
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
      const device = await bleManager.connectToDevice(deviceId);
      const isDeviceConnected = await device.isConnected();         // 检查设备是否已连接
      // Ensure we're connected before proceeding
      if (isDeviceConnected) {
        console.log("Connected to device");
        // 在你尝试写入特征之前，确保你对设备进行了服务和特征的发现。当你连接到一个BLE设备后，通常需要发现它提供的所有服务和特征，这样你才能与它们互动。
        await device.discoverAllServicesAndCharacteristics();   // 发现所有服务和特征 

        // 监听设备的断开连接事件
        device.onDisconnected((error, disconnectedDevice) => {
          if (error) {
              console.error("Disconnect error:", error);
          } else {
              console.log(`Device ${disconnectedDevice.id} is disconnected`);
              // 卸载监听器
              device.cancelConnection();
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

  // 断开设备连接
  disconnectDevice: async (deviceId: string) => {
    try {
      const isDeviceConnected = await bleManager.isDeviceConnected(deviceId);
      if (isDeviceConnected) {
        await bleManager.cancelDeviceConnection(deviceId);
      }
      return true;
    } catch (error) {
      console.error('Disconnect device error:', error);
      throw error;
    }
  },

  // 发送数据到设备
  sendData: async (
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string,
    data: string
  ) => {
    try {
      // 检查设备是否已连接
      const isConnected = await bleManager.isDeviceConnected(deviceId);
      if (!isConnected) {
        throw new Error('Device not connected');
      }
      
      // 获取已连接的设备
      const connectedDevices = await bleManager.connectedDevices([serviceUUID]);
      const device = connectedDevices.find(d => d.id === deviceId);
      
      if (!device) {
        throw new Error('Device not found');
      }
      
      await device.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        btoa(data) // 将字符串转换为base64编码
      );
      return true;
    } catch (error) {
      console.error('Send data error:', error);
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
    deviceId: string,
    serviceUUID: string = '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
    characteristicUUID: string = 'beb5483e-36e1-4688-b7f5-ea07361b26a9', // 修改为新的通知特征 UUID
    onDataReceived: (data: string) => void
  ) => {
    try {
      const isConnected = await bleManager.isDeviceConnected(deviceId);
      if (!isConnected) {
        throw new Error('Device not connected');
      }

      const connectedDevices = await bleManager.connectedDevices([serviceUUID]);
      const device = connectedDevices.find(d => d.id === deviceId);
      
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
            // 将base64数据转换为字符串
            const decodedValue = atob(characteristic.value);
            onDataReceived(decodedValue);
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
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string
  ) => {
    try {
      // 获取已连接的设备
      const connectedDevices = await bleManager.connectedDevices([serviceUUID]);
      const device = connectedDevices.find(d => d.id === deviceId);
      
      if (!device) {
        throw new Error('Device not found');
      }

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