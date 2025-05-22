import React, { useState } from 'react';
import { NextPage } from 'next';
import { Typography, Form, Input, Button, Upload, Avatar, Row, Col, Card, Divider, message, Select, Space } from 'antd';
import { UploadOutlined, UserOutlined, MailOutlined, PhoneOutlined, SaveOutlined } from '@ant-design/icons';
import AppLayout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const ProfilePage: NextPage & { getLayout?: (page: React.ReactElement) => React.ReactNode } = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  // 如果没有用户信息，显示加载中
  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Text>加载用户信息中...</Text>
      </div>
    );
  }
  
  // 用户数据使用当前登录用户信息
  const userData = {
    name: user.name,
    email: user.email,
    phone: '13812345678', // 默认电话，实际应从用户数据获取
    department: user.department,
    position: user.role === 'admin' ? '系统管理员' : user.role === 'manager' ? '项目经理' : '普通员工',
    joinDate: '2023-01-01', // 示例日期
    qualifications: ['注册会计师'],
    bio: '专业会计师'
  };
  
  // 提交表单处理
  const handleSubmit = (values: any) => {
    setLoading(true);
    
    // 模拟API请求
    setTimeout(() => {
      console.log('提交的数据:', values);
      message.success('个人资料更新成功');
      setLoading(false);
    }, 1000);
  };
  
  return (
    <>
      <Card bordered={false}>
        <Row gutter={16} align="middle" justify="space-between">
          <Col>
            <Space direction="vertical" size={4}>
              <Text type="secondary">账号管理</Text>
              <Title level={4} style={{ margin: 0 }}>个人资料</Title>
            </Space>
          </Col>
        </Row>
      </Card>
      
      <Row gutter={24}>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Avatar 
                size={100} 
                icon={<UserOutlined />} 
                style={{ backgroundColor: '#1890ff', marginBottom: 16 }}
              />
              <div style={{ marginBottom: 16 }}>
                <Upload
                  name="avatar"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    message.info('头像上传功能尚未实现');
                    return false;
                  }}
                >
                  <Button icon={<UploadOutlined />}>更换头像</Button>
                </Upload>
              </div>
              <Title level={4}>{userData.name}</Title>
              <Paragraph>{userData.position}</Paragraph>
              <Divider />
              <div style={{ textAlign: 'left' }}>
                <Paragraph>
                  <MailOutlined style={{ marginRight: 8 }} />
                  {userData.email}
                </Paragraph>
                <Paragraph>
                  <PhoneOutlined style={{ marginRight: 8 }} />
                  {userData.phone}
                </Paragraph>
                <Paragraph>
                  <strong>部门:</strong> {userData.department}
                </Paragraph>
                <Paragraph>
                  <strong>入职日期:</strong> {userData.joinDate}
                </Paragraph>
                <Paragraph>
                  <strong>资质认证:</strong> {userData.qualifications.join(', ')}
                </Paragraph>
              </div>
            </div>
          </Card>
        </Col>
          
        <Col span={16}>
          <Card title="编辑个人资料">
            <Form
              form={form}
              layout="vertical"
              initialValues={userData}
              onFinish={handleSubmit}
            >
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入您的姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
              
              <Form.Item
                name="email"
                label="电子邮箱"
                rules={[
                  { required: true, message: '请输入您的电子邮箱' },
                  { type: 'email', message: '请输入有效的电子邮箱地址' }
                ]}
              >
                <Input placeholder="请输入电子邮箱" />
              </Form.Item>
              
              <Form.Item
                name="phone"
                label="手机号码"
                rules={[
                  { required: true, message: '请输入您的手机号码' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
                ]}
              >
                <Input placeholder="请输入手机号码" />
              </Form.Item>
              
              <Form.Item
                name="department"
                label="所属部门"
              >
                <Select disabled>
                  <Option value="审计">审计</Option>
                  <Option value="税务">税务</Option>
                  <Option value="内控">内控</Option>
                  <Option value="资产评估">资产评估</Option>
                  <Option value="管理">管理</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="position"
                label="职位"
              >
                <Input disabled />
              </Form.Item>
              
              <Form.Item
                name="qualifications"
                label="专业资质"
              >
                <Select
                  mode="tags"
                  placeholder="请输入或选择您的专业资质"
                  options={[
                    { value: '注册会计师', label: '注册会计师' },
                    { value: 'ACCA', label: 'ACCA' },
                    { value: 'CFA', label: 'CFA' },
                    { value: '税务师', label: '税务师' },
                    { value: '资产评估师', label: '资产评估师' }
                  ]}
                />
              </Form.Item>
              
              <Form.Item
                name="bio"
                label="个人简介"
              >
                <Input.TextArea rows={4} placeholder="请简要介绍您的专业背景和经验" />
              </Form.Item>
              
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                >
                  保存修改
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </>
  );
};

ProfilePage.getLayout = (page: React.ReactElement) => {
  return (
    <AppLayout>
      {page}
    </AppLayout>
  );
};

export default ProfilePage; 