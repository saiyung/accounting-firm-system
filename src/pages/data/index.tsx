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
  Upload,
  Divider,
  Tooltip,
  Tree,
  Row,
  Col,
  Badge,
  Checkbox,
  message
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  FileProtectOutlined, 
  TeamOutlined,
  LockOutlined,
  UserOutlined,
  DatabaseOutlined,
  CloudUploadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  InfoCircleOutlined,
  ProjectOutlined,
  UnorderedListOutlined,
  BarsOutlined,
  SettingOutlined,
  UserAddOutlined,
  BankOutlined,
  ProfileOutlined
} from '@ant-design/icons';
import { NextPage } from 'next';
import AppLayout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import ClientList from '@/components/client/ClientList';
import AddClient from '@/components/client/AddClient';
import type { ReactNode } from 'react';
import { useRouter } from 'next/router';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TreeNode } = Tree;

// 定义带有getLayout的NextPage类型
type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactNode) => ReactNode
}

const DataManagement: NextPageWithLayout = () => {
  const router = useRouter();
  const { tab } = router.query;
  const [activeTab, setActiveTab] = useState<string>('1');
  const { user } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isEditRoleModalVisible, setIsEditRoleModalVisible] = useState(false);
  const [isDepartmentModalVisible, setIsDepartmentModalVisible] = useState(false);
  const [isEditDepartmentModalVisible, setIsEditDepartmentModalVisible] = useState(false);
  const [currentClient, setCurrentClient] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<any>(null);
  const [currentDepartment, setCurrentDepartment] = useState<any>(null);
  const [roleForm] = Form.useForm();
  const [clientForm] = Form.useForm();
  const [editRoleForm] = Form.useForm();
  const [departmentForm] = Form.useForm();
  const [editDepartmentForm] = Form.useForm();
  const [departmentData, setDepartmentData] = useState([
    {
      id: 'D001',
      name: '审计部',
      manager: '张明',
      memberCount: 25,
      createdAt: '2020-01-15',
      description: '负责公司内外部审计工作，确保合规运营'
    },
    {
      id: 'D002',
      name: '税务部',
      manager: '李刚',
      memberCount: 18,
      createdAt: '2020-01-15',
      description: '负责税务规划与咨询，确保税务合规'
    },
    {
      id: 'D003',
      name: '咨询部',
      manager: '王琳',
      memberCount: 15,
      createdAt: '2020-02-20',
      description: '提供业务咨询和战略规划服务'
    },
    {
      id: 'D004',
      name: '会计服务部',
      manager: '赵伟',
      memberCount: 20,
      createdAt: '2020-03-10',
      description: '提供财务会计服务和报表编制'
    },
    {
      id: 'D005',
      name: '内控评估部',
      manager: '陈静',
      memberCount: 12,
      createdAt: '2020-05-18',
      description: '负责内部控制评估与风险管理'
    }
  ]);

  // 模拟客户数据
  const clientData = [
    {
      id: 'C20250001',
      name: '智联科技有限公司',
      industry: '科技',
      contact: '黄小明',
      phone: '13812345678',
      address: '杭州市西湖区科技园区',
      projects: 3,
      lastUpdate: '2025-03-25',
      tags: ['高价值', '上市企业']
    },
    {
      id: 'C20250002',
      name: '上海国际贸易集团',
      industry: '贸易',
      contact: '张立',
      phone: '13987654321',
      address: '上海市浦东新区陆家嘴',
      projects: 2,
      lastUpdate: '2025-03-20',
      tags: ['高价值']
    },
    {
      id: 'C20250003',
      name: '北京健康医疗科技',
      industry: '医疗',
      contact: '刘伟',
      phone: '13765432198',
      address: '北京市海淀区中关村',
      projects: 1,
      lastUpdate: '2025-03-15',
      tags: ['潜力客户', '上市企业']
    },
    {
      id: 'C20250004',
      name: '广州餐饮集团',
      industry: '餐饮',
      contact: '陈明',
      phone: '13456789012',
      address: '广州市天河区珠江新城',
      projects: 2,
      lastUpdate: '2025-03-10',
      tags: ['稳定合作']
    },
    {
      id: 'C20250005',
      name: '深圳科技公司',
      industry: '科技',
      contact: '李强',
      phone: '13567890123',
      address: '深圳市南山区科技园',
      projects: 1,
      lastUpdate: '2025-03-05',
      tags: ['新客户', '拟上市']
    },
  ];

  // 模拟权限数据
  const roleData = [
    {
      id: 'R001',
      name: '系统管理员',
      description: '拥有所有系统功能的访问权限',
      users: 2,
      lastUpdate: '2025-03-01',
      permissions: ['全部']
    },
    {
      id: 'R002',
      name: '合伙人',
      description: '可查看全部项目和数据，管理人员分配',
      users: 5,
      lastUpdate: '2025-03-05',
      permissions: ['项目管理', '报告查看', '数据查看', '仪表盘查看']
    },
    {
      id: 'R003',
      name: '项目经理',
      description: '管理指定项目，分配任务，查看相关报告',
      users: 10,
      lastUpdate: '2025-03-10',
      permissions: ['项目管理', '报告编辑', '数据查看(有限)']
    },
    {
      id: 'R004',
      name: '会计师',
      description: '执行项目任务，编写报告',
      users: 30,
      lastUpdate: '2025-03-15',
      permissions: ['项目查看', '报告编辑', '数据查看(有限)']
    },
    {
      id: 'R005',
      name: '助理',
      description: '辅助项目执行，收集资料',
      users: 15,
      lastUpdate: '2025-03-20',
      permissions: ['项目查看(有限)', '数据录入']
    },
  ];

  // 模拟用户数据 - 用于部门主管选择
  const userData = [
    {
      id: 'U001',
      name: '张明',
      username: 'zhangming@firm.com',
      department: '审计部',
      role: '项目经理',
    },
    {
      id: 'U002',
      name: '李刚',
      username: 'ligang@firm.com',
      department: '税务部',
      role: '项目经理',
    },
    {
      id: 'U003',
      name: '王琳',
      username: 'wanglin@firm.com',
      department: '审计部',
      role: '合伙人',
    },
    {
      id: 'A001',
      name: user?.name || '系统管理员',
      username: 'admin@firm.com',
      department: 'IT部门',
      role: '超级管理员',
    },
    {
      id: 'U004',
      name: '刘芳',
      username: 'liufang@firm.com',
      department: '税务部',
      role: '合伙人',
    },
    {
      id: 'U005',
      name: '张华',
      username: 'zhanghua@firm.com',
      department: '咨询部',
      role: '项目经理',
    },
    {
      id: 'U006',
      name: '周明',
      username: 'zhouming@firm.com',
      department: '行政部',
      role: '部门经理',
    },
    {
      id: 'U007',
      name: '郑强',
      username: 'zhengqiang@firm.com',
      department: 'IT部门',
      role: '部门经理',
    }
  ];

  // 根据URL参数设置当前激活的标签页
  useEffect(() => {
    if (tab) {
      setActiveTab(tab as string);
      
      // 如果tab=1，自动打开添加客户对话框
      if (tab === '1') {
        setIsModalVisible(true);
      }
    }
  }, [tab]);

  // 切换标签页
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    router.push(`/data?tab=${key}`, undefined, { shallow: true });
  };

  // 打开添加客户对话框
  const showAddClientModal = () => {
    setIsModalVisible(true);
  };

  // 关闭添加客户对话框
  const handleAddClientCancel = () => {
    setIsModalVisible(false);
  };

  // 添加客户成功的回调
  const handleAddClientSuccess = () => {
    setIsModalVisible(false);
    // 刷新客户列表
  };

  // 客户表格列定义
  const clientColumns = [
    {
      title: '客户编号',
      dataIndex: 'id',
      key: 'id',
      sorter: (a: any, b: any) => a.id.localeCompare(b.id),
    },
    {
      title: '客户名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      filters: [
        { text: '科技', value: '科技' },
        { text: '贸易', value: '贸易' },
        { text: '医疗', value: '医疗' },
        { text: '餐饮', value: '餐饮' },
      ],
      onFilter: (value: any, record: any) => record.industry === value,
    },
    {
      title: '联系人',
      dataIndex: 'contact',
      key: 'contact',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: '相关项目',
      dataIndex: 'projects',
      key: 'projects',
      sorter: (a: any, b: any) => a.projects - b.projects,
    },
    {
      title: '最近更新',
      dataIndex: 'lastUpdate',
      key: 'lastUpdate',
      sorter: (a: any, b: any) => new Date(a.lastUpdate).getTime() - new Date(b.lastUpdate).getTime(),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <>
          {tags.map(tag => {
            let color = 'blue';
            if (tag === '高价值') color = 'gold';
            if (tag === '上市企业') color = 'green';
            if (tag === '新客户') color = 'purple';
            if (tag === '拟上市') color = 'magenta';
            return (
              <Tag color={color} key={tag}>
                {tag}
              </Tag>
            );
          })}
        </>
      ),
      filters: [
        { text: '高价值', value: '高价值' },
        { text: '上市企业', value: '上市企业' },
        { text: '潜力客户', value: '潜力客户' },
        { text: '稳定合作', value: '稳定合作' },
        { text: '新客户', value: '新客户' },
        { text: '拟上市', value: '拟上市' },
      ],
      onFilter: (value: any, record: any) => record.tags.includes(value),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <a>详情</a>
          <a onClick={() => handleEditClient(record)}>编辑</a>
          <a>项目</a>
        </Space>
      ),
    },
  ];

  // 权限表格列定义
  const roleColumns = [
    {
      title: '角色编号',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          {text}
          {text === '系统管理员' && (
            <Tooltip title="具有最高权限，请谨慎分配">
              <InfoCircleOutlined style={{ color: '#faad14' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '角色描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '用户数量',
      dataIndex: 'users',
      key: 'users',
      sorter: (a: any, b: any) => a.users - b.users,
    },
    {
      title: '最近更新',
      dataIndex: 'lastUpdate',
      key: 'lastUpdate',
      sorter: (a: any, b: any) => new Date(a.lastUpdate).getTime() - new Date(b.lastUpdate).getTime(),
    },
    {
      title: '权限项',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => (
        <>
          {permissions.map(permission => {
            let color = 'blue';
            if (permission === '全部') color = 'red';
            return (
              <Tag color={color} key={permission}>
                {permission}
              </Tag>
            );
          })}
        </>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <a>查看用户</a>
          <a onClick={() => handleEditRole(record)}>编辑权限</a>
        </Space>
      ),
    },
  ];

  // 部门管理表格列定义
  const departmentColumns = [
    {
      title: '部门编号',
      dataIndex: 'id',
      key: 'id',
      sorter: (a: any, b: any) => a.id.localeCompare(b.id),
    },
    {
      title: '部门名称',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: '部门主管',
      dataIndex: 'manager',
      key: 'manager',
    },
    {
      title: '人员数量',
      dataIndex: 'memberCount',
      key: 'memberCount',
      sorter: (a: any, b: any) => a.memberCount - b.memberCount,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <a onClick={() => handleEditDepartment(record)}>编辑</a>
          <a>查看</a>
        </Space>
      ),
    },
  ];

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    clientForm.validateFields().then(values => {
      console.log('新增客户表单数据:', values);
      clientForm.resetFields();
      message.success('客户添加成功');
      setIsModalVisible(false);
    }).catch(info => {
      console.log('表单验证失败:', info);
    });
  };

  const handleCancel = () => {
    clientForm.resetFields();
    setIsModalVisible(false);
  };

  const showRoleModal = () => {
    setIsRoleModalVisible(true);
  };

  const handleRoleOk = () => {
    roleForm.validateFields().then(values => {
      console.log('新建角色表单数据:', values);
      roleForm.resetFields();
      setIsRoleModalVisible(false);
    }).catch(info => {
      console.log('表单验证失败:', info);
    });
  };

  const handleRoleCancel = () => {
    roleForm.resetFields();
    setIsRoleModalVisible(false);
  };

  // 处理编辑客户
  const handleEditClient = (client: any) => {
    setCurrentClient(client);
    clientForm.setFieldsValue(client);
    setIsEditModalVisible(true);
  };

  // 处理编辑角色
  const handleEditRole = (role: any) => {
    setCurrentRole(role);
    editRoleForm.setFieldsValue({
      ...role,
      permissions: role.permissions.includes('全部') 
        ? ['project_view', 'project_create', 'project_edit', 'project_delete', 'project_assign',
           'report_view', 'report_create', 'report_edit', 'report_review',
           'data_view', 'data_edit', 'data_import_export',
           'dashboard_view', 'dashboard_export',
           'system_user', 'system_role', 'system_permission', 'system_audit']
        : role.permissions.map((p: string) => {
            if (p === '项目管理') return ['project_view', 'project_create', 'project_edit'];
            if (p === '报告查看') return 'report_view';
            if (p === '报告编辑') return ['report_view', 'report_edit'];
            if (p === '数据查看') return 'data_view';
            if (p === '数据查看(有限)') return 'data_view';
            if (p === '仪表盘查看') return 'dashboard_view';
            if (p === '项目查看') return 'project_view';
            if (p === '项目查看(有限)') return 'project_view';
            if (p === '数据录入') return 'data_edit';
            return p;
          }).flat()
    });
    setIsEditRoleModalVisible(true);
  };

  // 确认编辑客户
  const handleEditClientOk = () => {
    clientForm.validateFields().then(values => {
      console.log('更新客户数据:', values);
      // 在实际应用中，这里应该调用API更新数据库
      message.success('客户信息已更新');
      setIsEditModalVisible(false);
    }).catch(info => {
      console.log('表单验证失败:', info);
    });
  };

  // 取消编辑客户
  const handleEditClientCancel = () => {
    setIsEditModalVisible(false);
  };

  // 确认编辑角色
  const handleEditRoleOk = () => {
    editRoleForm.validateFields().then(values => {
      console.log('更新角色数据:', values);
      // 在实际应用中，这里应该调用API更新数据库
      message.success('角色权限已更新');
      setIsEditRoleModalVisible(false);
    }).catch(info => {
      console.log('表单验证失败:', info);
    });
  };

  // 取消编辑角色
  const handleEditRoleCancel = () => {
    setIsEditRoleModalVisible(false);
  };

  // 显示新建部门Modal
  const showDepartmentModal = () => {
    setIsDepartmentModalVisible(true);
  };

  // 确认新建部门
  const handleDepartmentOk = () => {
    departmentForm.validateFields().then(values => {
      console.log('新建部门表单数据:', values);
      
      // 创建新部门对象
      const newDepartment = {
        id: `D${String(departmentData.length + 1).padStart(3, '0')}`,
        name: values.name,
        manager: values.manager,
        memberCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
        description: values.description
      };
      
      // 将新部门添加到部门数据数组
      setDepartmentData([...departmentData, newDepartment]);
      
      departmentForm.resetFields();
      message.success('部门创建成功');
      setIsDepartmentModalVisible(false);
    }).catch(info => {
      console.log('表单验证失败:', info);
    });
  };

  // 取消新建部门
  const handleDepartmentCancel = () => {
    departmentForm.resetFields();
    setIsDepartmentModalVisible(false);
  };

  // 处理编辑部门
  const handleEditDepartment = (department: any) => {
    setCurrentDepartment(department);
    editDepartmentForm.setFieldsValue({
      name: department.name,
      manager: department.manager,
      description: department.description,
      parentDepartment: '',
      defaultRole: '',
      permissions: ['project_all']
    });
    setIsEditDepartmentModalVisible(true);
  };

  // 确认编辑部门
  const handleEditDepartmentOk = () => {
    editDepartmentForm.validateFields().then(values => {
      console.log('更新部门数据:', values);
      
      // 创建更新后的部门对象
      const updatedDepartment = {
        ...currentDepartment,
        name: values.name,
        manager: values.manager,
        description: values.description
      };
      
      // 更新部门数据数组
      const updatedDepartments = departmentData.map(dept => 
        dept.id === currentDepartment.id ? updatedDepartment : dept
      );
      setDepartmentData(updatedDepartments);
      
      // 在实际应用中，这里应该调用API更新数据库
      message.success('部门信息已更新');
      setIsEditDepartmentModalVisible(false);
    }).catch(info => {
      console.log('表单验证失败:', info);
    });
  };

  // 取消编辑部门
  const handleEditDepartmentCancel = () => {
    setIsEditDepartmentModalVisible(false);
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <Card>
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane 
            tab={
              <span>
                <TeamOutlined />
                客户管理
              </span>
            } 
            key="1"
          >
            <ClientList 
              onAddClient={showAddClientModal} 
            />
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <BankOutlined />
                行业数据
              </span>
            } 
            key="2"
          >
            <div style={{ height: '600px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <h2>行业数据功能正在开发中...</h2>
            </div>
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <ProfileOutlined />
                资料库
              </span>
            } 
            key="3"
          >
            <div style={{ height: '600px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <h2>资料库功能正在开发中...</h2>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* 添加客户对话框 */}
      <AddClient 
        visible={isModalVisible}
        onCancel={handleAddClientCancel}
        onSuccess={handleAddClientSuccess}
      />
    </div>
  );
};

DataManagement.getLayout = (page: ReactNode) => {
  return (
    <AppLayout>
      {page}
    </AppLayout>
  );
};

export default DataManagement; 