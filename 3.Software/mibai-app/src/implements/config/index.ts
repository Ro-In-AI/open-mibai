// API配置文件

export const API_CONFIG = {
  baseURL: 'https://api.example.com', // 替换为实际的API基础URL
  timeout: 10000, // 请求超时时间（毫秒）
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// 响应状态码配置
export const STATUS_CODES = {
  SUCCESS: 200,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
};

// API版本配置
export const API_VERSION = 'v1';