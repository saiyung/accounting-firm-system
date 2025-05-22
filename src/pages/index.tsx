import React, { useState, useEffect } from 'react';
import { Button, Card, Col, Row, Statistic, Typography, Space, List, Badge, Avatar, Divider, Tag, Progress, Timeline, Tabs, message, Spin } from 'antd';
import { 
  AppstoreOutlined, 
  FileTextOutlined, 
  TeamOutlined, 
  DashboardOutlined,
  RightOutlined,
  NotificationOutlined,
  BellOutlined,
  InfoCircleOutlined,
  MoreOutlined,
  UserOutlined,
  FileOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
  BarChartOutlined,
  CalendarOutlined,
  PlusOutlined,
  FormOutlined,
  PaperClipOutlined,
  AppstoreAddOutlined,
  CommentOutlined,
  MessageOutlined,
  CheckOutlined,
  LinkOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { NextPage } from 'next';
import AppLayout from '@/components/Layout';
import type { ReactNode } from 'react';
import { useCompanyNotices, typeMap } from '@/context/CompanyNoticeContext';
import { fetchUpcomingTasks, completeTask, fetchTeamActivities, fetchProjectProgress } from '@/services/api';
import axios from '@/lib/axios';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

// 定义带有getLayout的NextPage类型
type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactNode) => ReactNode
}

