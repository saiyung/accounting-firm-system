import React, { useState } from 'react';
import { NextPage } from 'next';
import { List, Avatar, Tag, Space, Typography, Divider, Tabs, Button, Badge, Dropdown, MenuProps } from 'antd';
import { BellOutlined, UserOutlined, CommentOutlined, InfoCircleOutlined, ClockCircleOutlined, FilterOutlined, CheckOutlined } from '@ant-design/icons';
import AppLayout from '../components/Layout';
import { useNotifications } from '@/context/NotificationContext';

const { Title, Text } = Typography;

// 扩展通知数据，添加额外的详细信息
const extendedNotificationsData = [
  {
    id: '1',
    title: '王经理评论了项目报告',
    content: '在《2023财年审计报告》中添加了新评论：请补充现金流量表的说明。',
    time: '2023-10-25 14:30',
    type: 'comment',
    avatar: 'W',
    color: '#1890ff',
    link: '/project/reports?from=notification'
  },
  {
    id: '2',
    title: '系统更新完成',
    content: '系统已更新至 v2.3.0 版本，新增了报表导出功能和权限管理优化。',
    time: '2023-10-25 09:15',
    type: 'system',
    avatar: <InfoCircleOutlined />,
    color: '#52c41a',
    link: '/system/updates?from=notification'
  },
  {
    id: '3',
    title: '您有3个项目即将截止',
    content: '以下项目将在3天内截止：华为2023年Q3财务审计、中软集团税务申报、腾讯集团内控评估',
    time: '2023-10-24 16:45',
    type: 'deadline',
    avatar: <ClockCircleOutlined />,
    color: '#faad14',
    link: '/project?filter=deadline'
  },
  {
    id: '4',
    title: '李总监已批准您的请假申请',
    content: '您的请假申请（2023年10月30日至11月3日）已获批准。',
    time: '2023-10-23 11:20',
    type: 'approval',
    avatar: 'L',
    color: '#722ed1',
    link: '/personal/leave'
  },
  {
    id: '5',
    title: '新的任务分配',
    content: '您已被分配到"中国石化2023年度财务报表审计"项目，请查看详情。',
    time: '2023-10-22 09:30',
    type: 'task',
    avatar: <UserOutlined />,
    color: '#eb2f96',
    link: '/project/5'
  },
  {
    id: '6',
    title: '您的报告已获批准',
    content: '您提交的《2023年Q3税务咨询报告》已获合伙人批准，可以发送给客户。',
    time: '2023-10-21 14:55',
    type: 'approval',
    avatar: <CheckOutlined />,
    color: '#52c41a',
    link: '/report/6'
  },
];

