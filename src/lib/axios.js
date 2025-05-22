import axios from 'axios';

// 创建axios实例
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器：添加认证token
axiosInstance.interceptors.request.use(
  (config) => {
    let token = null;
    
    // 从localStorage获取用户信息
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        token = userData.token;
      }
    }
    
    // 如果存在token，添加到请求头
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理错误
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 处理401未授权错误
    if (error.response && error.response.status === 401) {
      console.error('未授权，请重新登录');
      // 清除本地存储的用户信息
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        // 可以选择重定向到登录页
        // window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance; 