import { useState, useEffect, useCallback } from 'react';
import { Device } from 'react-native-ble-plx';
import { bluetoothService } from '../api/services/bluetoothService';

interface BluetoothState {
  isScanning: boolean;
  isInitialized: boolean;
  isConnecting: boolean;
  devices: Device[];
  error: string | null;
  connectedDevice: Device | null;
  receivedData: string[];
}

export const useBluetooth = () => {
  const [state, setState] = useState<BluetoothState>({
    isScanning: false,
    isInitialized: false,
    isConnecting: false,
    devices: [],
    error: null,
    connectedDevice: null,
    receivedData: [],
  });

  // 初始化蓝牙
  const initializeBluetooth = useCallback(async () => {
    try {
      await bluetoothService.initialize();
      setState(prev => ({ ...prev, isInitialized: true, error: null }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isInitialized: false,
        error: error instanceof Error ? error.message : '蓝牙初始化失败'
      }));
    }
  }, []);

  // 开始扫描设备
  const startScan = useCallback(async () => {
    if (!state.isInitialized) {
      setState(prev => ({ ...prev, error: '蓝牙未初始化' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isScanning: true, error: null }));
      
      const foundDevices: Device[] = [];
      await bluetoothService.scanForPeripherals((device: Device) => {
        if (device && !foundDevices.find(d => d.id === device.id)) {
          foundDevices.push(device);
          setState(prev => ({
            ...prev,
            devices: [...foundDevices]
          }));
        }
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '扫描设备失败'
      }));
    } finally {
      setState(prev => ({ ...prev, isScanning: false }));
    }
  }, [state.isInitialized]);

  // 停止扫描
  const stopScan = useCallback(() => {
    bluetoothService.stopScan();
    setState(prev => ({ ...prev, isScanning: false }));
  }, []);

  // 连接设备
  const connectToDevice = useCallback(async (deviceId: string) => {
    console.log('connectToDevice called with deviceId:', deviceId);
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));
      const device = await bluetoothService.connectToDevice(deviceId);
      if (device) {
        console.log('设备连接成功:', device.id);
        // 先更新状态
        await new Promise<void>(resolve => {
          setState(prev => ({ 
            ...prev, 
            connectedDevice: device,
            error: null 
          }));
          resolve();
        });
        return device; // 返回连接的设备
      } else {
        throw new Error('连接失败：设备未返回');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        connectedDevice: null,
        error: error instanceof Error ? error.message : '连接设备失败'
      }));
      throw error; // 抛出错误以便调用者处理
    } finally {
      setState(prev => ({ ...prev, isConnecting: false }));
    }
  }, []);
  
  // 断开设备连接
  const disconnectDevice = useCallback(async () => {
    if (!state.connectedDevice) return;

    try {
      await bluetoothService.disconnectDevice(state.connectedDevice.id);
      setState(prev => ({ ...prev, connectedDevice: null }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '断开连接失败'
      }));
    }
  }, [state.connectedDevice]);

  // 发送数据
  const sendData = useCallback(async (
    data: string,
    serviceUUID: string = '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
    characteristicUUID: string = 'beb5483e-36e1-4688-b7f5-ea07361b26a8'
  ) => {
    if (!state.connectedDevice) {
      setState(prev => ({ ...prev, error: '没有连接的设备' }));
      return;
    }

    try {
      await bluetoothService.sendData(
        state.connectedDevice.id,
        serviceUUID,
        characteristicUUID,
        data
      );
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '发送数据失败'
      }));
    }
  }, [state.connectedDevice]);

  // 清除错误
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // 重置状态
  const reset = useCallback(() => {
    setState({
      isScanning: false,
      isInitialized: false,
      isConnecting: false,
      devices: [],
      error: null,
      connectedDevice: null,
      receivedData: [], // 添加缺失的 receivedData 字段
    });
  }, []);

  // 组件挂载时初始化蓝牙
  useEffect(() => {
    initializeBluetooth();
    
    // 组件卸载时清理
    return () => {
      stopScan();
      reset();
    };
  }, []);

  // 开始监听数据
  const startListening = useCallback(async (
    serviceUUID: string = '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
    characteristicUUID: string = 'beb5483e-36e1-4688-b7f5-ea07361b26a9',
    device?: Device // 添加可选的设备参数
  ) => {
    const targetDevice = device || state.connectedDevice;
    if (!targetDevice) {
      console.error('No connected device');
      setState(prev => ({ ...prev, error: '没有连接的设备' }));
      return;
    }

    console.log('startListening called with deviceId:', targetDevice.id);

    try {
      await bluetoothService.startNotifications(
        targetDevice.id,
        serviceUUID,
        characteristicUUID,
        (data: string) => {
          setState(prev => ({
            ...prev,
            receivedData: [...prev.receivedData, data]
          }));
        }
      );
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '监听数据失败'
      }));
    }
  }, [state.connectedDevice]);

  // 停止监听数据
  const stopListening = useCallback(async (
    serviceUUID: string = '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
    characteristicUUID: string = 'beb5483e-36e1-4688-b7f5-ea07361b26a8'
  ) => {
    if (!state.connectedDevice) return;

    try {
      await bluetoothService.stopNotifications(
        state.connectedDevice.id,
        serviceUUID,
        characteristicUUID
      );
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '停止监听失败'
      }));
    }
  }, [state.connectedDevice]);

  // 清除接收的数据
  const clearReceivedData = useCallback(() => {
    setState(prev => ({ ...prev, receivedData: [] }));
  }, []);

  return {
    // 状态
    isScanning: state.isScanning,
    isInitialized: state.isInitialized,
    isConnecting: state.isConnecting,
    devices: state.devices,
    error: state.error,
    connectedDevice: state.connectedDevice,
    receivedData: state.receivedData,
  // 方法
  startScan,
  stopScan,
  connectToDevice,
  disconnectDevice,
  sendData,
  clearError,
  reset,
  initializeBluetooth,
  startListening,     // 添加数据监听方法
  stopListening,      // 添加停止监听方法
  clearReceivedData,  // 添加清除接收数据方法
  };
};