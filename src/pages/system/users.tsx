import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  Space, 
  Table, 
  Tag, 
  Typography, 
  Input, 
  Select,
  Tabs,
  Modal,
  Form,
  Radio,
  Switch,
  Divider,
  Badge,
  Tooltip,
  Row, 
  Col,
  DatePicker,
  Transfer,
  List,
  Avatar,
  Alert,
  message,
  Popconfirm,
  Descriptions
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  UserOutlined, 
  TeamOutlined,
  LockOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  SafetyOutlined,
  SettingOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { NextPage } from 'next';
import type { TransferDirection } from 'antd/es/transfer';
import AppLayout from '@/components/Layout';
import { useAuth, ProtectedRoute } from '@/context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const UserManagement: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const [isUserModalVisible, setIsUserModalVisible] = useState(false);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [isTempPermissionModalVisible, setIsTempPermissionModalVisible] = useState(false);
  const [isVerifyModalVisible, setIsVerifyModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [currentTab, setCurrentTab] = useState('1');
  const [currentRole, setCurrentRole] = useState<string>('employee');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [targetKeys, setTargetKeys] = useState<any>([]);
  const [verifyAction, setVerifyAction] = useState<{type: string; record: any} | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [editForm] = Form.useForm();
  
  // 模拟用户数据
  const [users, setUsers] = useState<any[]>([]);
  
  // 在组件加载时初始化用户数据
  useEffect(() => {
    console.log("当前登录用户:", user);
    
    // 基础用户数据
    const baseUserData = [
      {
        id: 'U001',
        name: '张明',
        username: 'zhangming@firm.com',
        department: '审计部',
        role: '项目经理',
        type: 'employee',
        status: '正常',
        lastLogin: '2025-03-30 09:45:12',
        createdTime: '2024-05-15',
        mfa: true,
        projects: 3
      },
      {
        id: 'U002',
        name: '李刚',
        username: 'ligang@firm.com',
        department: '税务部',
        role: '项目经理',
        type: 'employee',
        status: '正常',
        lastLogin: '2025-03-29 15:32:08',
        createdTime: '2024-06-12',
        mfa: true,
        projects: 2
      },
      {
        id: 'U003',
        name: '王琳',
        username: 'wanglin@firm.com',
        department: '审计部',
        role: '合伙人',
        type: 'employee',
        status: '正常',
        lastLogin: '2025-03-30 11:20:45',
        createdTime: '2024-04-20',
        mfa: true,
        projects: 5
      },
      {
        id: 'A001',
        name: '系统管理员',
        username: 'admin@firm.com',
        department: 'IT部门',
        role: '超级管理员',
        type: 'admin',
        status: '正常',
        lastLogin: '2025-03-30 08:15:30',
        createdTime: '2024-01-01',
        mfa: true,
        projects: null
      }
    ];
    
    // 如果当前登录用户存在，添加到用户列表
    if (user) {
      const emailLower = user.email.toLowerCase();
      const userRole = user.role === 'admin' ? '超级管理员' : user.role === 'manager' ? '部门经理' : '普通员工';
      
      // 检查是否已有此用户
      const existingUserIndex = baseUserData.findIndex(u => 
        u.username.toLowerCase() === emailLower || 
        (u.name === user.name && u.name !== '系统管理员')
      );
      
      // 当前用户对象
      const currentUserForDisplay = {
        id: user.id || `U${Math.floor(Math.random() * 1000)}`,
        name: user.name,
        username: user.email,
        department: user.department,
        role: userRole,
        type: user.role,
        status: '正常',
        lastLogin: new Date().toLocaleString(),
        createdTime: new Date().toLocaleDateString(),
        mfa: true,
        projects: Math.floor(Math.random() * 5),
        isCurrentUser: true // 添加标记，表示这是当前登录用户
      };
      
      // 如果已经存在，更新用户信息
      if (existingUserIndex >= 0) {
        const updatedBaseUserData = [...baseUserData];
        updatedBaseUserData[existingUserIndex] = {
          ...updatedBaseUserData[existingUserIndex],
          ...currentUserForDisplay
        };
        setUsers(updatedBaseUserData);
        console.log("更新了现有用户信息:", currentUserForDisplay);
      } else {
        // 否则添加新用户（放在列表最前面）
        setUsers([currentUserForDisplay, ...baseUserData]);
        console.log("添加了当前用户到列表:", currentUserForDisplay);
      }
    } else {
      setUsers(baseUserData);
      console.log("未检测到登录用户，使用基础用户数据");
    }
  }, [user]);
  
  // 模拟部门数据
  const departmentData = [
    {
      id: 'D001',
      name: '审计部',
      manager: '王琳',
      members: 15,
      createdTime: '2024-01-10'
    },
    {
      id: 'D002',
      name: '税务部',
      manager: '刘芳',
      members: 10,
      createdTime: '2024-01-10'
    },
    {
      id: 'D003',
      name: '咨询部',
      manager: '张华',
      members: 8,
      createdTime: '2024-01-15'
    },
    {
      id: 'D004',
      name: '行政部',
      manager: '周明',
      members: 5,
      createdTime: '2024-01-10'
    },
    {
      id: 'D005',
      name: 'IT部门',
      manager: '郑强',
      members: 3,
      createdTime: '2024-01-05'
    }
  ];
  
  // 模拟操作日志数据
  const logData = [
    {
      id: 'L001',
      user: '系统管理员',
      action: '创建用户',
      target: '陈晓明',
      time: '2025-03-30 14:05:22',
      ip: '192.168.1.25',
      details: '创建了用户"陈晓明"，分配审计部，角色为会计师'
    },
    {
      id: 'L002',
      user: '系统管理员',
      action: '权限变更',
      target: '赵伟',
      time: '2025-03-29 10:15:42',
      ip: '192.168.1.25', 
      details: '将用户"赵伟"的角色从"助理"变更为"会计师"'
    },
    {
      id: 'L003',
      user: '审计部管理员',
      action: '账户禁用',
      target: '林小华',
      time: '2025-03-28 16:30:18',
      ip: '192.168.1.30',
      details: '禁用了用户"林小华"的账户，原因：员工离职'
    },
    {
      id: 'L004',
      user: '系统管理员',
      action: '部门调整',
      target: '王明',
      time: '2025-03-27 09:20:35',
      ip: '192.168.1.25',
      details: '将用户"王明"从"税务部"调整到"咨询部"'
    },
    {
      id: 'L005',
      user: '系统',
      action: '账户休眠',
      target: '赵伟',
      time: '2025-03-25 00:00:00',
      ip: '系统',
      details: '账户"赵伟"因30天未登录自动设置为休眠状态'
    }
  ];

  // 模拟项目数据
  const projectsData = [
    {
      id: 'P001',
      name: '杭州智联科技年度审计',
      key: 'P001'
    },
    {
      id: 'P002',
      name: '上海贸易集团税务咨询',
      key: 'P002'
    },
    {
      id: 'P003',
      name: '北京健康医疗上市审计',
      key: 'P003'
    },
    {
      id: 'P004',
      name: '广州餐饮集团内控评估',
      key: 'P004'
    }
  ];

  // 显示创建用户模态框
  const showUserModal = () => {
    setIsUserModalVisible(true);
  };

  // 处理用户模态框确认
  const handleUserOk = () => {
    setIsUserModalVisible(false);
  };

  // 处理用户模态框取消
  const handleUserCancel = () => {
    setIsUserModalVisible(false);
  };
  
  // 显示临时权限模态框
  const showTempPermissionModal = (record: any) => {
    setSelectedUser(record);
    setIsTempPermissionModalVisible(true);
  };
  
  // 处理临时权限模态框确认
  const handleTempPermissionOk = () => {
    setIsTempPermissionModalVisible(false);
    message.success(`已成功为 ${selectedUser.name} 分配临时权限`);
  };
  
  // 处理临时权限模态框取消
  const handleTempPermissionCancel = () => {
    setIsTempPermissionModalVisible(false);
  };
  
  // 处理Transfer变更
  const handleChange = (newTargetKeys: any) => {
    setTargetKeys(newTargetKeys);
  };
  
  // 设置用户角色类型
  const handleRoleTypeChange = (e: any) => {
    setCurrentRole(e.target.value);
  };

  // 处理敏感操作
  const handleSensitiveAction = (type: string, record: any) => {
    // 当用户是管理员且操作是删除时，直接执行删除操作，不要求验证码
    if (user && user.role === 'admin' && type === 'delete') {
      handleDeleteUser(record);
      return;
    }
    
    // 对于其他敏感操作或非管理员用户，设置验证操作
    setVerifyAction({ type, record });
    setIsVerifyModalVisible(true);
    
    // 模拟发送验证码
    message.success('验证码已发送到您的邮箱和手机');
  };
  
  // 处理删除用户操作
  const handleDeleteUser = (record: any) => {
    // 创建操作日志
    const newLog = {
      id: `L${Math.floor(Math.random() * 10000)}`,
      user: user?.name || '系统管理员',
      action: '删除用户',
      target: record.name,
      time: new Date().toLocaleString(),
      ip: '192.168.1.25',
      details: `删除了用户"${record.name}"（${record.id}）`
    };
    
    // 从用户列表中移除
    const updatedUsers = users.filter(user => user.id !== record.id);
    setUsers(updatedUsers);
    
    // 显示成功消息
    message.success(`用户 ${record.name} 已删除`);
  };

  // 安全验证确认
  const handleVerifyOk = () => {
    if (!verifyAction) return;
    
    if (verifyCode.length !== 6) {
      message.error('请输入6位验证码');
      return;
    }
    
    // 模拟验证码验证通过 - 在演示环境中任意6位数字都视为验证通过
    const { type, record } = verifyAction;
    
    if (type === 'delete') {
      handleDeleteUser(record);
    } else if (type === 'disable') {
      // 处理禁用用户
      const updatedUsers = users.map(user => {
        if (user.id === record.id) {
          return { ...user, status: '禁用' };
        }
        return user;
      });
      setUsers(updatedUsers);
      message.success(`用户 ${record.name} 已禁用`);
    } else if (type === 'enable') {
      // 处理启用用户
      const updatedUsers = users.map(user => {
        if (user.id === record.id) {
          return { ...user, status: '正常' };
        }
        return user;
      });
      setUsers(updatedUsers);
      message.success(`用户 ${record.name} 已启用`);
    } else if (type === 'reset_password') {
      // 处理重置密码
      message.success(`用户 ${record.name} 的密码已重置，新密码已发送到用户邮箱`);
    } else if (type === 'refresh_2fa') {
      // 处理刷新二维码
      message.success(`用户 ${record.name} 的二因素认证已重置，新的二维码已生成`);
    }
    
    // 关闭验证模态框
    setIsVerifyModalVisible(false);
    setVerifyCode('');
    setVerifyAction(null);
  };
  
  // 处理验证取消
  const handleVerifyCancel = () => {
    setIsVerifyModalVisible(false);
    setVerifyCode('');
  };

  // 显示编辑用户模态框
  const showEditModal = (record: any) => {
    // 处理当前登录用户的特殊情况，确保显示最新信息
    if (user && record.username.toLowerCase() === user.email.toLowerCase()) {
      const userRole = user.role === 'admin' ? '超级管理员' : user.role === 'manager' ? '部门经理' : '普通员工';
      const enhancedRecord = {
        ...record,
        name: user.name,
        department: user.department,
        role: userRole,
        isCurrentUser: true
      };
      setSelectedUser(enhancedRecord);
      editForm.setFieldsValue(enhancedRecord);
      console.log("编辑当前登录用户:", enhancedRecord);
    } else {
      setSelectedUser(record);
      editForm.setFieldsValue(record);
      console.log("编辑其他用户:", record);
    }
    setIsEditModalVisible(true);
  };

  // 处理编辑用户模态框确认
  const handleEditOk = () => {
    editForm.validateFields().then(values => {
      // 更新用户列表中的用户信息
      const updatedUsers = users.map(user => {
        if (user.id === selectedUser.id) {
          const updatedUser = { ...user, ...values };
          console.log("用户信息已更新:", updatedUser);
          return updatedUser;
        }
        return user;
      });
      
      // 如果编辑的是当前登录用户，同步更新本地存储
      if (selectedUser.isCurrentUser && window.localStorage) {
        try {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          // 更新存储的用户信息
          const updatedStoredUser = {
            ...storedUser,
            name: values.name,
            department: values.department,
            // 注意：这里不更新role，因为登录用户角色变更需要特殊处理
          };
          localStorage.setItem('user', JSON.stringify(updatedStoredUser));
          console.log("已同步更新本地存储的用户信息:", updatedStoredUser);
        } catch (error) {
          console.error("更新本地存储用户信息失败:", error);
        }
      }
      
      setUsers(updatedUsers);
      message.success('用户信息已更新');
      setIsEditModalVisible(false);
      editForm.resetFields();
    }).catch(info => {
      console.log('表单验证失败:', info);
    });
  };

  // 处理编辑用户模态框取消
  const handleEditCancel = () => {
    setIsEditModalVisible(false);
    editForm.resetFields();
  };

  // 显示用户详情模态框
  const showDetailModal = (record: any) => {
    // 处理当前登录用户的特殊情况，确保显示最新信息
    if (user && record.username.toLowerCase() === user.email.toLowerCase()) {
      const userRole = user.role === 'admin' ? '超级管理员' : user.role === 'manager' ? '部门经理' : '普通员工';
      const enhancedRecord = {
        ...record,
        name: user.name,
        department: user.department,
        role: userRole,
        isCurrentUser: true
      };
      setSelectedUser(enhancedRecord);
      console.log("查看当前登录用户详情:", enhancedRecord);
    } else {
      setSelectedUser(record);
      console.log("查看其他用户详情:", record);
    }
    setIsDetailModalVisible(true);
  };

  // 处理用户详情模态框取消
  const handleDetailCancel = () => {
    setIsDetailModalVisible(false);
  };

  // 处理用户详情模态框确定
  const handleDetailOk = () => {
    setIsDetailModalVisible(false);
  };

  // 重置用户密码
  const handleResetPassword = (record: any) => {
    // 对于管理员，直接执行；对于其他用户，需要验证
    if (user && user.role === 'admin') {
      message.success(`用户 ${record.name} 的密码已重置，新密码已发送到用户邮箱`);
    } else {
      handleSensitiveAction('reset_password', record);
    }
  };

  // 刷新二因素认证
  const handleRefresh2FA = (record: any) => {
    // 对于管理员，直接执行；对于其他用户，需要验证
    if (user && user.role === 'admin') {
      message.success(`用户 ${record.name} 的二因素认证已重置，新的二维码已生成`);
    } else {
      handleSensitiveAction('refresh_2fa', record);
    }
  };

  // 用户表格列定义
  const userColumns = [
    {
      title: '用户ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a: any, b: any) => a.id.localeCompare(b.id),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space>
          {text}
          {record.isCurrentUser && (
            <Tag color="#108ee9">(当前用户)</Tag>
          )}
          {record.type === 'admin' && !record.isCurrentUser && (
            <Badge color="#f50" />
          )}
        </Space>
      ),
    },
    {
      title: '账号类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        if (type === 'admin') {
          return <Tag color="red">管理员</Tag>;
        } else {
          return <Tag color="blue">员工</Tag>;
        }
      },
      filters: [
        { text: '管理员', value: 'admin' },
        { text: '员工', value: 'employee' },
      ],
      onFilter: (value: any, record: any) => record.type === value,
    },
    {
      title: '用户名/邮箱',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      filters: departmentData.map(dept => ({ text: dept.name, value: dept.name })),
      onFilter: (value: any, record: any) => record.department === value,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      filters: [
        { text: '超级管理员', value: '超级管理员' },
        { text: '部门管理员', value: '部门管理员' },
        { text: '合伙人', value: '合伙人' },
        { text: '项目经理', value: '项目经理' },
        { text: '会计师', value: '会计师' },
        { text: '助理', value: '助理' },
      ],
      onFilter: (value: any, record: any) => record.role === value,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'green';
        if (status === '休眠') color = 'orange';
        if (status === '禁用') color = 'red';
        return <Tag color={color}>{status}</Tag>;
      },
      filters: [
        { text: '正常', value: '正常' },
        { text: '休眠', value: '休眠' },
        { text: '禁用', value: '禁用' },
      ],
      onFilter: (value: any, record: any) => record.status === value,
    },
    {
      title: '双因素认证',
      dataIndex: 'mfa',
      key: 'mfa',
      render: (mfa: boolean) => {
        return mfa ? 
          <Tag color="green" icon={<SafetyOutlined />}>已启用</Tag> : 
          <Tag color="red" icon={<ExclamationCircleOutlined />}>未启用</Tag>;
      },
      filters: [
        { text: '已启用', value: true },
        { text: '未启用', value: false },
      ],
      onFilter: (value: any, record: any) => record.mfa === value,
    },
    {
      title: '最近登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      sorter: (a: any, b: any) => new Date(a.lastLogin).getTime() - new Date(b.lastLogin).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <a onClick={() => showDetailModal(record)}>详情</a>
          <a onClick={() => showEditModal(record)}>编辑</a>
          <a onClick={() => showTempPermissionModal(record)}>临时授权</a>
          {record.status === '休眠' ? 
            <a onClick={() => handleSensitiveAction('enable', record)}>激活</a> : 
            record.status === '正常' ? 
            <a onClick={() => handleSensitiveAction('disable', record)}>禁用</a> : 
            <a onClick={() => handleSensitiveAction('enable', record)}>启用</a>
          }
          <Popconfirm
            title="确定要删除此用户吗?"
            description="删除操作不可恢复，用户数据将被归档"
            onConfirm={() => handleSensitiveAction('delete', record)}
            okText="确认"
            cancelText="取消"
          >
            <a style={{ color: 'red' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  
  // 部门表格列定义
  const departmentColumns = [
    {
      title: '部门ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '部门名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: '部门主管',
      dataIndex: 'manager',
      key: 'manager',
    },
    {
      title: '成员数量',
      dataIndex: 'members',
      key: 'members',
      sorter: (a: any, b: any) => a.members - b.members,
    },
    {
      title: '创建时间',
      dataIndex: 'createdTime',
      key: 'createdTime',
      sorter: (a: any, b: any) => new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <a>查看成员</a>
          <a>编辑</a>
        </Space>
      ),
    },
  ];
  
  // 日志表格列定义
  const logColumns = [
    {
      title: '操作ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '操作人',
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      filters: [
        { text: '创建用户', value: '创建用户' },
        { text: '权限变更', value: '权限变更' },
        { text: '账户禁用', value: '账户禁用' },
        { text: '部门调整', value: '部门调整' },
        { text: '账户休眠', value: '账户休眠' },
      ],
      onFilter: (value: any, record: any) => record.action === value,
    },
    {
      title: '操作对象',
      dataIndex: 'target',
      key: 'target',
    },
    {
      title: '操作时间',
      dataIndex: 'time',
      key: 'time',
      sorter: (a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime(),
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
    },
    {
      title: '详细信息',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <a>详情</a>
      ),
    },
  ];

  // 管理员用户的权限分配
  const adminPermissionSets = [
    {
      key: '1',
      title: '用户管理',
    },
    {
      key: '2',
      title: '部门管理',
    },
    {
      key: '3',
      title: '系统配置',
    },
    {
      key: '4',
      title: '日志查看',
    },
    {
      key: '5',
      title: '数据备份',
    },
  ];

  // 渲染表单的验证码输入部分
  const renderVerifyForm = () => {
    return (
      <Form layout="vertical">
        <Alert
          message="安全验证"
          description="由于当前操作涉及用户权限变更，请输入验证码完成二次认证。"
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        <Form.Item
          label="验证码"
          required
          help="验证码已发送到您的手机和邮箱，有效期5分钟"
        >
          <Input
            placeholder="请输入6位验证码"
            maxLength={6}
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Form>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <Title level={2}>用户与权限管理</Title>
      </div>
      
      <Tabs defaultActiveKey="1" onChange={(key) => setCurrentTab(key)}>
        <TabPane
          tab={
            <span>
              <TeamOutlined />
              用户管理
            </span>
          }
          key="1"
        >
          <Card style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <Space size="large">
                <Input
                  placeholder="搜索用户ID/姓名/邮箱"
                  prefix={<SearchOutlined />}
                  style={{ width: 300 }}
                />
                <Select placeholder="部门" style={{ width: 150 }}>
                  {departmentData.map(dept => (
                    <Option key={dept.id} value={dept.name}>{dept.name}</Option>
                  ))}
                </Select>
                <Select placeholder="状态" style={{ width: 150 }}>
                  <Option value="正常">正常</Option>
                  <Option value="休眠">休眠</Option>
                  <Option value="禁用">禁用</Option>
                </Select>
                <Select placeholder="账号类型" style={{ width: 150 }}>
                  <Option value="admin">管理员</Option>
                  <Option value="employee">员工</Option>
                </Select>
              </Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={showUserModal}>
                创建用户
              </Button>
            </div>
            
            <Table 
              columns={userColumns} 
              dataSource={users} 
              rowKey="id"
              pagination={{ 
                pageSize: 10,
                showTotal: (total) => `共 ${total} 个用户`
              }}
            />
          </Card>
        </TabPane>
        
        <TabPane
          tab={
            <span>
              <UserOutlined />
              部门管理
            </span>
          }
          key="2"
        >
          <Card style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <Input
                placeholder="搜索部门名称/ID"
                prefix={<SearchOutlined />}
                style={{ width: 300 }}
              />
              <Button type="primary" icon={<PlusOutlined />}>
                新建部门
              </Button>
            </div>
            
            <Table 
              columns={departmentColumns} 
              dataSource={departmentData} 
              rowKey="id"
              pagination={{ 
                pageSize: 10,
                showTotal: (total) => `共 ${total} 个部门`
              }}
            />
          </Card>
        </TabPane>
        
        <TabPane
          tab={
            <span>
              <HistoryOutlined />
              操作日志
            </span>
          }
          key="3"
        >
          <Card style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <Space size="large">
                <Input
                  placeholder="搜索操作人/操作对象"
                  prefix={<SearchOutlined />}
                  style={{ width: 300 }}
                />
                <Select placeholder="操作类型" style={{ width: 150 }}>
                  <Option value="创建用户">创建用户</Option>
                  <Option value="权限变更">权限变更</Option>
                  <Option value="账户禁用">账户禁用</Option>
                  <Option value="部门调整">部门调整</Option>
                  <Option value="账户休眠">账户休眠</Option>
                </Select>
                <RangePicker placeholder={['开始日期', '结束日期']} />
              </Space>
              <Button type="primary" icon={<SearchOutlined />}>
                搜索
              </Button>
            </div>
            
            <Table 
              columns={logColumns} 
              dataSource={logData} 
              rowKey="id"
              pagination={{ 
                pageSize: 10,
                showTotal: (total) => `共 ${total} 条日志记录`
              }}
            />
          </Card>
        </TabPane>
        
        <TabPane
          tab={
            <span>
              <SettingOutlined />
              安全设置
            </span>
          }
          key="4"
        >
          <Card title="账号安全策略" style={{ marginBottom: '24px' }}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card type="inner" title="登录安全">
                  <Form layout="vertical">
                    <Form.Item label="管理员双因素认证" tooltip="强制管理员账号必须开启双因素认证">
                      <Switch defaultChecked disabled />
                      <Text type="secondary" style={{ marginLeft: 8 }}>（强制开启，不可更改）</Text>
                    </Form.Item>
                    
                    <Form.Item label="员工双因素认证" tooltip="建议员工账号开启双因素认证以提高安全性">
                      <Switch defaultChecked />
                    </Form.Item>
                    
                    <Form.Item label="密码复杂度要求" tooltip="设置密码最低复杂度要求">
                      <Select defaultValue="high">
                        <Option value="low">低（至少6位，包含字母和数字）</Option>
                        <Option value="medium">中（至少8位，包含大小写字母和数字）</Option>
                        <Option value="high">高（至少10位，包含大小写字母、数字和特殊字符）</Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item label="密码有效期" tooltip="设置密码过期后必须更改">
                      <Select defaultValue="90">
                        <Option value="30">30天</Option>
                        <Option value="60">60天</Option>
                        <Option value="90">90天</Option>
                        <Option value="180">180天</Option>
                        <Option value="never">永不过期</Option>
                      </Select>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
              
              <Col span={24}>
                <Card type="inner" title="账号生命周期">
                  <Form layout="vertical">
                    <Form.Item label="账号休眠策略" tooltip="设置账号连续未登录多少天后自动休眠">
                      <Select defaultValue="30">
                        <Option value="15">15天</Option>
                        <Option value="30">30天</Option>
                        <Option value="60">60天</Option>
                        <Option value="90">90天</Option>
                        <Option value="never">不自动休眠</Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item label="日志保留周期" tooltip="设置系统日志保留时间">
                      <Select defaultValue="180">
                        <Option value="90">90天</Option>
                        <Option value="180">180天</Option>
                        <Option value="365">365天</Option>
                        <Option value="forever">永久保留</Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item label="HR系统集成" tooltip="与HR系统集成以自动处理离职员工账号">
                      <Switch defaultChecked />
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
            </Row>
          </Card>
        </TabPane>
      </Tabs>
      
      {/* 创建用户模态框 */}
      <Modal
        title="创建新用户"
        open={isUserModalVisible}
        onOk={handleUserOk}
        onCancel={handleUserCancel}
        width={700}
      >
        <Form layout="vertical">
          <Form.Item label="账号类型" required>
            <Radio.Group onChange={handleRoleTypeChange} value={currentRole}>
              <Radio value="employee">员工账号</Radio>
              <Radio value="admin">管理员账号</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item label="姓名" required>
            <Input placeholder="请输入用户姓名" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label={currentRole === 'employee' ? "企业邮箱" : "管理员邮箱"} 
                required
                tooltip={currentRole === 'employee' ? "请使用企业域名邮箱" : "为管理员设置专用邮箱"}
              >
                <Input placeholder={currentRole === 'employee' ? "请输入企业邮箱" : "请输入管理员邮箱"} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="手机号码" required>
                <Input placeholder="请输入手机号码" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="所属部门" required>
                <Select placeholder="请选择部门">
                  {departmentData.map(dept => (
                    <Option key={dept.id} value={dept.name}>{dept.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={currentRole === 'employee' ? "角色" : "管理员类型"} required>
                {currentRole === 'employee' ? (
                  <Select placeholder="请选择角色">
                    <Option value="合伙人">合伙人</Option>
                    <Option value="项目经理">项目经理</Option>
                    <Option value="会计师">会计师</Option>
                    <Option value="助理">助理</Option>
                  </Select>
                ) : (
                  <Select placeholder="请选择管理员类型">
                    <Option value="超级管理员">超级管理员</Option>
                    <Option value="部门管理员">部门管理员</Option>
                  </Select>
                )}
              </Form.Item>
            </Col>
          </Row>
          
          {currentRole === 'admin' && (
            <Form.Item label="管理范围" tooltip="设置管理员的权限范围" required>
              <Select placeholder="请选择管理范围" mode={currentRole === 'admin' ? "multiple" : undefined}>
                {adminPermissionSets.map(item => (
                  <Option key={item.key} value={item.title}>{item.title}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          
          <Form.Item 
            label="强制双因素认证" 
            tooltip={currentRole === 'admin' ? "管理员账号必须启用双因素认证" : "提高账号安全性"}
          >
            <Switch defaultChecked={currentRole === 'admin'} disabled={currentRole === 'admin'} />
            {currentRole === 'admin' && (
              <Text type="secondary" style={{ marginLeft: 8 }}>（管理员必须启用，不可更改）</Text>
            )}
          </Form.Item>
          
          <Form.Item label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 临时权限授予模态框 */}
      <Modal
        title="临时权限授予"
        open={isTempPermissionModalVisible}
        onOk={handleTempPermissionOk}
        onCancel={handleTempPermissionCancel}
        width={700}
      >
        {selectedUser && (
          <Form layout="vertical">
            <Alert
              message="临时权限说明"
              description="临时权限将在指定时间后自动失效，用于特定项目或任务的临时授权"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            <div style={{ marginBottom: 24 }}>
              <Row>
                <Col span={4}>
                  <Avatar 
                    style={{ 
                      backgroundColor: selectedUser.type === 'admin' ? '#f5222d' : '#1890ff',
                      verticalAlign: 'middle' 
                    }} 
                    size={64}
                  >
                    {selectedUser.name.charAt(0)}
                  </Avatar>
                </Col>
                <Col span={20}>
                  <Title level={4}>{selectedUser.name}</Title>
                  <Text>{selectedUser.username}</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Space>
                      <Tag color="blue">{selectedUser.department}</Tag>
                      <Tag color="green">{selectedUser.role}</Tag>
                    </Space>
                  </div>
                </Col>
              </Row>
            </div>
            
            <Form.Item 
              name="projects" 
              label="可访问项目" 
              tooltip="选择该用户可临时访问的项目"
            >
              <Transfer
                dataSource={projectsData}
                titles={['可选项目', '授权项目']}
                targetKeys={targetKeys}
                onChange={handleChange}
                render={item => item.name}
                listStyle={{
                  width: 300,
                  height: 300,
                }}
              />
            </Form.Item>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="permissions" 
                  label="临时授权内容" 
                  tooltip="选择临时授予的权限类型"
                  rules={[{ required: true, message: '请选择授权内容!' }]}
                >
                  <Select
                    mode="multiple"
                    placeholder="请选择权限"
                    style={{ width: '100%' }}
                    defaultValue={['view']}
                  >
                    <Option value="view">查看项目信息</Option>
                    <Option value="edit">编辑项目文档</Option>
                    <Option value="export">导出项目数据</Option>
                    <Option value="comment">添加评论</Option>
                    <Option value="approve">审批流程</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="expireDate" 
                  label="有效期至" 
                  tooltip="权限到期时间，超过此时间后权限自动失效"
                  rules={[{ required: true, message: '请选择有效期!' }]}
                >
                  <DatePicker 
                    style={{ width: '100%' }} 
                    placeholder="请选择截止日期"
                    showTime
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item name="reason" label="授权原因" rules={[{ required: true, message: '请输入授权原因!' }]}>
              <Input.TextArea 
                rows={3} 
                placeholder="请描述授权原因，将记录在日志中"
              />
            </Form.Item>
            
            <Form.Item name="notify" valuePropName="checked">
              <Switch defaultChecked /> 通知用户已获得临时权限
            </Form.Item>
          </Form>
        )}
      </Modal>
      
      {/* 敏感操作二次验证模态框 */}
      <Modal
        title="安全验证"
        open={isVerifyModalVisible}
        onOk={handleVerifyOk}
        onCancel={handleVerifyCancel}
        width={420}
      >
        {renderVerifyForm()}
      </Modal>
      
      {/* 编辑用户模态框 */}
      <Modal
        title="编辑用户"
        open={isEditModalVisible}
        onOk={handleEditOk}
        onCancel={handleEditCancel}
        width={700}
      >
        <Form
          form={editForm}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入用户姓名' }]}
          >
            <Input placeholder="请输入用户姓名" />
          </Form.Item>
          
          <Form.Item
            name="username"
            label="用户名/邮箱"
            rules={[{ required: true, message: '请输入用户名/邮箱' }]}
          >
            <Input placeholder="请输入用户名/邮箱" />
          </Form.Item>
          
          <Form.Item
            name="department"
            label="所属部门"
            rules={[{ required: true, message: '请选择部门' }]}
          >
            <Select placeholder="请选择部门">
              {departmentData.map(dept => (
                <Option key={dept.id} value={dept.name}>{dept.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="超级管理员">超级管理员</Option>
              <Option value="部门管理员">部门管理员</Option>
              <Option value="合伙人">合伙人</Option>
              <Option value="项目经理">项目经理</Option>
              <Option value="会计师">会计师</Option>
              <Option value="助理">助理</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="正常">正常</Option>
              <Option value="休眠">休眠</Option>
              <Option value="禁用">禁用</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="mfa"
            label="双因素认证"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 用户详情模态框 */}
      <Modal
        title={
          <Space>
            <UserOutlined /> 
            用户详情
            {selectedUser?.status === '禁用' && (
              <Tag color="red">已禁用</Tag>
            )}
          </Space>
        }
        open={isDetailModalVisible}
        onCancel={handleDetailCancel}
        footer={[
          <Button key="back" onClick={handleDetailCancel}>
            关闭
          </Button>,
          <Button 
            key="reset" 
            type="default" 
            onClick={() => handleResetPassword(selectedUser)}
            icon={<LockOutlined />}
          >
            重置密码
          </Button>,
          <Button 
            key="refresh2fa" 
            type="default" 
            onClick={() => handleRefresh2FA(selectedUser)}
            icon={<SafetyOutlined />}
          >
            刷新二维码
          </Button>,
          <Button
            key="edit"
            type="primary"
            onClick={() => {
              handleDetailCancel();
              showEditModal(selectedUser);
            }}
          >
            编辑
          </Button>
        ]}
        width={700}
      >
        {selectedUser && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
              <Avatar 
                size={64} 
                icon={<UserOutlined />} 
                style={{ 
                  backgroundColor: selectedUser.isCurrentUser ? '#108ee9' : selectedUser.type === 'admin' ? '#f56a00' : '#1890ff',
                  marginRight: 16 
                }}
              >
                {selectedUser.name.charAt(0)}
              </Avatar>
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {selectedUser.name}
                  {selectedUser.isCurrentUser && (
                    <Tag color="#108ee9" style={{ marginLeft: 8 }}>当前用户</Tag>
                  )}
                </Title>
                <Text type="secondary">{selectedUser.email || selectedUser.username}</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color={selectedUser.type === 'admin' ? 'red' : 'blue'}>
                    {selectedUser.type === 'admin' ? '管理员' : '员工'}
                  </Tag>
                  <Tag color="green">{selectedUser.role}</Tag>
                </div>
              </div>
            </div>
            
            <Divider />
            
            <Descriptions title="基本信息" bordered column={2}>
              <Descriptions.Item label="用户ID" span={2}>{selectedUser.id}</Descriptions.Item>
              <Descriptions.Item label="姓名">{selectedUser.name}</Descriptions.Item>
              <Descriptions.Item label="用户名/邮箱">{selectedUser.username}</Descriptions.Item>
              <Descriptions.Item label="所属部门">{selectedUser.department}</Descriptions.Item>
              <Descriptions.Item label="角色">{selectedUser.role}</Descriptions.Item>
              <Descriptions.Item label="账号状态">
                <Badge 
                  status={selectedUser.status === '正常' ? 'success' : selectedUser.status === '休眠' ? 'warning' : 'error'} 
                  text={selectedUser.status} 
                />
              </Descriptions.Item>
              <Descriptions.Item label="双因素认证">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Badge status={selectedUser.mfa ? 'success' : 'default'} text={selectedUser.mfa ? '已启用' : '未启用'} />
                  {selectedUser.isCurrentUser && selectedUser.mfa && (
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={() => message.info('二维码刷新功能开发中...')} 
                      style={{ marginLeft: 8 }}
                    >
                      刷新二维码
                    </Button>
                  )}
                </div>
              </Descriptions.Item>
            </Descriptions>
            
            <Divider />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <Text type="secondary">最后登录</Text>
                <p>
                  <ClockCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  {selectedUser.lastLogin}
                </p>
              </div>
              
              <div>
                <Text type="secondary">创建时间</Text>
                <p>{selectedUser.createdTime}</p>
              </div>
              
              <div>
                <Text type="secondary">项目数量</Text>
                <p>{selectedUser.projects === null ? '不适用' : selectedUser.projects}</p>
              </div>
            </div>
            
            {selectedUser.isCurrentUser && (
              <div style={{ marginTop: 16 }}>
                <Alert
                  message="这是您当前的帐户信息"
                  description="您可以通过点击"修改密码"按钮更新您的密码，或通过"编辑"按钮修改您的个人信息。请确保您的信息保持最新，以便系统能够正确识别您的身份。"
                  type="info"
                  showIcon
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

// 导出页面组件，用ProtectedRoute包装
const UserManagementPage = () => {
  return (
    <ProtectedRoute requiredRole="admin">
      <UserManagement />
    </ProtectedRoute>
  );
};

export default UserManagementPage; 