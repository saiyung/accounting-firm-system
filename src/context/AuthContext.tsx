import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { message } from 'antd';

// 用户角色类型
type UserRole = 'admin' | 'manager' | 'employee';

// 用户信息接口
interface UserInfo {
  id?: string;
  name: string;
  email: string;
  department: string;
  role: UserRole;
  avatar?: string;
  // 添加任何其他需要的用户信息字段
}

// 认证上下文接口
interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string, remember?: boolean, userData?: { name: string; department: string }) => Promise<boolean>;
  logout: () => void;
  register: (email: string, name: string, department: string, password: string) => Promise<boolean>;
  loading: boolean;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 检查用户是否已认证
  const isAuthenticated = !!user;
  
  // 检查用户是否是管理员
  const isAdmin = user?.role === 'admin';

  // 初始化时从本地存储加载用户信息
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const userJson = localStorage.getItem('user');
        if (userJson) {
          const userData = JSON.parse(userJson);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user data from storage', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  // 登录函数
  const login = async (
    email: string, 
    password: string, 
    remember: boolean = false,
    userData?: { name: string; department: string }
  ): Promise<boolean> => {
    setLoading(true);
    
    try {
      // 清除之前的用户数据
      localStorage.removeItem('user');
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 测试账号自动分配管理员权限
      let role: UserRole = 'employee';
      let name = userData?.name || email.split('@')[0];
      let department = userData?.department || '审计部';
      
      // 为特定用户设置管理员权限（可以根据需要修改）
      if (email.toLowerCase() === '1450870296@qq.com') {
        role = 'admin';
        name = '吴世宇';
        department = '审计部';
      } else if (email.includes('admin')) {
        role = 'admin';
      } else if (email.includes('manager')) {
        role = 'manager';
      }
      
      // 创建用户对象
      const userObject: UserInfo = {
        id: `U${Math.floor(Math.random() * 1000)}`,
        name: name,
        email: email,
        department: department,
        role: role
      };
      
      // 保存到本地存储
      localStorage.setItem('user', JSON.stringify(userObject));
      
      // 如果选择了记住我，设置一个较长的过期时间（30天）
      if (remember) {
        const rememberInfo = { email };
        localStorage.setItem('rememberAuth', JSON.stringify(rememberInfo));
      }
      
      // 更新状态
      setUser(userObject);
      
      message.success(`欢迎回来，${userObject.name}！`);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      message.error('登录失败，请检查您的凭据');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 注册函数
  const register = async (
    email: string,
    name: string,
    department: string,
    password: string
  ): Promise<boolean> => {
    setLoading(true);
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 确定用户角色，为测试账号自动分配管理员权限
      let role: UserRole = 'employee';
      
      if (email.toLowerCase() === '1450870296@qq.com') {
        role = 'admin';
        name = '吴世宇';
        department = '审计部';
      } else if (email.includes('admin')) {
        role = 'admin';
      } else if (email.includes('manager')) {
        role = 'manager';
      }
      
      // 创建用户对象
      const userObject: UserInfo = {
        id: `U${Math.floor(Math.random() * 1000)}`,
        name,
        email,
        department,
        role
      };
      
      // 保存到本地存储
      localStorage.setItem('user', JSON.stringify(userObject));
      
      // 更新状态
      setUser(userObject);
      
      message.success('注册成功！');
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      message.error('注册失败，请稍后再试');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 登出函数
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('rememberAuth');
    setUser(null);
    router.push('/login');
    message.success('您已成功登出');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isAdmin, 
      login, 
      logout, 
      register,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义Hook用于在组件中访问认证上下文
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
};

// 受保护路由组件
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole | 'any';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = 'any' 
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    } else if (
      !loading && 
      isAuthenticated && 
      requiredRole !== 'any' && 
      user?.role !== requiredRole
    ) {
      message.error('您没有访问此页面的权限');
      router.push('/');
    }
  }, [isAuthenticated, loading, requiredRole, router, user?.role]);

  // 如果正在加载或未认证，显示加载状态
  if (loading || !isAuthenticated) {
    return <div>加载中...</div>;
  }

  // 如果需要特定角色但用户没有该角色，返回空
  if (requiredRole !== 'any' && user?.role !== requiredRole) {
    return null;
  }

  // 通过所有检查，渲染子组件
  return <>{children}</>;
}; 