// 蓝牙连接状态的枚举类型
export type BluetoothStatus =
  | 'idle'         // 初始状态
  | 'scanning'     // 正在扫描设备
  | 'connecting'   // 正在连接设备
  | 'connected'    // 已连接
  | 'disconnected' // 已断开连接
  | 'error';       // 错误状态

// 舵机状态数据
export interface ServoData {
  id: number;
  angle: number;
}
