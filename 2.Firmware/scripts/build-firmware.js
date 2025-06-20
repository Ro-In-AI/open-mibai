const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 构建固件
console.log('🔨 开始构建固件...');
execSync('pio run', { stdio: 'inherit' });

// 读取版本信息
const version = process.env.FIRMWARE_VERSION || '1.0.0';
const buildDate = new Date().toISOString().split('T')[0];

// 创建版本目录
const versionDir = path.join(__dirname, '../release/firmware', `firmware_v${version}_${buildDate}`);
if (!fs.existsSync(versionDir)) {
    fs.mkdirSync(versionDir, { recursive: true });
}

// 复制固件文件
const buildDir = path.join(__dirname, '../.pio/build/esp32dev');
const firmwarePath = path.join(buildDir, 'firmware.bin');
const releasePath = path.join(versionDir, 'firmware.bin');

fs.copyFileSync(firmwarePath, releasePath);

// 创建固件信息文件
const info = {
    version,
    buildDate,
    size: fs.statSync(firmwarePath).size,
    md5: require('crypto')
        .createHash('md5')
        .update(fs.readFileSync(firmwarePath))
        .digest('hex')
};

fs.writeFileSync(
    path.join(versionDir, 'firmware_info.json'),
    JSON.stringify(info, null, 2)
);

// 创建版本说明文件
const readme = `# 固件版本 v${version}

## 基本信息
- 版本号：${version}
- 构建日期：${buildDate}
- 文件大小：${(info.size / 1024).toFixed(2)} KB
- MD5校验和：${info.md5}

## 更新说明
请在此处添加本次更新的具体内容。

## 使用说明
1. 使用APP的OTA功能进行升级
2. 确保设备电量充足
3. 升级过程中请勿断开蓝牙连接
`;

fs.writeFileSync(
    path.join(versionDir, 'README.md'),
    readme
);

console.log('✅ 固件打包完成！');
console.log(`📦 固件目录: ${versionDir}`);
console.log(`📄 固件信息: ${JSON.stringify(info, null, 2)}`); 