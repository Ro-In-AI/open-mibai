import { Platform, PermissionsAndroid, NativeModules, Alert } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

// 检查蓝牙状态
export const checkBluetoothState = async (bleManager: BleManager) => {
  if (Platform.OS === 'ios') {
    return new Promise((resolve) => {
      // 先获取当前状态
      bleManager.state().then(state => {
        console.log('iOS 初始蓝牙状态:', state);
        if (state === 'PoweredOn') {
          resolve(true);
          return;
        }
        
        // 如果当前不是开启状态，设置状态监听
        const subscription = bleManager.onStateChange((state) => {
          console.log('iOS 蓝牙状态变化:', state);
          if (state === 'PoweredOn') {
            subscription.remove();
            resolve(true);
          } else if (state === 'PoweredOff' || state === 'Unauthorized') {
            subscription.remove();
            Alert.alert(
              '蓝牙未开启',
              '请前往"设置 > 蓝牙"中打开蓝牙以使用该功能',
              [{ text: '确定' }]
            );
            resolve(false);
          }
        }, true);
      });
    });
  } else {
    const state = await bleManager.state();
    if (state !== 'PoweredOn') {
      Alert.alert(
        '蓝牙未开启',
        '请打开蓝牙以使用该功能',
        [{ text: '确定' }]
      );
    }
    return state === 'PoweredOn';
  }
};

// 检查蓝牙权限
export const checkBlePermissions = async (bleManager: BleManager) => {
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
  } else if (Platform.OS === 'ios') {
    try {
      // 检查蓝牙状态
      const isBluetoothOn = await checkBluetoothState(bleManager);
      console.log('iOS 蓝牙是否开启:', isBluetoothOn);
      
      if (!isBluetoothOn) {
        throw new Error('Bluetooth is not enabled');
      }
      
      return true;
    } catch (error) {
      console.error('iOS 蓝牙权限检查错误:', error);
      throw error;
    }
  }

  return false; // 其他平台不支持
};