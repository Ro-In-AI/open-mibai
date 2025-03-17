import { API_CONFIG, API_VERSION } from '../config';

// 用户相关的API服务
export const userService = {
  // 用户登录
  login: async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/${API_VERSION}/auth/login`, {
        method: 'POST',
        headers: API_CONFIG.headers,
        body: JSON.stringify({ username, password })
      });
      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // 获取用户信息
  getUserInfo: async (userId: string) => {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/${API_VERSION}/users/${userId}`, {
        method: 'GET',
        headers: API_CONFIG.headers
      });
      return await response.json();
    } catch (error) {
      console.error('Get user info error:', error);
      throw error;
    }
  },

  // 更新用户信息
  updateUserInfo: async (userId: string, userData: any) => {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/${API_VERSION}/users/${userId}`, {
        method: 'PUT',
        headers: API_CONFIG.headers,
        body: JSON.stringify(userData)
      });
      return await response.json();
    } catch (error) {
      console.error('Update user info error:', error);
      throw error;
    }
  }
};