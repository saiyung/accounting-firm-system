import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import axios from '@/lib/axios';

// 定义通知类型
export type NoticeType = 'important' | 'update' | 'notice' | 'event';

// 定义公司通知接口
export interface CompanyNotice {
  id: number;
  title: string;
  content: string;
  date: string;
  type: NoticeType;
  read: boolean;
}

// 类型颜色映射
export const typeMap: Record<string, { text: string; color: string }> = {
  important: { text: '重要', color: 'red' },
  update: { text: '更新', color: 'blue' },
  notice: { text: '通知', color: 'green' },
  event: { text: '活动', color: 'purple' }
};

// 定义公司通知上下文类型
interface CompanyNoticeContextType {
  notices: CompanyNotice[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  addNotice: (notice: Omit<CompanyNotice, 'id' | 'read'>) => void;
  updateNotice: (notice: CompanyNotice) => void;
  deleteNotice: (id: number) => void;
  resetAllToUnread: () => void;
}

// 创建公司通知上下文
const CompanyNoticeContext = createContext<CompanyNoticeContextType | undefined>(undefined);

// 公司通知提供者组件
export const CompanyNoticeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notices, setNotices] = useState<CompanyNotice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // 计算未读通知数量
  const unreadCount = notices.filter(item => !item.read).length;

  // 从后端API获取通知数据
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/notifications');
        if (response.data.success) {
          const noticesData = response.data.data;
          setNotices(noticesData);
          // 成功获取数据后，将数据缓存到本地存储
          localStorage.setItem('companyNotices', JSON.stringify(noticesData));
        } else {
          console.error('获取通知失败:', response.data.message);
          loadCachedNotices();
        }
      } catch (error) {
        console.error('获取通知数据失败:', error);
        loadCachedNotices();
      } finally {
        setLoading(false);
      }
    };
    
    // 从本地存储加载通知数据
    const loadCachedNotices = () => {
      try {
        const cachedNotices = localStorage.getItem('companyNotices');
        if (cachedNotices) {
          const parsedNotices = JSON.parse(cachedNotices);
          setNotices(parsedNotices);
          console.log('从本地存储加载通知数据');
        } else {
          console.log('本地存储中没有通知数据');
          // 如果本地没有缓存，设置一个默认空数组
          setNotices([]);
        }
      } catch (e) {
        console.error('解析缓存通知数据失败:', e);
        setNotices([]);
      }
    };
    
    fetchNotices();
  }, []);

  // 将单个通知标记为已读
  const markAsRead = async (id: number) => {
    try {
      // 先更新本地状态，提供及时反馈
      setNotices(prev => 
        prev.map(item => 
          item.id === id ? { ...item, read: true } : item
        )
      );
      
      // 同步更新本地存储
      const updatedNotices = notices.map(item => 
        item.id === id ? { ...item, read: true } : item
      );
      localStorage.setItem('companyNotices', JSON.stringify(updatedNotices));
      
      // 然后发送请求到服务器
      const response = await axios.put(`/api/notifications/${id}/read`);
      if (!response.data.success) {
        console.error('标记通知已读失败:', response.data.message);
      }
    } catch (error) {
      console.error('标记通知已读失败:', error);
      // 出错时不回滚本地状态，保持用户体验的一致性
    }
  };

  // 将所有通知标记为已读
  const markAllAsRead = async () => {
    try {
      // 先更新本地状态
      const updatedNotices = notices.map(item => ({ ...item, read: true }));
      setNotices(updatedNotices);
      
      // 同步更新本地存储
      localStorage.setItem('companyNotices', JSON.stringify(updatedNotices));
      
      // 然后发送请求到服务器
      const response = await axios.put('/api/notifications/read-all');
      if (!response.data.success) {
        console.error('标记所有通知已读失败:', response.data.message);
      }
    } catch (error) {
      console.error('标记所有通知已读失败:', error);
      // 出错时不回滚本地状态
    }
  };

  // 添加新通知
  const addNotice = async (notice: Omit<CompanyNotice, 'id' | 'read'>) => {
    try {
      const response = await axios.post('/api/notifications', notice);
      if (response.data.success) {
        const newNotice = response.data.data;
        const updatedNotices = [newNotice, ...notices];
        setNotices(updatedNotices);
        
        // 更新本地存储
        localStorage.setItem('companyNotices', JSON.stringify(updatedNotices));
      } else {
        console.error('添加通知失败:', response.data.message);
      }
    } catch (error) {
      console.error('添加通知失败:', error);
    }
  };

  // 更新通知
  const updateNotice = async (notice: CompanyNotice) => {
    try {
      // 先更新本地状态
      const updatedNotices = notices.map(item => 
        item.id === notice.id ? notice : item
      );
      setNotices(updatedNotices);
      
      // 同步更新本地存储
      localStorage.setItem('companyNotices', JSON.stringify(updatedNotices));
      
      // 然后发送请求到服务器
      const response = await axios.put(`/api/notifications/${notice.id}`, notice);
      if (!response.data.success) {
        console.error('更新通知失败:', response.data.message);
      }
    } catch (error) {
      console.error('更新通知失败:', error);
      // 出错时不回滚本地状态
    }
  };

  // 删除通知
  const deleteNotice = async (id: number) => {
    try {
      // 先更新本地状态
      const updatedNotices = notices.filter(item => item.id !== id);
      setNotices(updatedNotices);
      
      // 同步更新本地存储
      localStorage.setItem('companyNotices', JSON.stringify(updatedNotices));
      
      // 然后发送请求到服务器
      const response = await axios.delete(`/api/notifications/${id}`);
      if (!response.data.success) {
        console.error('删除通知失败:', response.data.message);
      }
    } catch (error) {
      console.error('删除通知失败:', error);
      // 出错时不回滚本地状态
    }
  };

  // 将所有通知重置为未读状态
  const resetAllToUnread = async () => {
    try {
      // 先更新本地状态
      const updatedNotices = notices.map(item => ({ ...item, read: false }));
      setNotices(updatedNotices);
      
      // 同步更新本地存储
      localStorage.setItem('companyNotices', JSON.stringify(updatedNotices));
      
      // 然后发送请求到服务器
      const response = await axios.put('/api/notifications/reset-all');
      if (!response.data.success) {
        console.error('重置通知状态失败:', response.data.message);
      }
    } catch (error) {
      console.error('重置通知状态失败:', error);
      // 出错时不回滚本地状态
    }
  };

  return (
    <CompanyNoticeContext.Provider 
      value={{ 
        notices, 
        unreadCount, 
        markAsRead, 
        markAllAsRead,
        addNotice,
        updateNotice,
        deleteNotice,
        resetAllToUnread
      }}
    >
      {children}
    </CompanyNoticeContext.Provider>
  );
};

// 自定义钩子，用于访问公司通知上下文
export const useCompanyNotices = () => {
  const context = useContext(CompanyNoticeContext);
  if (context === undefined) {
    throw new Error('useCompanyNotices must be used within a CompanyNoticeProvider');
  }
  return context;
}; 