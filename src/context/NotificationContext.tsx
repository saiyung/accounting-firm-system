import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// 定义通知数据类型
export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  read: boolean;
  link: string;
}

// 定义通知上下文类型
interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

// 初始通知数据
const initialNotifications: NotificationItem[] = [
  {
    id: '1',
    title: '王经理评论了项目报告',
    description: '5分钟前',
    read: false,
    link: '/project/reports?from=notification'
  },
  {
    id: '2',
    title: '系统更新完成',
    description: '1小时前',
    read: false,
    link: '/system/updates?from=notification'
  },
  {
    id: '3',
    title: '您有3个项目即将截止',
    description: '2小时前',
    read: false,
    link: '/project?filter=deadline'
  }
];

// 创建通知上下文
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// 通知提供者组件
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  
  // 计算未读通知数量
  const unreadCount = notifications.filter(item => !item.read).length;

  // 从本地存储加载通知数据
  useEffect(() => {
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications);
        if (Array.isArray(parsedNotifications)) {
          setNotifications(parsedNotifications);
        }
      } catch (error) {
        console.error('加载通知数据失败:', error);
      }
    }
  }, []);

  // 将通知数据保存到本地存储
  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('保存通知数据失败:', error);
    }
  }, [notifications]);

  // 将单个通知标记为已读
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(item => 
        item.id === id ? { ...item, read: true } : item
      )
    );
  };

  // 将所有通知标记为已读
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(item => ({ ...item, read: true }))
    );
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount, 
        markAsRead, 
        markAllAsRead 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// 自定义钩子，用于访问通知上下文
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 