@echo off
chcp 65001 >nul
title ErroRightAI Mibai2 固件烧录工具 (Conda环境)

echo.
echo =================================================
echo 🤖 ErroRightAI Mibai2 固件烧录工具 (Conda版本)
echo =================================================
echo.

:: 检查 conda 是否已初始化 cmd.exe（通过 CONDA_EXE 环境变量判断）
if "%CONDA_EXE%"=="" (
    echo ⚠️  检测到当前 CMD 尚未初始化 Conda 环境
    echo.
    echo 🔧 解决方案：
    echo 1. 打开 Anaconda Prompt 或 PowerShell
    echo 2. 执行以下命令初始化 Conda 到 cmd.exe:
    echo.
    echo     conda init cmd.exe
    echo.
    echo 3. 关闭并重新打开 CMD，再次运行本脚本
    echo.
    echo 💡 或者您可以直接在 Anaconda Prompt 中运行:
    echo     npm run flash-tool
    echo.
    pause
    exit /b 1
)

:: 检查conda命令是否可用
where conda >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 虽然检测到 Conda 环境变量，但 conda 命令不可用
    echo 请确保已正确安装 Anaconda 或 Miniconda
    echo 下载地址: https://www.anaconda.com/products/distribution
    echo.
    pause
    exit /b 1
)

echo 🐍 检测到 Conda 环境
echo 正在初始化 Conda...

:: 检查是否已经在conda环境中
if not "%CONDA_DEFAULT_ENV%"=="" (
    echo ✅ 已在 Conda 环境中: %CONDA_DEFAULT_ENV%
) else (
    echo 🔄 尝试激活 base 环境...
    :: 激活base环境
    call conda activate base
    if %errorlevel% neq 0 (
        echo ⚠️  无法激活 base 环境，将使用当前环境继续...
    ) else (
        echo ✅ 成功激活 base 环境
    )
)

:: 检查Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Node.js
    echo 正在尝试使用 conda 安装 Node.js...
    call conda install -c conda-forge nodejs -y
    if %errorlevel% neq 0 (
        echo ❌ Node.js 安装失败
        echo 请手动安装: conda install -c conda-forge nodejs
        echo 或访问: https://nodejs.org/
        echo.
        pause
        exit /b 1
    )
    echo ✅ Node.js 安装成功
)

:: 检查PlatformIO
where pio >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 PlatformIO
    echo 正在使用 conda 安装 PlatformIO...
    
    :: 优先使用conda-forge安装
    call conda install -c conda-forge platformio -y
    if %errorlevel% neq 0 (
        echo ⚠️  conda 安装失败，尝试使用 pip...
        call pip install platformio
        if %errorlevel% neq 0 (
            echo ❌ PlatformIO 安装失败
            echo.
            echo 💡 请尝试以下命令之一:
            echo   conda install -c conda-forge platformio
            echo   pip install platformio
            echo   python -m pip install platformio
            echo.
            pause
            exit /b 1
        )
    )
    
    :: 验证安装
    where pio >nul 2>nul
    if %errorlevel% neq 0 (
        echo ❌ PlatformIO 安装验证失败
        echo 请重新打开命令行或重启系统后再试
        echo.
        pause
        exit /b 1
    )
    echo ✅ PlatformIO 安装成功
)

:: 检查npm依赖
if not exist "node_modules" (
    echo 📦 正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

:: 显示环境信息
echo.
echo ✅ 环境检查完成
echo 📊 环境信息:
echo    Node.js: 
call node --version
echo    Conda: 
call conda --version
echo    PlatformIO: 
call pio --version
echo.

:: 运行烧录工具
echo 🚀 启动烧录工具...
echo.
call npm run flash-tool

echo.
echo 烧录工具已退出
pause 