@echo off
chcp 65001 >nul
title ErroRightAI Mibai2 固件烧录工具

echo.
echo =================================================
echo 🤖 ErroRightAI Mibai2 固件烧录工具
echo =================================================
echo.

:: 检查Node.js是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 检查PlatformIO是否安装
where pio >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 PlatformIO
    echo 正在尝试自动安装 PlatformIO Core...
    echo.
    
    :: 尝试使用conda环境安装
    call conda --version >nul 2>nul
    if %errorlevel% equ 0 (
        echo 🐍 检测到 Conda 环境，使用 conda 安装...
        call conda install -c conda-forge platformio -y
        if %errorlevel% neq 0 (
            echo ⚠️  Conda 安装失败，尝试使用 pip...
            call conda run pip install platformio
        )
    ) else (
        :: 尝试使用系统pip
        python -m pip install platformio
        if %errorlevel% neq 0 (
            echo ❌ 自动安装失败
            echo.
            echo 💡 请手动安装 PlatformIO:
            echo 方法1: conda install -c conda-forge platformio
            echo 方法2: pip install platformio
            echo 方法3: 在 Anaconda Prompt 中运行: pip install platformio
            echo.
            pause
            exit /b 1
        )
    )
    
    :: 验证安装是否成功
    where pio >nul 2>nul
    if %errorlevel% neq 0 (
        echo ❌ PlatformIO 安装失败
        echo 请在 Anaconda Prompt 中手动安装: pip install platformio
        echo.
        pause
        exit /b 1
    ) else (
        echo ✅ PlatformIO 安装成功
    )
)

:: 检查npm依赖
if not exist "node_modules" (
    echo 📦 正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

:: 运行烧录工具
echo ✅ 环境检查完成，启动烧录工具...
echo.
npm run flash-tool

echo.
echo 烧录工具已退出
pause 