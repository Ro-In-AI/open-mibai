# 项目架构说明

## 目录结构

```
src/
├── api/                # API接口和网络请求相关
│   ├── config/         # API配置（baseURL、headers等）
│   └── services/       # API服务（用户、设备等）
│
├── components/         # 可复用的UI组件
│   ├── common/         # 通用组件（按钮、输入框等）
│   └── business/       # 业务组件
│
├── screens/            # 页面组件
│   ├── auth/           # 认证相关页面
│   ├── home/           # 主页相关页面
│   └── device/         # 设备相关页面
│
├── services/           # 核心服务
│   ├── bluetooth/      # 蓝牙服务
│   │   ├── config/     # 蓝牙配置
│   │   └── handlers/   # 蓝牙事件处理
│   └── livekit/        # Livekit服务
│       ├── config/     # Livekit配置
│       └── handlers/   # Livekit事件处理
│
├── store/              # 状态管理
│   ├── slices/         # Redux切片（或其他状态管理方案）
│   └── hooks/          # 状态相关的自定义hooks
│
├── utils/              # 工具函数
│   ├── bluetooth/      # 蓝牙相关工具
│   ├── livekit/        # Livekit相关工具
│   └── common/         # 通用工具函数
│
└── hooks/              # 自定义React Hooks

```

## 模块说明

### api/
负责处理所有的网络请求，包括API配置和各种服务的API调用。

### components/
包含所有可复用的UI组件，分为通用组件和业务组件两类。

### screens/
存放所有的页面组件，按功能模块分类组织。

### services/
核心服务模块，包含蓝牙和Livekit服务的具体实现。
- bluetooth/：处理蓝牙连接、数据传输等功能
- livekit/：处理实时通信相关功能

### store/
状态管理模块，使用Redux或其他状态管理方案。
- slices/：存放各个功能模块的状态切片
- hooks/：状态相关的自定义hooks

### utils/
工具函数模块，包含各种辅助函数。

### hooks/
存放可复用的自定义React Hooks。

## 开发规范

1. 组件和函数使用TypeScript类型声明
2. 遵循React Native最佳实践
3. 保持代码结构清晰，遵循单一职责原则
4. 合理使用注释，保持代码可读性