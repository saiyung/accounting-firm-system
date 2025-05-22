import axios from 'axios';
import { message } from 'antd';

// 创建一个axios实例
const instance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 请求拦截器
instance.interceptors.request.use(
  config => {
    // 从localStorage获取token并添加到请求头
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('请求错误：', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  response => {
    // 如果响应包含data.success字段，检查它是否为true
    if (response.data && typeof response.data.success !== 'undefined' && !response.data.success) {
      // 如果success为false，提取错误信息
      const errorMessage = response.data.message || response.data.error || '操作失败';
      
      // 使用Ant Design的message组件显示错误
      message.error(errorMessage);
      
      // 创建一个包含错误信息的Error对象
      const error = new Error(errorMessage);
      return Promise.reject(error);
    }
    
    return response;
  },
  error => {
    let errorMessage = '网络错误，请稍后重试';
    
    if (error.response) {
      // 服务器响应了，但状态码不在2xx范围内
      switch (error.response.status) {
        case 400:
          errorMessage = error.response.data?.message || '请求参数错误';
          break;
        case 401:
          errorMessage = '您的登录已过期，请重新登录';
          // 清除登录信息并重定向到登录页面
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          errorMessage = '您没有权限执行此操作';
          break;
        case 404:
          errorMessage = '请求的资源不存在';
          break;
        case 500:
          errorMessage = '服务器内部错误';
          break;
        default:
          errorMessage = `请求失败 (${error.response.status})`;
      }
    } else if (error.request) {
      // 请求发出但没有收到响应
      errorMessage = '服务器无响应，请检查网络连接';
      
      // 记录到控制台，但不显示给用户，因为这通常是由网络问题引起的
      console.error('网络错误：', error.request);
      
      // 不显示消息，静默失败
      return Promise.reject(error);
    }
    
    // 如果不是网络错误，显示错误消息
    if (error.config && !error.config.silent) {
      message.error(errorMessage);
    }
    
    return Promise.reject(error);
  }
);

// 导出axios实例
export default instance; 