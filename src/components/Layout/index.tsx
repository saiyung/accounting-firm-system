import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Breadcrumb, Space, Modal, message, List, Popover, Button, Row, Col, Card, theme, Divider } from 'antd';
import { Typography } from 'antd';
import { 
  AppstoreOutlined, 
  FileTextOutlined, 
  TeamOutlined, 
  DashboardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  SafetyOutlined,
  HomeOutlined,
  NotificationOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { MenuProps } from 'antd';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const { token } = theme.useToken();
  const { user, isAdmin, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  // 通知弹窗控制
  const [notificationOpen, setNotificationOpen] = useState(false);
  
  // 页面切换动画效果
  const [pageTransition, setPageTransition] = useState(false);
  
  // 页面路由变化时添加过渡效果
  useEffect(() => {
    setPageTransition(true);
    const timer = setTimeout(() => setPageTransition(false), 300);
    return () => clearTimeout(timer);
  }, [router.pathname]);

  const toggle = () => {
    setCollapsed(!collapsed);
  };

  // 判断是否是用户设置相关页面
  const isUserSettingsPage = () => {
    return router.pathname.startsWith('/user/');
  };

  // 判断是否是通知中心页面
  const isNotificationsPage = () => {
    return router.pathname === '/notifications';
  };
  
  // 退出登录处理函数
  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        // 执行退出登录
        logout();
        // 跳转到登录页
        router.push('/login');
      }
    });
  };

  // 处理用户菜单点击
  const handleUserMenuClick = (e: any) => {
    if (e.key === '4') { // 退出登录
      handleLogout();
    } else if (e.key === '1') { // 个人资料
      router.push('/user/profile');
    } else if (e.key === '2') { // 账号设置
      router.push('/user/settings');
    } else if (e.key === '3') { // 修改密码
      router.push('/user/password');
    }
  };

  // 处理通知点击
  const handleNotificationItemClick = (notificationId: string) => {
    setNotificationOpen(false);
    // 标记通知为已读
    markAsRead(notificationId);
    
    switch (notificationId) {
      case '1':
        message.info('正在跳转到项目报告详情页面');
        router.push('/project/reports?from=notification');
        break;
      case '2':
        message.info('正在跳转到系统更新详情页面');
        router.push('/system/updates?from=notification');
        break;
      case '3':
        message.info('正在跳转到项目列表页面');
        router.push('/project?filter=deadline');
        break;
      case '4':
        router.push('/notifications');
        break;
      default:
        break;
    }
  };

  // 处理当前路由以确定菜单选中项
  const getSelectedKeys = () => {
    const path = router.pathname;
    if (path === '/') return ['0'];
    if (path.startsWith('/project')) return ['1'];
    if (path.startsWith('/report')) return ['2'];
    if (path.startsWith('/data')) return ['3'];
    if (path.startsWith('/dashboard')) return ['4'];
    if (path.startsWith('/system/users')) return ['5'];
    if (path.startsWith('/system/company-notices')) return ['6'];
    return []; // 不选中任何菜单项
  };

  // 用户菜单项
  const userMenuItems: MenuProps['items'] = [
    {
      key: '1',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: '2',
      icon: <SettingOutlined />,
      label: '账号设置',
    },
    {
      key: '3',
      icon: <SafetyOutlined />,
      label: '修改密码',
    },
    {
      type: 'divider',
    },
    {
      key: '4',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  // 通知内容
  const notificationContent = (
    <div style={{ width: 300 }}>
      <List
        itemLayout="horizontal"
        dataSource={notifications}
        renderItem={item => (
          <List.Item 
            key={item.id}
            style={{ 
              padding: '10px 16px', 
              cursor: 'pointer',
              backgroundColor: item.read ? 'transparent' : '#f0f8ff'
            }}
            onClick={() => handleNotificationItemClick(item.id)}
            className="notification-item"
          >
            <List.Item.Meta
              title={<span style={{ fontWeight: item.read ? 'normal' : 'bold' }}>{item.title}</span>}
              description={item.description}
            />
            {!item.read && <Badge status="processing" style={{ marginLeft: 8 }} />}
          </List.Item>
        )}
        footer={
          <div 
            style={{ 
              textAlign: 'center', 
              padding: '10px 0', 
              cursor: 'pointer', 
              borderTop: '1px solid #f0f0f0' 
            }}
            onClick={() => handleNotificationItemClick('4')}
            className="view-all-notifications"
          >
            查看全部通知
          </div>
        }
      />
    </div>
  );

  // 根据路径生成面包屑
  const generateBreadcrumb = () => {
    const path = router.pathname;
    const items = [];
    
    // 首页永远是第一项
    items.push({ 
      path: '/', 
      title: '首页',
      icon: <HomeOutlined />
    });

    if (path === '/') return items;

    const pathSegments = path.split('/').filter(Boolean);
    
    let currentPath = '';
    for (const segment of pathSegments) {
      currentPath += `/${segment}`;
      
      let title = segment.charAt(0).toUpperCase() + segment.slice(1);
      let icon = null;
      
      // 根据路径设置中文名称
      if (segment === 'project') {
        title = '项目管理';
        icon = <AppstoreOutlined />;
      }
      if (segment === 'report') {
        title = '智能报告';
        icon = <FileTextOutlined />;
      }
      if (segment === 'data') {
        title = '数据管理';
        icon = <TeamOutlined />;
      }
      if (segment === 'dashboard') {
        title = '决策支持';
        icon = <DashboardOutlined />;
      }
      if (segment === 'system') {
        title = '系统管理';
        icon = <SafetyOutlined />;
      }
      if (segment === 'users') title = '用户管理';
      if (segment === 'reports') title = '项目报告';
      if (segment === 'updates') title = '系统更新';
      if (segment === 'notifications') title = '通知中心';
      
      items.push({ path: currentPath, title, icon });
    }
    
    return items;
  };
  
  const breadcrumbItems = generateBreadcrumb();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={220} style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.15)' }}>
        <div className="logo" style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0' : '0 24px',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
          background: 'rgba(255,255,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          overflow: 'hidden'
        }}>
          {!collapsed && <span>会计师事务所</span>}
          {collapsed && <UserOutlined />}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          style={{ 
            borderRight: 0,
            paddingTop: '8px' 
          }}
          items={[
            {
              key: '0',
              icon: <HomeOutlined />,
              label: <Link href="/">首页</Link>,
              style: { margin: '4px 0' }
            },
            {
              type: 'divider',
              style: { 
                background: 'rgba(255,255,255,0.1)', 
                margin: '12px 16px', 
                height: '1px' 
              }
            },
            {
              key: '1',
              icon: <AppstoreOutlined />,
              label: <Link href="/project">项目管理</Link>,
              style: { margin: '8px 0' }
            },
            {
              key: '2',
              icon: <FileTextOutlined />,
              label: <Link href="/report">智能报告</Link>,
              style: { margin: '8px 0' }
            },
            {
              type: 'divider',
              style: { 
                background: 'rgba(255,255,255,0.1)', 
                margin: '12px 16px', 
                height: '1px' 
              }
            },
            {
              key: '3',
              icon: <TeamOutlined />,
              label: <Link href="/data">数据管理</Link>,
              style: { margin: '8px 0' }
            },
            {
              key: '4',
              icon: <DashboardOutlined />,
              label: <Link href="/dashboard">决策支持</Link>,
              style: { margin: '8px 0' }
            },
            {
              type: 'divider',
              style: { 
                background: 'rgba(255,255,255,0.1)', 
                margin: '12px 16px', 
                height: '1px' 
              }
            },
            // 仅对管理员显示用户管理菜单
            ...(isAdmin ? [{
              key: '5',
              icon: <SafetyOutlined />,
              label: <Link href="/system/users">用户管理</Link>,
              style: { margin: '8px 0' }
            }] : []),
            {
              key: '6',
              icon: <NotificationOutlined />,
              label: <Link href="/system/company-notices">公司通知</Link>,
              style: { margin: '8px 0' }
            },
          ]}
        />
        <div style={{ 
          position: 'absolute', 
          bottom: '16px', 
          left: 0, 
          right: 0, 
          textAlign: 'center', 
          color: 'rgba(255,255,255,0.3)',
          fontSize: '12px',
          padding: '0 16px'
        }}>
          {!collapsed && <div>© 2025 会计师事务所</div>}
        </div>
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: token.colorBgContainer }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', paddingRight: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={toggle}
                style={{ fontSize: '16px', width: 64, height: 64 }}
              />
              {!isNotificationsPage() && !isUserSettingsPage() && (
                <Breadcrumb style={{ margin: '16px 0' }}>
                  {breadcrumbItems.map((item, index) => (
                    <Breadcrumb.Item key={index}>
                      {index < breadcrumbItems.length - 1 ? (
                        <Link href={item.path}>
                          {item.icon && <span style={{ marginRight: 4 }}>{item.icon}</span>}
                          {item.title}
                        </Link>
                      ) : (
                        <span>
                          {item.icon && <span style={{ marginRight: 4 }}>{item.icon}</span>}
                          {item.title}
                        </span>
                      )}
                    </Breadcrumb.Item>
                  ))}
                </Breadcrumb>
              )}
            </div>
            <Space size={16}>
              <Button 
                type="text" 
                icon={<SafetyOutlined />} 
                onClick={() => router.push('/user/password')}
              >
                修改密码
              </Button>
              <Popover
                content={notificationContent}
                title="通知"
                trigger="click"
                open={notificationOpen}
                onOpenChange={setNotificationOpen}
                placement="bottomRight"
                overlayStyle={{ width: 300 }}
                overlayInnerStyle={{ padding: 0 }}
              >
                <Badge count={unreadCount} offset={[-2, 2]}>
                  <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
                </Badge>
              </Popover>
              <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar icon={<UserOutlined />} />
                  {user ? <span>{user.name}</span> : <span>未登录</span>}
                </Space>
              </Dropdown>
            </Space>
          </div>
        </Header>

        <Content style={{
          margin: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {isUserSettingsPage() && (
            <Card bordered={false}>
              <Row align="middle" justify="space-between">
                <Col>
                  <Link href="/" style={{ fontSize: 16, display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: 8 }}>←</span> 返回首页
                  </Link>
                </Col>
                <Col>
                  <Title level={2} style={{ margin: 0 }}>
                    {router.pathname.includes('/user/profile') && '个人资料'}
                    {router.pathname.includes('/user/settings') && '账号设置'}
                    {router.pathname.includes('/user/password') && '修改密码'}
                  </Title>
                </Col>
              </Row>
            </Card>
          )}
          <div style={{
            opacity: pageTransition ? 0.7 : 1,
            transition: 'opacity 0.3s ease'
          }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout; 