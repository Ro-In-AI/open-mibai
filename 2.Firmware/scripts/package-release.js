#!/usr/bin/env node

/**
 * ErroRightAI Mibai2 固件发布打包工具
 * 
 * 此脚本将创建一个可发布的压缩包，包含所有必要的文件
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PackageRelease {
    constructor() {
        this.packageName = 'mibai2_firmware_release';
        this.version = this.getVersion();
        this.releaseDir = `release/packages/${this.packageName}_v${this.version}`;
    }

    // 获取版本号
    getVersion() {
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            return packageJson.version;
        } catch (error) {
            console.error('无法读取版本号，使用默认版本');
            return '1.0.0';
        }
    }

    // 创建发布目录
    createReleaseDirectory() {
        console.log('📁 创建发布目录...');
        
        // 删除旧的发布目录
        if (fs.existsSync(this.releaseDir)) {
            fs.rmSync(this.releaseDir, { recursive: true, force: true });
        }
        
        // 创建新的发布目录
        fs.mkdirSync(this.releaseDir, { recursive: true });
        console.log(`✅ 发布目录已创建: ${this.releaseDir}`);
    }

    // 复制必要文件
    copyEssentialFiles() {
        console.log('📋 复制必要文件...');
        
        const filesToCopy = [
            // 项目核心文件
            'platformio.ini',
            'package.json',
            'flash-tool.bat',
            'flash-tool-conda.bat',
            '烧录说明.md',
            
            // 源代码目录
            'src/',
            'data/',
            'include/',
            'lib/',
            
            // 脚本目录
            'scripts/',
            
            // 配置文件
            '.cz-config.js'
        ];

        filesToCopy.forEach(item => {
            const srcPath = item;
            const destPath = path.join(this.releaseDir, item);
            
            if (fs.existsSync(srcPath)) {
                if (fs.statSync(srcPath).isDirectory()) {
                    this.copyDirectory(srcPath, destPath);
                } else {
                    // 确保目标目录存在
                    const destDir = path.dirname(destPath);
                    if (!fs.existsSync(destDir)) {
                        fs.mkdirSync(destDir, { recursive: true });
                    }
                    fs.copyFileSync(srcPath, destPath);
                }
                console.log(`   ✅ ${item}`);
            } else {
                console.log(`   ⚠️  跳过不存在的文件: ${item}`);
            }
        });
    }

    // 递归复制目录
    copyDirectory(src, dest) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }

        const items = fs.readdirSync(src);
        items.forEach(item => {
            const srcPath = path.join(src, item);
            const destPath = path.join(dest, item);
            
            // 跳过不需要的文件和目录
            if (this.shouldSkipItem(item, srcPath)) {
                return;
            }
            
            if (fs.statSync(srcPath).isDirectory()) {
                this.copyDirectory(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        });
    }

    // 判断是否跳过某些文件/目录
    shouldSkipItem(item, fullPath) {
        const skipPatterns = [
            '.git',
            'node_modules',
            '.pio',
            'logs',
            '.vscode',
            'test',
            '.gitignore',
            'package-lock.json'
        ];

        return skipPatterns.some(pattern => {
            if (pattern.includes('.')) {
                return item === pattern;
            } else {
                return item.includes(pattern);
            }
        });
    }

    // 创建简化的package.json
    createSimplifiedPackageJson() {
        console.log('📦 创建简化的package.json...');
        
        const originalPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        const simplifiedPackage = {
            name: originalPackage.name,
            version: originalPackage.version,
            description: originalPackage.description,
            scripts: originalPackage.scripts,
            dependencies: {},
            // 移除开发依赖
            author: originalPackage.author,
            license: originalPackage.license
        };

        fs.writeFileSync(
            path.join(this.releaseDir, 'package.json'),
            JSON.stringify(simplifiedPackage, null, 2)
        );
        
        console.log('✅ 简化的package.json已创建');
    }

    // 创建发布说明
    createReleaseNotes() {
        console.log('📝 创建发布说明...');
        
        const releaseNotes = `# Mibai2 固件发布包 v${this.version}

## 📦 包含内容

- ✅ 完整源代码
- ✅ 配置文件 (BLE配置等)
- ✅ 一键烧录工具
- ✅ 详细使用说明
- ✅ PlatformIO 项目配置

## 🚀 快速开始

1. **双击运行**: \`flash-tool.bat\`
2. **按照提示**: 连接ESP32设备
3. **选择烧录**: 选择"完整烧录"
4. **等待完成**: 烧录完成后设备自动重启

## 📋 系统要求

- Windows 10/11
- Node.js (v14+)
- PlatformIO Core
- ESP32 驱动程序

## 📖 详细说明

请查看 \`烧录说明.md\` 获取完整的使用指南。

## 📞 技术支持

如有问题，请联系 ErroRightAI 技术支持。

---

## 📦 目录结构

\`\`\`
release/
├── firmware/          # 固件文件目录
│   ├── firmware_v1.0.0_2024-03-21.bin
│   └── firmware_v1.0.0_2024-03-21.json
└── packages/          # 发布包目录
    └── mibai2_firmware_release_v1.0.0/
        ├── src/
        ├── data/
        ├── scripts/
        └── ...
\`\`\`

`;

        fs.writeFileSync(
            path.join(this.releaseDir, 'README.txt'),
            releaseNotes
        );
        
        console.log('✅ 发布说明已创建');
    }

    // 创建压缩包
    createArchive() {
        console.log('🗜️  创建压缩包...');
        
        try {
            const archiveName = `${this.packageName}_v${this.version}.zip`;
            const archivePath = `release/${archiveName}`;
            
            // 使用.NET方法创建压缩包，避免文件占用问题
            const command = `powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${this.releaseDir}', '${archivePath}')"`;
            execSync(command, { stdio: 'inherit' });
            
            console.log(`✅ 压缩包已创建: ${archivePath}`);
            
            // 显示文件大小
            const stats = fs.statSync(archivePath);
            const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
            console.log(`📊 文件大小: ${fileSizeInMB} MB`);
            
        } catch (error) {
            console.error('❌ 创建压缩包失败:', error.message);
            console.log('💡 请手动压缩目录:', this.releaseDir);
        }
    }

    // 清理临时文件
    cleanup() {
        console.log('🧹 清理临时文件...');
        
        try {
            // 保留压缩包，删除临时目录
            if (fs.existsSync(this.releaseDir)) {
                fs.rmSync(this.releaseDir, { recursive: true, force: true });
                console.log('✅ 临时文件已清理');
            }
        } catch (error) {
            console.error('⚠️  清理失败:', error.message);
        }
    }

    // 显示完成信息
    showCompletion() {
        console.log('\n🎉 发布包创建完成！');
        console.log('='.repeat(50));
        console.log('📦 发布包信息:');
        console.log(`   名称: ${this.packageName}`);
        console.log(`   版本: v${this.version}`);
        console.log(`   位置: release/`);
        console.log('\n📋 发布包包含:');
        console.log('   ✅ 完整固件源代码');
        console.log('   ✅ BLE配置文件');
        console.log('   ✅ 一键烧录工具');
        console.log('   ✅ 使用说明文档');
        console.log('\n🚀 用户使用方法:');
        console.log('   1. 解压缩包');
        console.log('   2. 双击 flash-tool.bat');
        console.log('   3. 按提示操作');
        console.log('='.repeat(50));
    }

    // 主执行方法
    async run() {
        console.log('\n🚀 开始创建发布包...');
        console.log('='.repeat(50));
        
        try {
            this.createReleaseDirectory();
            this.copyEssentialFiles();
            this.createSimplifiedPackageJson();
            this.createReleaseNotes();
            this.createArchive();
            this.cleanup();
            this.showCompletion();
            
        } catch (error) {
            console.error('\n❌ 发布包创建失败:', error.message);
            process.exit(1);
        }
    }
}

// 运行打包工具
if (require.main === module) {
    const packager = new PackageRelease();
    packager.run();
}

module.exports = PackageRelease; 