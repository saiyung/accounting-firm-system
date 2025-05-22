import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  Button, 
  message, 
  Spin, 
  Empty, 
  Divider, 
  Alert, 
  Space, 
  Tag,
  Tooltip
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  TeamOutlined, 
  InfoCircleOutlined, 
  SearchOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

interface User {
  _id: string;
  name: string;
  email: string;
  department: string;
}

interface AddTeamMemberProps {
  projectId: string;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddTeamMember: React.FC<AddTeamMemberProps> = ({ 
  projectId, 
  visible, 
  onClose, 
  onSuccess 
}) => {
  const [form] = Form.useForm();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [userNotFound, setUserNotFound] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 角色选项
  const roleOptions = [
    { value: '项目经理', label: '项目经理' },
    { value: '审计师', label: '审计师' },
    { value: '助理审计师', label: '助理审计师' },
    { value: '税务专家', label: '税务专家' },
    { value: '顾问', label: '顾问' },
  ];

  // 加载所有用户
  useEffect(() => {
    if (visible) {
      loadUsers();
    }
  }, [visible]);

  // 加载用户列表
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users?limit=50');
      if (response.data.success) {
        setUsers(response.data.data);
        setFilteredUsers(response.data.data);
      }
    } catch (error) {
      console.error('加载用户列表失败:', error);
      message.error('无法加载用户列表，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 搜索用户处理函数
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setUserNotFound(false);
    
    if (!value) {
      setFilteredUsers(users);
      return;
    }
    
    // 本地过滤
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(value.toLowerCase()) || 
      user.email.toLowerCase().includes(value.toLowerCase())
    );
    
    setFilteredUsers(filtered);
    
    // 如果本地没有找到，则进行远程搜索
    if (filtered.length === 0) {
      searchUserRemote(value);
    }
  };

  // 远程搜索用户
  const searchUserRemote = async (term: string) => {
    try {
      setSearchLoading(true);
      const response = await axios.get(`/api/users/search?term=${encodeURIComponent(term)}`);
      
      if (response.data.success && response.data.data.length > 0) {
        // 添加到用户列表中
        const newUsers = response.data.data.filter((newUser: User) => 
          !users.some(existingUser => existingUser._id === newUser._id)
        );
        
        if (newUsers.length > 0) {
          setUsers([...users, ...newUsers]);
          setFilteredUsers(response.data.data);
          message.success(`找到 ${response.data.data.length} 个匹配的用户`);
        } else {
          setFilteredUsers(response.data.data);
        }
      } else {
        setUserNotFound(true);
      }
    } catch (error) {
      console.error('搜索用户失败:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // 选择用户处理函数
  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u._id === userId);
    if (user) {
      setSelectedUser(user);
      form.setFieldsValue({
        user: user._id,
        email: user.email,
        department: user.department
      });
    }
  };

  // 提交表单处理函数
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // 确保用户ID或邮箱存在
      const userData = selectedUser ? selectedUser._id : values.email;
      
      const response = await axios.post(`/api/projects/${projectId}/team`, {
        user: userData, // 可以是ID或邮箱
        role: values.role,
        allocation: values.allocation
      });
      
      if (response.data.success) {
        message.success('成功添加项目成员');
        form.resetFields();
        setSelectedUser(null);
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('添加项目成员失败:', error);
      
      if (error.response?.data?.error) {
        // 显示后端返回的错误信息
        message.error(`添加失败: ${error.response.data.error}`);
        
        // 用户已是团队成员的特殊处理
        if (error.response.data.error.includes('已经是团队成员')) {
          message.warning('该用户已在项目团队中，请选择其他用户');
        }
      } else {
        message.error('添加项目成员失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  // 取消操作
  const handleCancel = () => {
    form.resetFields();
    setSelectedUser(null);
    setUserNotFound(false);
    onClose();
  };

  return (
    <Modal
      title="添加项目成员"
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading}
          onClick={handleSubmit}
          icon={<UserAddOutlined />}
        >
          添加成员
        </Button>
      ]}
      width={600}
    >
      <Spin spinning={loading}>
        <Form form={form} layout="vertical">
          <Alert
            message="用户查找提示"
            description="您可以通过姓名或邮箱搜索用户。如果未找到，系统将自动尝试在全局用户库中查找。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Form.Item label="搜索用户" required>
            <Input
              prefix={<SearchOutlined />}
              placeholder="输入姓名或邮箱搜索"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              suffix={searchLoading ? <Spin size="small" /> : null}
              allowClear
            />
          </Form.Item>
          
          {userNotFound && (
            <Alert
              message="未找到用户"
              description="系统中未找到匹配的用户，请检查输入是否正确，或直接输入邮箱添加新用户。"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          <Form.Item
            name="user"
            label="选择用户"
            rules={[{ required: !userNotFound, message: '请选择用户' }]}
          >
            <Select
              placeholder="从搜索结果中选择用户"
              showSearch
              onChange={handleUserSelect}
              notFoundContent={filteredUsers.length === 0 ? <Empty description="无匹配用户" /> : null}
              filterOption={false}
              disabled={filteredUsers.length === 0}
            >
              {filteredUsers.map(user => (
                <Option key={user._id} value={user._id}>
                  <Space>
                    <UserOutlined />
                    {user.name}
                    <small style={{ color: '#999' }}>({user.email})</small>
                    <Tag color="blue">{user.department}</Tag>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          {userNotFound && (
            <>
              <Divider>或直接添加用户邮箱</Divider>
              <Form.Item
                name="email"
                label="用户邮箱"
                rules={[
                  { required: userNotFound, message: '请输入用户邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="请输入用户邮箱" />
              </Form.Item>
            </>
          )}
          
          {selectedUser && (
            <div style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Alert
                  message="已选择用户"
                  description={
                    <Space direction="vertical">
                      <div><strong>姓名:</strong> {selectedUser.name}</div>
                      <div><strong>邮箱:</strong> {selectedUser.email}</div>
                      <div><strong>部门:</strong> {selectedUser.department}</div>
                    </Space>
                  }
                  type="success"
                  showIcon
                />
              </Space>
            </div>
          )}
          
          <Form.Item
            name="role"
            label="项目角色"
            rules={[{ required: true, message: '请选择项目角色' }]}
            tooltip="为成员分配在项目中的角色"
          >
            <Select placeholder="请选择项目角色">
              {roleOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="allocation"
            label="时间分配比例"
            initialValue={100}
            rules={[{ required: true, message: '请设置时间分配比例' }]}
            tooltip="成员在此项目上的时间占比"
          >
            <InputNumber
              min={10}
              max={100}
              formatter={value => `${value}%`}
              parser={value => value!.replace('%', '')}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default AddTeamMember; 