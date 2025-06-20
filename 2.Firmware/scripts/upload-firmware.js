#!/usr/bin/env node

/**
 * 固件自动上传脚本
 * 依赖：axios（需先 npm install axios）
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// 固件目录
const firmwareDir = path.join(__dirname, '../release/firmware/firmware_v1.0.0_2025-06-18');
const firmwareBin = path.join(firmwareDir, 'firmware.bin');
const firmwareInfo = path.join(firmwareDir, 'firmware_info.json');
const readmePath = path.join(firmwareDir, 'README.md');

// 读取版本号
let version = '1.0.1';
try {
  const info = JSON.parse(fs.readFileSync(firmwareInfo, 'utf8'));
  version = info.version || version;
} catch (e) {
  console.warn('⚠️  未能读取 firmware_info.json，使用默认版本号 1.0.0');
}

// 读取更新说明
let description = '';
try {
  const readme = fs.readFileSync(readmePath, 'utf8');
  const match = readme.match(/## 更新说明\n([\s\S]*?)\n##/);
  if (match && match[1].trim()) {
    description = match[1].trim();
  } else {
    description = '暂无更新说明';
  }
} catch (e) {
  description = '暂无更新说明';
}

// 检查 axios 依赖
try {
  require.resolve('axios');
} catch (e) {
  console.error('❌ 未安装 axios 依赖，请先运行：npm install axios');
  process.exit(1);
}

// 上传固件
async function uploadFirmware() {
  const url = 'http://127.0.0.1:8000/api/firmware/upload';
  const form = new FormData();
  form.append('file', fs.createReadStream(firmwareBin));
  form.append('version', version);
  form.append('description', description);

  try {
    const response = await axios.post(url, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    console.log('✅ 固件上传成功！返回信息:');
    console.log(response.data);
  } catch (err) {
    if (err.response) {
      console.error('❌ 上传失败:', err.response.data);
    } else {
      console.error('❌ 上传失败:', err.message);
    }
  }
}

uploadFirmware(); 