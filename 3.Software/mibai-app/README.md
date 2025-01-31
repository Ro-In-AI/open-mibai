# MiBai App

## 项目介绍
MiBai App 是一个基于 React Native 和 Expo 开发的桌面机器人应用程序，通过展示不同的表情动画和播放相应的声音效果，实现了一个具有情感交互功能的虚拟机器人界面。

## 技术栈
- React Native
- Expo
- TypeScript
- expo-av (音频播放)
- React Native Animated (动画效果)

## 环境要求
- Node.js (推荐 14.0.0 或更高版本)
- Yarn 包管理器
- Expo CLI
- iOS/Android 模拟器或实体设备（用于开发测试）

## 项目结构
```
├── assets/          # 静态资源文件
│   ├── gif/        # 表情动画文件
│   └── sound/      # 音频文件
├── App.tsx         # 应用程序主入口
├── app.json        # Expo 配置文件
├── index.ts        # 应用程序入口点
├── package.json    # 项目依赖配置
└── tsconfig.json   # TypeScript 配置
```

## 功能特点
- 循环展示不同的情感表情（happy、curious、bubble）
- 播放与表情相匹配的音效
- 使用动画效果增强交互体验
- 简洁现代的UI设计

## 快速开始

1. 安装依赖
```bash
yarn install
```

2. 启动开发服务器
```bash
yarn start
```

3. 在模拟器或设备上运行
- 按 `i` 在 iOS 模拟器上运行
- 按 `a` 在 Android 模拟器上运行
- 使用 Expo Go 应用扫描二维码在真机上运行

## 开发指南

### 添加新表情
1. 在 `assets/gif/` 目录下添加新的表情动画文件
2. 在 `assets/sound/` 目录下添加对应的音频文件
3. 在 `App.tsx` 中的 `emotionGifs` 和 `emotionSounds` 对象中添加新表情的配置

### 自定义样式
可以在 `App.tsx` 文件中的 `styles` 对象中修改UI样式，包括：
- 容器背景色
- 机器人头部大小和样式
- 动画图片大小和圆角

## 贡献指南
1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/AmazingFeature`
3. 提交改动：`git commit -m 'Add some AmazingFeature'`
4. 推送分支：`git push origin feature/AmazingFeature`
5. 提交 Pull Request