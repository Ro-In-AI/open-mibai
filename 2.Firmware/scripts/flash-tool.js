#!/usr/bin/env node

/**
 * ErroRightAI Mibai2 固件烧录工具
 * 
 * 此工具可以帮助用户轻松地将固件和配置文件烧录到ESP32设备
 * 
 * 使用方法:
 * 1. 连接ESP32设备到电脑
 * 2. 运行: npm run flash-tool
 * 3. 按照提示选择操作
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 创建命令行接口
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 配置文件路径
const CONFIG_FILE = 'data/ble_config.json';
const PLATFORMIO_INI = 'platformio.ini';

class FlashTool {
    constructor() {
        this.devicePort = null;
        this.deviceConnected = false;
    }

    // 显示欢迎信息
    showWelcome() {
        console.log('\n=================================================');
        console.log('🤖 ErroRightAI Mibai2 固件烧录工具');
        console.log('=================================================');
        console.log('此工具将帮助您将固件和配置烧录到ESP32设备');
        console.log('=================================================\n');
    }

    // 检查必要文件
    checkRequiredFiles() {
        console.log('📁 检查必要文件...');
        
        const requiredFiles = [CONFIG_FILE, PLATFORMIO_INI];
        const missingFiles = [];

        requiredFiles.forEach(file => {
            if (!fs.existsSync(file)) {
                missingFiles.push(file);
            }
        });

        if (missingFiles.length > 0) {
            console.error('❌ 缺少必要文件:');
            missingFiles.forEach(file => console.error(`   - ${file}`));
            return false;
        }

        console.log('✅ 所有必要文件检查完成');
        return true;
    }

    // 检测连接的串口设备
    async detectDevices() {
        return new Promise((resolve, reject) => {
            console.log('🔍 检测ESP32设备...');
            
            exec('pio device list', (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ 无法检测设备:', error.message);
                    reject(error);
                    return;
                }

                const devices = this.parseDeviceList(stdout);
                resolve(devices);
            });
        });
    }

    // 解析设备列表
    parseDeviceList(output) {
        const devices = [];
        const portMap = new Map(); // 用于去重
        const lines = output.split('\n');
        
        lines.forEach(line => {
            // 查找串口设备 (COM端口在Windows, /dev/tty*在Linux/Mac)
            const portMatch = line.match(/(COM\d+|\/dev\/tty\w+)/);
            if (portMatch) {
                const port = portMatch[1];
                const description = line.trim();
                
                // 优先保留包含更多描述信息的条目
                if (!portMap.has(port) || description.length > portMap.get(port).description.length) {
                    portMap.set(port, {
                        port: port,
                        description: description
                    });
                }
            }
        });

        // 转换Map为数组，并过滤掉可能的ESP32设备
        for (const device of portMap.values()) {
            // 优先显示可能是ESP32的设备（CH340, CP210x, FTDI等）
            if (device.description.toLowerCase().includes('ch340') ||
                device.description.toLowerCase().includes('cp210') ||
                device.description.toLowerCase().includes('ftdi') ||
                device.description.toLowerCase().includes('usb-serial')) {
                devices.unshift(device); // 放在前面
            } else {
                devices.push(device);
            }
        }

        return devices;
    }

    // 选择设备
    async selectDevice() {
        try {
            const devices = await this.detectDevices();
            
            if (devices.length === 0) {
                console.log('⚠️  未检测到ESP32设备');
                console.log('请确保：');
                console.log('1. ESP32已通过USB连接到电脑');
                console.log('2. 已安装ESP32驱动程序');
                console.log('3. 设备未被其他程序占用');
                return false;
            }

            console.log('\n📱 检测到以下设备:');
            devices.forEach((device, index) => {
                const isLikelyESP32 = device.description.toLowerCase().includes('ch340') ||
                                    device.description.toLowerCase().includes('cp210') ||
                                    device.description.toLowerCase().includes('ftdi') ||
                                    device.description.toLowerCase().includes('usb-serial');
                
                const marker = isLikelyESP32 ? '🔌' : '  ';
                console.log(`${index + 1}. ${marker} ${device.port} - ${device.description}`);
            });
            
            console.log('\n💡 提示: 🔌 标记的设备可能是ESP32开发板');

            if (devices.length === 1) {
                this.devicePort = devices[0].port;
                console.log(`\n✅ 自动选择设备: ${this.devicePort}`);
                return true;
            }

            return new Promise((resolve) => {
                rl.question('\n请选择设备 (输入数字): ', (answer) => {
                    const index = parseInt(answer) - 1;
                    if (index >= 0 && index < devices.length) {
                        this.devicePort = devices[index].port;
                        console.log(`✅ 已选择设备: ${this.devicePort}`);
                        resolve(true);
                    } else {
                        console.log('❌ 无效选择');
                        resolve(false);
                    }
                });
            });

        } catch (error) {
            console.error('❌ 检测设备失败:', error.message);
            return false;
        }
    }

    // 显示配置信息
    showConfigInfo() {
        try {
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            console.log('\n📋 当前配置信息:');
            console.log(`   设备名称: ${config.ble_device_name}`);
            console.log(`   服务数量: ${config.services.length}`);
            config.services.forEach(service => {
                console.log(`   - ${service.name}: ${service.description}`);
            });
        } catch (error) {
            console.error('❌ 读取配置文件失败:', error.message);
        }
    }

    // 询问是否修改设备名称
    async askForDeviceNameChange() {
        try {
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            const currentName = config.ble_device_name;
            
            console.log(`\n🏷️  当前蓝牙设备名称: ${currentName}`);
            
            return new Promise((resolve) => {
                rl.question('是否要修改设备名称？(y/N): ', (answer) => {
                    const shouldChange = answer.toLowerCase().trim() === 'y' || answer.toLowerCase().trim() === 'yes';
                    resolve(shouldChange);
                });
            });
            
        } catch (error) {
            console.error('❌ 读取配置失败:', error.message);
            return false;
        }
    }

    // 获取新的设备名称
    async getNewDeviceName() {
        return new Promise((resolve) => {
            rl.question('请输入新的设备名称: ', (newName) => {
                const trimmedName = newName.trim();
                if (trimmedName.length === 0) {
                    console.log('❌ 设备名称不能为空');
                    resolve(null);
                } else if (trimmedName.length > 32) {
                    console.log('❌ 设备名称不能超过32个字符');
                    resolve(null);
                } else {
                    resolve(trimmedName);
                }
            });
        });
    }

    // 更新设备名称
    async updateDeviceName(newName) {
        try {
            console.log(`\n🔄 正在更新设备名称为: ${newName}`);
            
            // 读取原始配置
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            const oldName = config.ble_device_name;
            
            // 更新设备名称
            config.ble_device_name = newName;
            
            // 写回文件
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
            
            console.log(`✅ 设备名称已更新: ${oldName} → ${newName}`);
            return true;
            
        } catch (error) {
            console.error('❌ 更新设备名称失败:', error.message);
            return false;
        }
    }

    // 处理设备名称修改流程
    async handleDeviceNameChange() {
        const shouldChange = await this.askForDeviceNameChange();
        
        if (shouldChange) {
            let newName = null;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (newName === null && attempts < maxAttempts) {
                newName = await this.getNewDeviceName();
                attempts++;
                
                if (newName === null && attempts < maxAttempts) {
                    console.log(`⚠️  请重新输入 (剩余尝试次数: ${maxAttempts - attempts})`);
                }
            }
            
            if (newName !== null) {
                const success = await this.updateDeviceName(newName);
                if (success) {
                    console.log('🎉 设备名称修改成功！新配置将在烧录时生效。');
                } else {
                    console.log('❌ 设备名称修改失败，将使用原有配置继续烧录。');
                }
            } else {
                console.log('❌ 设备名称修改失败，将使用原有配置继续烧录。');
            }
        } else {
            console.log('✅ 保持当前设备名称不变');
        }
    }

    // 构建固件
    async buildFirmware() {
        return new Promise((resolve, reject) => {
            console.log('\n🔨 开始构建固件...');
            
            const buildProcess = spawn('pio', ['run'], { 
                stdio: 'inherit',
                shell: true 
            });

            buildProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ 固件构建成功');
                    resolve(true);
                } else {
                    console.error('❌ 固件构建失败');
                    reject(new Error(`构建失败，退出码: ${code}`));
                }
            });

            buildProcess.on('error', (error) => {
                console.error('❌ 构建过程出错:', error.message);
                reject(error);
            });
        });
    }

    // 上传文件系统 (包含ble_config.json)
    async uploadFileSystem() {
        return new Promise((resolve, reject) => {
            console.log('\n📁 上传配置文件到设备...');
            
            const uploadProcess = spawn('pio', ['run', '--target', 'uploadfs'], { 
                stdio: 'inherit',
                shell: true 
            });

            uploadProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ 配置文件上传成功');
                    resolve(true);
                } else {
                    console.error('❌ 配置文件上传失败');
                    reject(new Error(`上传失败，退出码: ${code}`));
                }
            });

            uploadProcess.on('error', (error) => {
                console.error('❌ 上传过程出错:', error.message);
                reject(error);
            });
        });
    }

    // 上传固件
    async uploadFirmware() {
        return new Promise((resolve, reject) => {
            console.log('\n⬆️  上传固件到设备...');
            
            const uploadProcess = spawn('pio', ['run', '--target', 'upload'], { 
                stdio: 'inherit',
                shell: true 
            });

            uploadProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ 固件上传成功');
                    resolve(true);
                } else {
                    console.error('❌ 固件上传失败');
                    reject(new Error(`上传失败，退出码: ${code}`));
                }
            });

            uploadProcess.on('error', (error) => {
                console.error('❌ 上传过程出错:', error.message);
                reject(error);
            });
        });
    }

    // 显示主菜单
    showMainMenu() {
        console.log('\n📋 请选择操作:');
        console.log('1. 🔨 仅构建固件');
        console.log('2. 📁 仅上传配置文件');
        console.log('3. ⬆️  仅上传固件');
        console.log('4. 🚀 完整烧录 (推荐) - 构建并上传所有内容');
        console.log('5. 🏷️  修改蓝牙设备名称');
        console.log('6. 📺 打开串口监视器');
        console.log('7. ❌ 退出');
    }

    // 处理用户选择
    async handleUserChoice(choice) {
        try {
            switch (choice) {
                case '1':
                    await this.buildFirmware();
                    break;
                case '2':
                    await this.handleDeviceNameChange();
                    await this.uploadFileSystem();
                    break;
                case '3':
                    await this.uploadFirmware();
                    break;
                case '4':
                    await this.handleDeviceNameChange();
                    await this.buildFirmware();
                    await this.uploadFileSystem();
                    await this.uploadFirmware();
                    console.log('\n🎉 完整烧录成功！设备已准备就绪。');
                    break;
                case '5':
                    await this.handleDeviceNameChange();
                    break;
                case '6':
                    console.log('\n📺 正在打开串口监视器...');
                    console.log('按 Ctrl+C 退出监视器');
                    const monitorProcess = spawn('pio', ['device', 'monitor'], { 
                        stdio: 'inherit',
                        shell: true 
                    });
                    return; // 不继续显示菜单
                case '7':
                    console.log('👋 再见！');
                    process.exit(0);
                default:
                    console.log('❌ 无效选择，请重新选择');
            }
        } catch (error) {
            console.error('❌ 操作失败:', error.message);
        }
    }

    // 主循环
    async runMainLoop() {
        while (true) {
            this.showMainMenu();
            
            const choice = await new Promise((resolve) => {
                rl.question('\n请输入选择 (1-7): ', resolve);
            });

            await this.handleUserChoice(choice);
            
            if (choice !== '5' && choice !== '6') {
                console.log('\n按回车键继续...');
                await new Promise((resolve) => {
                    rl.question('', resolve);
                });
            }
        }
    }

    // 主运行方法
    async run() {
        this.showWelcome();

        // 检查必要文件
        if (!this.checkRequiredFiles()) {
            rl.close();
            process.exit(1);
        }

        this.showConfigInfo();

        // 检测并选择设备
        const deviceSelected = await this.selectDevice();
        if (!deviceSelected) {
            console.log('\n❌ 未选择有效设备，无法继续');
            rl.close();
            process.exit(1);
        }

        // 进入主循环
        await this.runMainLoop();
    }
}

// 错误处理
process.on('unhandledRejection', (error) => {
    console.error('❌ 未处理的错误:', error.message);
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('\n👋 用户中断，正在退出...');
    rl.close();
    process.exit(0);
});

// 运行工具
if (require.main === module) {
    const tool = new FlashTool();
    tool.run().catch((error) => {
        console.error('❌ 工具运行失败:', error.message);
        process.exit(1);
    });
}

module.exports = FlashTool; 