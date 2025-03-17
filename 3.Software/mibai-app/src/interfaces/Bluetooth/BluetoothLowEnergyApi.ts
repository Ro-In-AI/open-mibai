// src/services/bluetooth/BluetoothLowEnergyApi.ts
import { BluetoothDevice } from "./BluetoothDevice";

export interface BluetoothLowEnergyApi {
  // 蓝牙状态管理
  initialize(): Promise<void>;
  enableBluetooth(): Promise<void>;
  disableBluetooth(): Promise<void>;
  isBluetoothEnabled(): Promise<boolean>;

  // 设备扫描
  startScan(): Promise<void>;
  stopScan(): Promise<void>;
  getDiscoveredDevices(): Promise<BluetoothDevice[]>;

  // 连接管理
  connect(deviceId: string): Promise<void>;
  disconnect(deviceId: string): Promise<void>;
  isConnected(deviceId: string): Promise<boolean>;

  // 数据读写
  readCharacteristic(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string
  ): Promise<string>;
  
  writeCharacteristic(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string,
    data: string
  ): Promise<void>;

  // 通知监听
  startNotifications(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string,
    listener: (data: string) => void
  ): Promise<void>;
  
  stopNotifications(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string
  ): Promise<void>;
}