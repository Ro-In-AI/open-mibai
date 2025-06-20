# OTAController 使用说明

## 简介
`OTAController` 用于通过 BLE 实现固件 OTA（空中升级）功能。它负责接收来自 APP 的 OTA 控制命令和固件数据包，并管理升级流程和状态同步。

---

## BLE 协议说明

### 服务与特征 UUID
- **OTA 服务 UUID**: `ff040000-1000-8000-0080-5f9b34fb0000`
- **OTAControl 特征 UUID**: `ef040001-1000-8000-0080-5f9b34fb0000`  
  类型：WRITE (WithResponse)
- **OTAData 特征 UUID**: `ef040002-1000-8000-0080-5f9b34fb0000`  
  类型：WRITE_NO_RESPONSE
- **OTAStatus 特征 UUID**: `ef040003-1000-8000-0080-5f9b34fb0000`  
  类型：NOTIFY/READ

---

## OTA 控制命令（APP → 设备）

| 命令名   | 数值 | 说明         |
|----------|------|--------------|
| START    | 0    | 开始OTA升级  |
| CANCEL   | 1    | 取消升级     |
| CONFIRM  | 2    | 确认升级并重启 |

- 通过 OTAControl 特征（WithResponse）发送。

---

## OTA 状态（设备 → APP）

| 状态名   | 数值 | 说明         |
|----------|------|--------------|
| IDLE     | 0    | 空闲/未升级  |
| READY    | 1    | 准备升级     |
| UPDATING | 2    | 正在升级     |
| COMPLETE | 3    | 升级完成     |
| FAILED   | 4    | 升级失败     |

- 通过 OTAStatus 特征（Notify）主动推送。

---

## 典型OTA升级流程

1. **APP 连接设备**
2. **APP 发送 START 命令**（OTAControl, value: 0）
3. 设备收到后切换状态为 READY，并通过 OTAStatus 通知 APP
4. **APP 分片发送固件数据**（OTAData, WriteNoResponse，每包建议 ≤ 512 字节）
5. 设备写入数据，状态切换为 UPDATING
6. **APP 发送 CONFIRM 命令**（OTAControl, value: 2）
7. 设备校验并切换分区，状态切换为 COMPLETE，通知 APP
8. 设备重启，启动新固件

如需中断升级，APP 可随时发送 CANCEL 命令（OTAControl, value: 1），设备会重置状态为 IDLE。

---

## 注意事项
- **OTAControl** 必须用 WithResponse 写入，**OTAData** 必须用 WithoutResponse 写入。
- 断开蓝牙连接时，OTA 状态会自动重置为 IDLE。
- 每次升级前建议 APP 先监听 OTAStatus 通知。
- 固件分片建议每包 ≤ 512 字节，避免 MTU 问题。
- 设备端收到 CONFIRM 后会自动重启。

---

## 代码接口简述

- `void OTAController::begin()` 初始化 OTA 控制器
- `void OTAController::handleMessage(const BLEWriteMessage& msg)` 处理 BLE 写入消息
- `void OTAController::reset()` 重置 OTA 状态（IDLE）
- `void OTAController::setBLEServer(BLEServerWrapper* server)` 设置 BLE 服务器实例
- `void OTAController::update()` 定期更新（可选）

---

## 协议扩展建议
- 可根据需要扩展 OTA 状态/命令类型
- 可增加固件校验、版本检查等安全机制

---

如有问题请联系固件开发者。 