import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

export const checkBlePermissions = async () => {
  if (Platform.OS === 'android') {
    const apiLevel = Platform.Version;

    if (apiLevel >= 31) {
      // 分别请求每个权限，并记录结果
      const scanResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        {
          title: "蓝牙扫描权限",
          message: "需要蓝牙扫描权限以发现附近的设备",
          buttonPositive: "确定"
        }
      );
      
      const connectResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        {
          title: "蓝牙连接权限",
          message: "需要蓝牙连接权限以连接设备",
          buttonPositive: "确定"
        }
      );
      
      const locationResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "位置权限",
          message: "需要位置权限以使用蓝牙功能",
          buttonPositive: "确定"
        }
      );

      // 打印权限状态以便调试
      console.log('权限状态:', {
        scan: scanResult,
        connect: connectResult,
        location: locationResult
      });

      return (
        scanResult === PermissionsAndroid.RESULTS.GRANTED &&
        connectResult === PermissionsAndroid.RESULTS.GRANTED &&
        locationResult === PermissionsAndroid.RESULTS.GRANTED
      );
    } else {
      // Android 11 及以下需要的权限
      const results = await Promise.all([
        PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
      ]);

      return results.every(result => result === PermissionsAndroid.RESULTS.GRANTED);
    }
  }

  return true; // iOS 通过 Info.plist 处理权限
};

export const checkBluetoothState = async (bleManager: BleManager) => {
  const state = await bleManager.state();
  return state === 'PoweredOn';
};