const Home: NextPageWithLayout = () => {
  // 使用公司通知上下文
  const { notices: companyNotices, markAsRead } = useCompanyNotices();

  // 状态管理
  const [todos, setTodos] = useState<any[]>([]);
  const [teamActivities, setTeamActivities] = useState<any[]>([]);
  const [projectProgress, setProjectProgress] = useState<any[]>([]);
  const [statistics, setStatistics] = useState([
    { title: '进行中项目', value: 0, color: '#1890ff' },
    { title: '本月完成项目', value: 0, color: '#52c41a' },
    { title: '逾期风险项目', value: 0, color: '#fa8c16' },
    { title: '本月新签约项目', value: 0, color: '#722ed1' }
  ]);
  const [loading, setLoading] = useState({
    todos: false,
    activities: false,
    projects: false,
    statistics: false
  });

  // 获取统计数据
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(prev => ({ ...prev, statistics: true }));
        const response = await axios.get('/api/dashboard/stats');
        
        if (response.data.success) {
          setStatistics([
            { title: '进行中项目', value: response.data.data.inProgressProjects, color: '#1890ff' },
            { title: '本月完成项目', value: response.data.data.completedProjectsThisMonth, color: '#52c41a' },
            { title: '逾期风险项目', value: response.data.data.riskProjects, color: '#fa8c16' },
            { title: '本月新签约项目', value: response.data.data.newProjectsThisMonth, color: '#722ed1' }
          ]);
        }
      } catch (error) {
        console.error('加载统计数据失败:', error);
        // 静默失败，不显示错误提示
        // 尝试从本地存储加载上次成功获取的数据
        const cachedStats = localStorage.getItem('dashboardStats');
        if (cachedStats) {
          try {
            const parsedStats = JSON.parse(cachedStats);
            setStatistics(parsedStats);
          } catch (e) {
            console.error('解析缓存统计数据失败:', e);
          }
        }
      } finally {
        setLoading(prev => ({ ...prev, statistics: false }));
      }
    };
    
    fetchStatistics();
  }, []);

  // 获取待办任务
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(prev => ({ ...prev, todos: true }));
        const response = await fetchUpcomingTasks();
        
        if (response.data.success) {
          // 转换数据格式以匹配UI所需的结构
          const formattedTasks = response.data.data.map((task: any) => ({
            id: task._id,
            title: task.title,
            project: task.project ? task.project.name : '个人任务',
            deadline: formatDeadline(task.deadline),
            priority: task.priority,
            completed: task.status === 'completed'
          }));
          
          setTodos(formattedTasks);
          // 缓存成功获取的数据
          localStorage.setItem('todoTasks', JSON.stringify(formattedTasks));
        }
      } catch (error) {
        console.error('加载待办任务失败:', error);
        // 静默失败，不显示错误提示
        // 尝试从本地存储加载上次成功获取的数据
        const cachedTasks = localStorage.getItem('todoTasks');
        if (cachedTasks) {
          try {
            const parsedTasks = JSON.parse(cachedTasks);
            setTodos(parsedTasks);
          } catch (e) {
            console.error('解析缓存任务数据失败:', e);
          }
        }
      } finally {
        setLoading(prev => ({ ...prev, todos: false }));
      }
    };
    
    loadTasks();
  }, []);

  // 获取团队动态
  useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoading(prev => ({ ...prev, activities: true }));
        const response = await fetchTeamActivities(5);
        
        if (response.data.success) {
          // 转换数据格式以匹配UI所需的结构
          const formattedActivities = response.data.data.map((activity: any) => ({
            id: activity._id,
            user: activity.user.name,
            avatar: activity.user.avatar || `/avatars/default.png`,
            action: activity.action + activity.entityType,
            project: activity.targetName,
            time: formatTime(activity.timestamp)
          }));
          
          setTeamActivities(formattedActivities);
          // 缓存成功获取的数据
          localStorage.setItem('teamActivities', JSON.stringify(formattedActivities));
        }
      } catch (error) {
        console.error('加载团队动态失败:', error);
        // 静默失败，不显示错误提示
        // 尝试从本地存储加载上次成功获取的数据
        const cachedActivities = localStorage.getItem('teamActivities');
        if (cachedActivities) {
          try {
            const parsedActivities = JSON.parse(cachedActivities);
            setTeamActivities(parsedActivities);
          } catch (e) {
            console.error('解析缓存活动数据失败:', e);
          }
        }
      } finally {
        setLoading(prev => ({ ...prev, activities: false }));
      }
    };
    
    loadActivities();
  }, []);

  // 获取项目进度
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(prev => ({ ...prev, projects: true }));
        const response = await fetchProjectProgress();
        
        if (response.data.success) {
          // 转换数据格式以匹配UI所需的结构
          const formattedProjects = response.data.data.map((project: any) => {
            // 计算项目完成百分比
            const now = new Date();
            const startDate = new Date(project.dates.startDate);
            const endDate = new Date(project.dates.endDate);
            const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const passedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const progressPercent = Math.min(Math.round((passedDays / totalDays) * 100), 100);
            const daysLeft = Math.max(Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 0);
            
            // 确定项目状态
            let status = 'normal';
            if (daysLeft <= 3) {
              status = 'exception'; // 接近截止日期
            } else if (project.progress && project.progress > 80) {
              status = 'active'; // 接近完成
            }
            
            return {
              id: project._id,
              name: project.name,
              progress: progressPercent,
              status,
              deadline: project.dates.endDate.split('T')[0],
              daysLeft
            };
          });
          
          setProjectProgress(formattedProjects);
          // 缓存成功获取的数据
          localStorage.setItem('projectProgress', JSON.stringify(formattedProjects));
        }
      } catch (error) {
        console.error('加载项目进度失败:', error);
        // 静默失败，不显示错误提示
        // 尝试从本地存储加载上次成功获取的数据
        const cachedProjects = localStorage.getItem('projectProgress');
        if (cachedProjects) {
          try {
            const parsedProjects = JSON.parse(cachedProjects);
            setProjectProgress(parsedProjects);
          } catch (e) {
            console.error('解析缓存项目数据失败:', e);
          }
        }
      } finally {
        setLoading(prev => ({ ...prev, projects: false }));
      }
    };
    
    loadProjects();
  }, []);

  // 处理完成任务
  const handleCompleteTask = async (id: number | string) => {
    try {
      const response = await completeTask(id.toString());
      
      if (response.data.success) {
        message.success('任务已完成');
        // 更新任务列表
        setTodos(prevTodos => 
          prevTodos.map(todo => 
            todo.id === id ? { ...todo, completed: true } : todo
          )
        );
      }
    } catch (error) {
      console.error('完成任务失败:', error);
      message.error('无法完成任务');
    }
  };

  // 辅助函数：格式化截止日期显示
  const formatDeadline = (dateString: string) => {
    if (!dateString) return '无截止日期';
    
    const deadline = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    // 移除时间部分，只比较日期
    const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    
    if (deadlineDate.getTime() === todayDate.getTime()) {
      return '今天';
    } else if (deadlineDate.getTime() === tomorrowDate.getTime()) {
      return '明天';
    } else {
      // 3天以内显示"后天"
      const dayDiff = Math.ceil((deadlineDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
      if (dayDiff === 2) {
        return '后天';
      } else if (dayDiff < 7) {
        // 一周内显示"本周x"
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        return `本周${weekdays[deadlineDate.getDay()]}`;
      } else {
        // 其他情况显示具体日期
        return deadline.toLocaleDateString('zh-CN');
      }
    }
  };

  // 辅助函数：格式化时间显示
  const formatTime = (timeString: string) => {
    const time = new Date(timeString);
    const now = new Date();
    
    const diff = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diff < 60) {
      return '刚刚';
    } else if (diff < 3600) {
      return `${Math.floor(diff / 60)}分钟前`;
    } else if (diff < 86400) {
      return `${Math.floor(diff / 3600)}小时前`;
    } else if (diff < 172800) {
      return '昨天';
    } else if (diff < 259200) {
      return '前天';
    } else {
      return time.toLocaleDateString('zh-CN');
    }
  };

  // 快捷入口数据
  const quickLinks = [
    { title: '新建项目', icon: <PlusOutlined />, link: '/project/new', color: '#1890ff' },
    { title: '新建报告', icon: <FormOutlined />, link: '/report/new', color: '#52c41a' },
    { title: '上传文档', icon: <PaperClipOutlined />, link: '/documents/upload', color: '#fa8c16' },
    { title: '添加客户', icon: <UserOutlined />, link: '/data?tab=1', color: '#eb2f96' },
    { title: '我的日程', icon: <CalendarOutlined />, link: '/calendar', color: '#722ed1' },
    { title: '更多功能', icon: <AppstoreAddOutlined />, link: '/tools', color: '#13c2c2' }
  ];

  const modules = [
    {
      title: '项目管理',
      icon: <AppstoreOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      description: '流程自动化、资源分配、风险预警',
      link: '/project',
      color: '#e6f7ff'
    },
    {
      title: '智能报告',
      icon: <FileTextOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
      description: 'AI辅助撰写、版本管理、合规校验',
      link: '/report',
      color: '#f6ffed'
    },
    {
      title: '数据管理',
      icon: <TeamOutlined style={{ fontSize: 48, color: '#fa8c16' }} />,
      description: '客户数据池、权限分级管理',
      link: '/data',
      color: '#fff7e6'
    },
    {
      title: '决策支持',
      icon: <DashboardOutlined style={{ fontSize: 48, color: '#722ed1' }} />,
      description: '实时仪表盘、风险热力图',
      link: '/dashboard',
      color: '#f9f0ff'
    }
  ];

  // 处理公司通知点击
  const handleNoticeClick = (id: number) => {
    markAsRead(id);
  };
  
  // 获取通知标签
  const getNoticeTag = (type: string) => {
    switch (type) {
      case 'important':
        return <Tag color="red">重要</Tag>;
      case 'update':
        return <Tag color="blue">更新</Tag>;
      case 'notice':
        return <Tag color="green">通知</Tag>;
      case 'event':
        return <Tag color="purple">活动</Tag>;
      default:
        return <Tag>其他</Tag>;
    }
  };

  // 获取待办优先级标签
  const getPriorityTag = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Tag color="red">紧急</Tag>;
      case 'medium':
        return <Tag color="orange">中等</Tag>;
      case 'low':
        return <Tag color="blue">普通</Tag>;
      default:
        return <Tag>其他</Tag>;
    }
  };

  // 获取项目状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'blue';
      case 'active':
        return 'green';
      case 'exception':
        return 'red';
      default:
        return 'blue';
    }
  };

  // 待办任务模块渲染
  const renderTodoList = () => {
    if (loading.todos) {
      return <div style={{ textAlign: 'center', padding: '20px' }}><Spin /></div>;
    }
    
    if (todos.length === 0) {
      return <div style={{ textAlign: 'center', padding: '20px' }}>暂无待办任务</div>;
    }
    
    return (
      <List
        itemLayout="horizontal"
        dataSource={todos}
        renderItem={item => (
          <List.Item
            actions={[
              <Button 
                key="complete" 
                type="text" 
                icon={<CheckCircleOutlined />} 
                title="标记为已完成"
                onClick={() => handleCompleteTask(item.id)}
                disabled={item.completed}
              />
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  <Text strong style={{ textDecoration: item.completed ? 'line-through' : 'none' }}>
                    {item.title}
                  </Text>
                  {getPriorityTag(item.priority)}
                </Space>
              }
              description={
                <>
                  <div>项目：{item.project}</div>
                  <div>
                    <ClockCircleOutlined /> 截止时间：{item.deadline}
                  </div>
                </>
              }
            />
          </List.Item>
        )}
      />
    );
  };
  
  // 团队动态模块渲染
  const renderTeamActivities = () => {
    if (loading.activities) {
      return <div style={{ textAlign: 'center', padding: '20px' }}><Spin /></div>;
    }
    
    if (teamActivities.length === 0) {
      return <div style={{ textAlign: 'center', padding: '20px' }}>暂无团队动态</div>;
    }

  return (
      <Timeline>
        {teamActivities.map(activity => (
          <Timeline.Item key={activity.id}>
            <div style={{ marginBottom: 8 }}>
              <Space>
                <Avatar src={activity.avatar} size="small">
                  {activity.user[0]}
                </Avatar>
                <Text strong>{activity.user}</Text>
                <Text type="secondary">{activity.action}</Text>
              </Space>
            </div>
            <div style={{ marginLeft: 24 }}>
              <Text type="secondary">项目：{activity.project}</Text>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>{activity.time}</Text>
              </div>
      </div>
          </Timeline.Item>
        ))}
      </Timeline>
    );
  };
  
  // 项目进度模块渲染
  const renderProjectProgress = () => {
    if (loading.projects) {
      return <div style={{ textAlign: 'center', padding: '20px' }}><Spin /></div>;
    }
    
    if (projectProgress.length === 0) {
      return <div style={{ textAlign: 'center', padding: '20px' }}>暂无进行中项目</div>;
    }
    
    return (
      <List
        itemLayout="horizontal"
        dataSource={projectProgress}
        renderItem={item => (
          <List.Item>
            <List.Item.Meta
              title={
                <Space>
                  <Text strong>{item.name}</Text>
                  <Badge 
                    status={item.status as any} 
                    text={item.status === 'exception' ? '有风险' : (item.status === 'active' ? '进行中' : '正常')} 
                  />
                </Space>
              }
              description={
                <>
                  <Progress 
                    percent={item.progress} 
                    status={item.status as any} 
                    style={{ marginBottom: 4, marginTop: 4 }}
                  />
                  <Row>
                    <Col span={12}>
                      <Text type="secondary">
                        <ClockCircleOutlined /> 剩余{item.daysLeft}天
                      </Text>
                    </Col>
                    <Col span={12} style={{ textAlign: 'right' }}>
                      <Text type="secondary">
                        截止日期：{item.deadline}
                      </Text>
                    </Col>
                  </Row>
                </>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  return (
    <div style={{ paddingBottom: 0 }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Row gutter={[24, 24]}>
        {statistics.map((stat, index) => (
              <Col xs={12} sm={12} md={6} key={index}>
                <Card hoverable>
              <Statistic
                title={stat.title}
                value={stat.value}
                    valueStyle={{ color: stat.color, fontSize: 28 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

          <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {modules.map((module, index) => (
              <Col xs={24} sm={12} key={index}>
              <Card 
                hoverable 
                  style={{ 
                    height: '100%', 
                    background: module.color, 
                    borderRadius: 8,
                    border: 'none'
                  }}
                  bodyStyle={{ padding: '24px 20px' }}
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ marginRight: 16 }}>
                  {module.icon}
                      </div>
                      <div>
                        <Title level={3} style={{ margin: 0 }}>{module.title}</Title>
                        <Paragraph style={{ 
                          margin: '4px 0 0 0',
                          opacity: 0.75
                        }}>
                          {module.description}
                        </Paragraph>
                      </div>
                </div>
                    <Link href={module.link}>
                      <Button 
                        type="primary" 
                        style={{ 
                          width: '100%',
                          height: 40,
                          borderRadius: 4
                        }}
                      >
                        进入模块 <RightOutlined />
                      </Button>
                    </Link>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          {/* 快捷入口模块 */}
          <Card 
            title={<Space><LinkOutlined /> 快捷入口</Space>}
            style={{ marginTop: 24 }}
          >
            <Row gutter={[16, 16]}>
              {quickLinks.map((link, index) => (
                <Col xs={12} sm={8} md={4} key={index}>
                  <Link href={link.link}>
                    <Card 
                      hoverable 
                      bodyStyle={{ padding: '16px 8px' }}
                      style={{ textAlign: 'center' }}
                    >
                      <Space direction="vertical" size="small">
                        <Avatar 
                          size={40} 
                          icon={link.icon} 
                          style={{ backgroundColor: link.color }}
                        />
                        <div>{link.title}</div>
                      </Space>
              </Card>
            </Link>
          </Col>
        ))}
            </Row>
          </Card>
          
          {/* 项目进度概览 */}
          <Card 
            title={<Space><ProjectOutlined /> 项目进度概览</Space>}
            extra={<Link href="/project">查看全部</Link>}
            style={{ marginTop: 24 }}
          >
            {renderProjectProgress()}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <span>公司通知</span>
                <Badge count={companyNotices.filter(n => !n.read).length} />
              </Space>
            }
            extra={
              <Space>
                <Link href="/system/company-notices">管理</Link>
                <Link href="/notifications">查看全部</Link>
              </Space>
            }
            style={{ marginBottom: 24 }}
            bodyStyle={{ padding: '0 16px', maxHeight: '300px', overflowY: 'auto' }}
          >
            <List
              itemLayout="horizontal"
              dataSource={companyNotices}
              renderItem={item => (
                <List.Item
                  style={{ 
                    padding: '16px 8px',
                    background: !item.read ? '#f0f8ff' : 'transparent',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleNoticeClick(item.id)}
                  actions={[
                    <Button key="more" type="link" icon={<MoreOutlined />} onClick={(e) => {
                      e.stopPropagation(); // 阻止事件冒泡
                      window.location.href = `/system/company-notices?id=${item.id}`;
                    }}>更多</Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={<BellOutlined />}
                        style={{ 
                          backgroundColor: typeMap[item.type].color
                        }}
                      />
                    }
                    title={
                      <Space>
                        <Text strong={!item.read}>{item.title}</Text>
                        {getNoticeTag(item.type)}
                        {!item.read && <Badge status="processing" />}
                      </Space>
                    }
                    description={
                      <>
                        <div style={{ marginBottom: 4 }}>{item.content}</div>
                        <div style={{ fontSize: 12, color: '#999' }}>{item.date}</div>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* 待办任务模块 */}
          <Card 
            title={<Space><CheckOutlined /> 待办任务</Space>}
            extra={<Link href="/tasks">查看全部</Link>}
            style={{ marginBottom: 24 }}
          >
            {renderTodoList()}
          </Card>

          {/* 团队动态模块 */}
          <Card 
            title={<Space><TeamOutlined /> 团队动态</Space>}
            extra={<Link href="/activities">查看全部</Link>}
          >
            {renderTeamActivities()}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

Home.getLayout = (page: ReactNode) => {
  return (
    <AppLayout>
      {page}
    </AppLayout>
  );
};

export default Home; 