// 修改类型定义，添加getLayout属性
const NotificationsPage: NextPage & {
  getLayout?: (page: React.ReactElement) => React.ReactNode;
} = () => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [activeTab, setActiveTab] = useState('all');
  
  // 合并通知数据与额外信息
  const mergedNotifications = notifications.map(notification => {
    const extendedInfo = extendedNotificationsData.find(item => item.id === notification.id);
    return {
      ...notification,
      ...(extendedInfo || {}),
    };
  });
  
  // 添加其他通知数据
  const allNotifications = [
    ...mergedNotifications,
    ...extendedNotificationsData.filter(item => 
      !notifications.some(notification => notification.id === item.id)
    ).map(item => ({
      ...item,
      read: true, // 默认将其标记为已读
      description: item.time // 确保有description字段
    }))
  ];

  // 过滤通知
  const getFilteredNotifications = () => {
    if (activeTab === 'all') return allNotifications;
    if (activeTab === 'unread') return allNotifications.filter(item => !item.read);
    return allNotifications.filter(item => item.type === activeTab);
  };

  // 获取未读通知数量
  const getUnreadCount = (type = 'all') => {
    if (type === 'all') return allNotifications.filter(item => !item.read).length;
    return allNotifications.filter(item => !item.read && item.type === type).length;
  };

  // 渲染通知图标
  const renderIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <CommentOutlined />;
      case 'system':
        return <InfoCircleOutlined />;
      case 'deadline':
        return <ClockCircleOutlined />;
      case 'task':
        return <UserOutlined />;
      case 'approval':
        return <CheckOutlined />;
      default:
        return <BellOutlined />;
    }
  };

  // 获取类型标签
  const getTypeTag = (type: string) => {
    switch (type) {
      case 'comment':
        return <Tag color="blue">评论</Tag>;
      case 'system':
        return <Tag color="green">系统</Tag>;
      case 'deadline':
        return <Tag color="orange">截止日期</Tag>;
      case 'task':
        return <Tag color="purple">任务</Tag>;
      case 'approval':
        return <Tag color="cyan">审批</Tag>;
      default:
        return <Tag>其他</Tag>;
    }
  };

  // 通知过滤菜单
  const filterMenuItems: MenuProps['items'] = [
    {
      key: 'all',
      label: '全部通知',
      onClick: () => setActiveTab('all'),
    },
    {
      key: 'unread',
      label: '未读通知',
      onClick: () => setActiveTab('unread'),
    },
    {
      type: 'divider',
    },
    {
      key: 'comment',
      label: '评论',
      onClick: () => setActiveTab('comment'),
    },
    {
      key: 'system',
      label: '系统',
      onClick: () => setActiveTab('system'),
    },
    {
      key: 'deadline',
      label: '截止日期',
      onClick: () => setActiveTab('deadline'),
    },
    {
      key: 'task',
      label: '任务',
      onClick: () => setActiveTab('task'),
    },
    {
      key: 'approval',
      label: '审批',
      onClick: () => setActiveTab('approval'),
    },
  ];

  const tabItems = [
    {
      key: 'all',
      label: (
        <span>
          全部{getUnreadCount() > 0 && <Badge count={getUnreadCount()} style={{ marginLeft: 8 }} />}
        </span>
      ),
      children: (
        <List
          itemLayout="horizontal"
          dataSource={getFilteredNotifications()}
          renderItem={item => (
            <List.Item 
              style={{ 
                background: !item.read ? '#f0f8ff' : 'transparent',
                padding: '16px',
                borderRadius: '4px',
                marginBottom: '8px'
              }}
              actions={[
                <a key="view" onClick={() => {
                  markAsRead(item.id);
                  window.location.href = item.link;
                }}>
                  查看详情
                </a>,
                !item.read && 
                <a key="mark" onClick={() => markAsRead(item.id)}>
                  标为已读
                </a>
              ]}
            >
              <List.Item.Meta
                avatar={
                  typeof item.avatar === 'string' ? 
                    <Avatar style={{ backgroundColor: item.color }}>{item.avatar}</Avatar> : 
                    <Avatar style={{ backgroundColor: item.color }} icon={item.avatar} />
                }
                title={
                  <Space>
                    <span style={{ fontWeight: !item.read ? 'bold' : 'normal' }}>
                      {item.title}
                    </span>
                    {getTypeTag(item.type || 'other')}
                    {!item.read && <Badge status="processing" />}
                  </Space>
                }
                description={
                  <>
                    <div>{item.content}</div>
                    <div style={{ color: '#999', marginTop: 8 }}>{item.time}</div>
                  </>
                }
              />
            </List.Item>
          )}
        />
      )
    },
    {
      key: 'unread',
      label: (
        <span>
          未读{getUnreadCount() > 0 && <Badge count={getUnreadCount()} style={{ marginLeft: 8 }} />}
        </span>
      ),
      children: (
        <List
          itemLayout="horizontal"
          dataSource={allNotifications.filter(item => !item.read)}
          renderItem={item => (
            <List.Item 
              style={{ 
                background: '#f0f8ff',
                padding: '16px',
                borderRadius: '4px',
                marginBottom: '8px'
              }}
              actions={[
                <a key="view" onClick={() => {
                  markAsRead(item.id);
                  window.location.href = item.link;
                }}>
                  查看详情
                </a>,
                <a key="mark" onClick={() => markAsRead(item.id)}>
                  标为已读
                </a>
              ]}
            >
              <List.Item.Meta
                avatar={
                  typeof item.avatar === 'string' ? 
                    <Avatar style={{ backgroundColor: item.color }}>{item.avatar}</Avatar> : 
                    <Avatar style={{ backgroundColor: item.color }} icon={item.avatar} />
                }
                title={
                  <Space>
                    <span style={{ fontWeight: 'bold' }}>
                      {item.title}
                    </span>
                    {getTypeTag(item.type || 'other')}
                    <Badge status="processing" />
                  </Space>
                }
                description={
                  <>
                    <div>{item.content}</div>
                    <div style={{ color: '#999', marginTop: 8 }}>{item.time}</div>
                  </>
                }
              />
            </List.Item>
          )}
        />
      )
    },
    {
      key: 'comment',
      label: (
        <span>
          评论{getUnreadCount('comment') > 0 && <Badge count={getUnreadCount('comment')} style={{ marginLeft: 8 }} />}
        </span>
      ),
      children: (
        <List
          itemLayout="horizontal"
          dataSource={allNotifications.filter(item => item.type === 'comment')}
          renderItem={item => (
            <List.Item 
              style={{ 
                background: !item.read ? '#f0f8ff' : 'transparent',
                padding: '16px',
                borderRadius: '4px',
                marginBottom: '8px'
              }}
              actions={[
                <a key="view" onClick={() => {
                  markAsRead(item.id);
                  window.location.href = item.link;
                }}>
                  查看详情
                </a>,
                !item.read && 
                <a key="mark" onClick={() => markAsRead(item.id)}>
                  标为已读
                </a>
              ]}
            >
              <List.Item.Meta
                avatar={
                  typeof item.avatar === 'string' ? 
                    <Avatar style={{ backgroundColor: item.color }}>{item.avatar}</Avatar> : 
                    <Avatar style={{ backgroundColor: item.color }} icon={item.avatar} />
                }
                title={
                  <Space>
                    <span style={{ fontWeight: !item.read ? 'bold' : 'normal' }}>
                      {item.title}
                    </span>
                    {getTypeTag(item.type || 'other')}
                    {!item.read && <Badge status="processing" />}
                  </Space>
                }
                description={
                  <>
                    <div>{item.content}</div>
                    <div style={{ color: '#999', marginTop: 8 }}>{item.time}</div>
                  </>
                }
              />
            </List.Item>
          )}
        />
      )
    },
    {
      key: 'system',
      label: (
        <span>
          系统{getUnreadCount('system') > 0 && <Badge count={getUnreadCount('system')} style={{ marginLeft: 8 }} />}
        </span>
      ),
      children: (
        <List
          itemLayout="horizontal"
          dataSource={allNotifications.filter(item => item.type === 'system')}
          renderItem={item => (
            <List.Item 
              style={{ 
                background: !item.read ? '#f0f8ff' : 'transparent',
                padding: '16px',
                borderRadius: '4px',
                marginBottom: '8px'
              }}
              actions={[
                <a key="view" onClick={() => {
                  markAsRead(item.id);
                  window.location.href = item.link;
                }}>
                  查看详情
                </a>,
                !item.read && 
                <a key="mark" onClick={() => markAsRead(item.id)}>
                  标为已读
                </a>
              ]}
            >
              <List.Item.Meta
                avatar={
                  typeof item.avatar === 'string' ? 
                    <Avatar style={{ backgroundColor: item.color }}>{item.avatar}</Avatar> : 
                    <Avatar style={{ backgroundColor: item.color }} icon={item.avatar} />
                }
                title={
                  <Space>
                    <span style={{ fontWeight: !item.read ? 'bold' : 'normal' }}>
                      {item.title}
                    </span>
                    {getTypeTag(item.type || 'other')}
                    {!item.read && <Badge status="processing" />}
                  </Space>
                }
                description={
                  <>
                    <div>{item.content}</div>
                    <div style={{ color: '#999', marginTop: 8 }}>{item.time}</div>
                  </>
                }
              />
            </List.Item>
          )}
        />
      )
    },
    {
      key: 'deadline',
      label: (
        <span>
          截止日期{getUnreadCount('deadline') > 0 && <Badge count={getUnreadCount('deadline')} style={{ marginLeft: 8 }} />}
        </span>
      ),
      children: (
        <List
          itemLayout="horizontal"
          dataSource={allNotifications.filter(item => item.type === 'deadline')}
          renderItem={item => (
            <List.Item 
              style={{ 
                background: !item.read ? '#f0f8ff' : 'transparent',
                padding: '16px',
                borderRadius: '4px',
                marginBottom: '8px'
              }}
              actions={[
                <a key="view" onClick={() => {
                  markAsRead(item.id);
                  window.location.href = item.link;
                }}>
                  查看详情
                </a>,
                !item.read && 
                <a key="mark" onClick={() => markAsRead(item.id)}>
                  标为已读
                </a>
              ]}
            >
              <List.Item.Meta
                avatar={
                  typeof item.avatar === 'string' ? 
                    <Avatar style={{ backgroundColor: item.color }}>{item.avatar}</Avatar> : 
                    <Avatar style={{ backgroundColor: item.color }} icon={item.avatar} />
                }
                title={
                  <Space>
                    <span style={{ fontWeight: !item.read ? 'bold' : 'normal' }}>
                      {item.title}
                    </span>
                    {getTypeTag(item.type || 'other')}
                    {!item.read && <Badge status="processing" />}
                  </Space>
                }
                description={
                  <>
                    <div>{item.content}</div>
                    <div style={{ color: '#999', marginTop: 8 }}>{item.time}</div>
                  </>
                }
              />
            </List.Item>
          )}
        />
      )
    }
  ];

  // 创建页面内容
  const pageContent = (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={2}>通知中心</Title>
        <Space>
          <Dropdown menu={{ items: filterMenuItems }} placement="bottomRight">
            <Button icon={<FilterOutlined />}>
              筛选 {activeTab !== 'all' && '(已筛选)'}
            </Button>
          </Dropdown>
          <Button type="primary" onClick={markAllAsRead}>
            标记全部为已读
          </Button>
        </Space>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={tabItems.map(item => ({
          ...item,
          label: (
            <span>
              {item.key === 'all' ? '全部' :
               item.key === 'unread' ? '未读' :
               item.key === 'comment' ? '评论' :
               item.key === 'system' ? '系统' :
               item.key === 'deadline' ? '截止日期' :
               item.key === 'task' ? '任务' :
               item.key === 'approval' ? '审批' : ''}
              {getUnreadCount(item.key) > 0 && <Badge count={getUnreadCount(item.key)} style={{ marginLeft: 8 }} />}
            </span>
          )
        }))}
      />
    </div>
  );

  // 返回页面内容
  return pageContent;
};

// 添加getLayout函数，用来控制页面布局
NotificationsPage.getLayout = (page) => {
  return <AppLayout>{page}</AppLayout>;
};

export default NotificationsPage; 