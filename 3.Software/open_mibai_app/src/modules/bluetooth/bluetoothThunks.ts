import { AppThunk } from '../../store/store';  // 你 Redux 的类型定义
import { bluetoothService } from './services/bluetoothService';
import config from './config/ble_config.json';
import base64 from 'react-native-base64';
import { setDeviceInfo, setStatus, setReceivedData, clear } from './bluetoothSlice';

// 舵机数据解析函数
function parseServoStatus(data: Uint8Array) {
  if (data.length < 4 || data[0] !== 0xAA || data[1] !== 0x56 || data[2] !== 0x81) {
    return null; // 检查数据帧头是否正确，否则返回 null 表示无效数据
  }

  const result = [];

  for (let i = 4; i + 2 < data.length; i += 3) {
    const id = data[i]; // 舵机 ID
    const angleRaw = (data[i + 1] << 8) | data[i + 2]; // 两字节角度，高8位+低8位
    result.push({ id, angle: angleRaw / 10 }); // ×0.1 转为实际角度
  }

  return result;
}

// 连接到蓝牙设备
export const connectToBluetoothDevice = (): AppThunk => async (dispatch) => {
  try {
    dispatch(setStatus('scanning'));      // 通知 Redux 当前是"扫描中"状态
    await bluetoothService.initialize();  // 初始化蓝牙模块

    // 开始扫描
    await bluetoothService.scanForPeripherals(async (foundDevice) => {
      console.log('📱 发现设备:', foundDevice.name, foundDevice.id);
      if (foundDevice.name?.startsWith(config.ble_device_name)) {    // 检查设备名称是否匹配
        console.log('✅ 匹配目标设备:', foundDevice.name);
        try {
          console.log('⏹️ 停止扫描...');
          bluetoothService.stopScan();                          // 停止扫描 
          console.log('🔄 设置状态为连接中...');
          dispatch(setStatus('connecting'));                    // 通知 Redux 当前是"连接中"状态

          console.log('🔗 开始连接到设备:', foundDevice.id);
          const connectedDevice = await bluetoothService.connectToDevice(foundDevice.id);    // 连接到设备
          if (!connectedDevice) {                                   // 检查连接是否成功
            dispatch(setStatus('error'));                           // 设置错误状态
            throw new Error('连接失败');                             // 抛出错误
          }
          
          console.log('🎉 设备连接成功!');
          // 设备连接成功，更新 Redux 状态
          dispatch(setStatus('connected'));
          dispatch(setDeviceInfo({
            id: connectedDevice.id,
            name: connectedDevice.name,
            mtu: connectedDevice.mtu,
          }));

          // 连接成功后设置断开监听回调
          bluetoothService.setOnDisconnectedListener((disconnectedDevice) => {
            console.warn('⚠️ 设备断开连接:', disconnectedDevice.id);
            dispatch(setStatus('disconnected')); // Redux 状态设为断开
            dispatch(clear());                   // 清空 deviceInfo + data
          });

          // 确保发现所有服务和特征
          await connectedDevice.discoverAllServicesAndCharacteristics();

          // 开始接收数据通知
          await bluetoothService.startNotifications(
            'ff010000-1000-8000-0080-5f9b34fb0000',  // MotorService UUID
            'ef010002-1000-8000-0080-5f9b34fb0000',  // MotorRead Characteristic UUID
            (base64Data: string) => {                              // 收到数据时的回调
              const raw = base64.decode(base64Data);               // 解码 base64 数据
              const bytes = new Uint8Array([...raw].map(char => char.charCodeAt(0)));  // 将 base64 数据转换为 Uint8Array
              const parsed = parseServoStatus(bytes);               // 解析数据
              if (parsed) {                                          // 如果解析成功
                dispatch(setReceivedData(parsed));                   // 更新 Redux 状态
              }
            }
          );
        } catch (error) {
          console.error('🔥 连接设备过程中出错:', error);
          dispatch(setStatus('error'));
          throw error; // 重新抛出错误，让外层catch处理
        }
      }
    });
  } catch (err) {                                               // 如果发生错误
    // 确保在错误时停止扫描
    bluetoothService.stopScan();
    dispatch(setStatus('error'));                               // 通知 Redux 当前是"错误"状态
    console.error('连接失败:', err);                             // 打印错误信息
  }
};

export const disconnectFromBluetooth = (): AppThunk => async (dispatch, getState) => {  // 断开蓝牙连接
  const device = getState().bluetooth.deviceInfo;                  // 获取当前连接的设备
  if (device) {
    await bluetoothService.disconnectDevice(device.id);
  }
  dispatch(clear());
};

export const sendMotorCommand = (data: Uint8Array | string): AppThunk => async (dispatch, getState) => {
  try {
    // 检查蓝牙连接状态
    const { status, deviceInfo } = getState().bluetooth;
    if (status !== 'connected' || !deviceInfo) {
      throw new Error('蓝牙未连接');
    }

    // 检查设备是否真的连接
    const isConnected = await bluetoothService.isDeviceConnected(deviceInfo.id);
    if (!isConnected) {
      dispatch(setStatus('disconnected'));
      throw new Error('设备已断开连接');
    }

    await bluetoothService.sendDataWithEncoding(
      'ff010000-1000-8000-0080-5f9b34fb0000', // Service UUID
      'ef010001-1000-8000-0080-5f9b34fb0000', // Characteristic UUID
      data
    );
    console.log('✅ 指令发送成功');
  } catch (error) {
    console.error('❌ 指令发送失败:', error);
    // 如果是连接问题，更新状态
    if (error instanceof Error && error.message.includes('not connected')) {
      dispatch(setStatus('disconnected'));
    }
    throw error; // 重新抛出错误，让调用者知道发送失败
  }
};