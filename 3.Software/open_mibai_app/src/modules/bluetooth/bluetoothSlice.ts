// Redux slice 管理蓝牙状态、设备和数据

import { createSlice } from '@reduxjs/toolkit';
import { BluetoothStatus } from './bluetoothTypes';

interface ServoData {                       // 数据类型
  id: number;
  angle: number;
}

interface BluetoothState {                   // 状态类型
  status: BluetoothStatus;
  deviceInfo: {
    id: string;
    name?: string;
    mtu?: number;
  } | null;
  receivedData: ServoData[] | null;
}

const initialState: BluetoothState = {     // 初始状态
  status: 'idle',
  deviceInfo: null,
  receivedData: null,
};

const bluetoothSlice = createSlice({
  name: 'bluetooth',          // slice 的名称
  initialState,               // 初始状态
  reducers: {                 // 定义 reducer
    setStatus: (state, action) => {         // 设置蓝牙状态
      state.status = action.payload;
    },
    setDeviceInfo: (state, action) => {     // 设置设备信息
      state.deviceInfo = action.payload;
    },
    setReceivedData: (state, action) => {   // 设置接收到的数据
      state.receivedData = action.payload;
    },
    clear: (state) => {                     // 清除状态
      state.status = 'disconnected';
      state.deviceInfo = null;
      state.receivedData = null;
    },
  }
});

export const { setStatus, setDeviceInfo, setReceivedData, clear } = bluetoothSlice.actions;
export default bluetoothSlice.reducer;
