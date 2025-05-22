import React, { useState } from 'react';
import { NextPage } from 'next';
import { Typography, Form, Switch, Select, Card, Row, Col, Button, Alert, message, Divider, List, Space, Modal, Input } from 'antd';
import { 
  SaveOutlined, 
  BellOutlined, 
  SafetyOutlined, 
  NotificationOutlined, 
  MailOutlined,
  MobileOutlined,
  UserSwitchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LockOutlined
} from '@ant-design/icons';
import AppLayout from '@/components/Layout';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const AccountSettingsPage: NextPage & { getLayout?: (page: React.ReactElement) => React.ReactNode } = () => {
  const [form] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);
  const [isVerifyModalVisible, setIsVerifyModalVisible] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [currentEmail, setCurrentEmail] = useState('zhangming@example.com');
  
  // 提交表单处理
  const handleSubmit = (values: any) => {
    console.log('提交的数据:', values);
    message.success('账号设置已更新');
  };
  
  // 显示更换邮箱弹窗
  const showEmailModal = () => {
    setIsEmailModalVisible(true);
    emailForm.resetFields();
  };
  
  // 提交新邮箱
  const handleEmailModalOk = () => {
    emailForm.validateFields().then(values => {
      setNewEmail(values.newEmail);
      setIsEmailModalVisible(false);
      setIsVerifyModalVisible(true);
    }).catch(errorInfo => {
      console.log('表单验证失败:', errorInfo);
    });
  };
  
  // 取消更换邮箱
  const handleEmailModalCancel = () => {
    setIsEmailModalVisible(false);
  };
  
  // 提交验证码
  const handleVerifyModalOk = () => {
    emailForm.validateFields().then(values => {
      // 这里应该是验证码验证的API调用
      // 模拟成功
      setCurrentEmail(newEmail);
      setIsVerifyModalVisible(false);
      message.success('邮箱更换成功！');
    }).catch(errorInfo => {
      console.log('验证码验证失败:', errorInfo);
    });
  };
  
  // 取消验证码验证
  const handleVerifyModalCancel = () => {
    setIsVerifyModalVisible(false);
  };
  
  return (
    <>
      <Card bordered={false}>
        <Row gutter={16} align="middle" justify="space-between">
          <Col>
            <Space direction="vertical" size={4}>
              <Text type="secondary">账号管理</Text>
              <Title level={4} style={{ margin: 0 }}>账号设置</Title>
            </Space>
          </Col>
        </Row>
      </Card>
      
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card 
            title={
              <Space>
                <SafetyOutlined />
                安全设置
              </Space>
            }
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                mfa: true,
                passwordReset: '90',
                loginNotify: true,
                sessionTimeout: '30'
              }}
              onFinish={handleSubmit}
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="mfa"
                    label="双因素认证"
                    valuePropName="checked"
                    extra="启用后，登录时需要输入手机验证码"
                  >
                    <Switch />
                  </Form.Item>
                  
                  <Form.Item
                    name="passwordReset"
                    label="密码重置周期"
                    extra="定期更换密码有助于提高账号安全性"
                  >
                    <Select>
                      <Option value="30">30天</Option>
                      <Option value="60">60天</Option>
                      <Option value="90">90天</Option>
                      <Option value="180">180天</Option>
                      <Option value="never">永不过期</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="loginNotify"
                    label="登录通知"
                    valuePropName="checked"
                    extra="当账号在新设备登录时发送通知"
                  >
                    <Switch />
                  </Form.Item>
                  
                  <Form.Item
                    name="sessionTimeout"
                    label="会话超时时间"
                    extra="设置无操作自动退出系统的时间"
                  >
                    <Select>
                      <Option value="15">15分钟</Option>
                      <Option value="30">30分钟</Option>
                      <Option value="60">60分钟</Option>
                      <Option value="120">120分钟</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Divider />
              
              <div style={{ marginBottom: 16 }}>
                <Title level={5}><MailOutlined /> 关联邮箱</Title>
                <Row gutter={16}>
                  <Col flex="auto">
                    <Paragraph>{currentEmail}</Paragraph>
                    <Text type="success"><CheckCircleOutlined /> 已验证</Text>
                  </Col>
                  <Col>
                    <Button size="small" onClick={showEmailModal}>更换邮箱</Button>
                  </Col>
                </Row>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <Title level={5}><MobileOutlined /> 关联手机</Title>
                <Row gutter={16}>
                  <Col flex="auto">
                    <Paragraph>138****5678</Paragraph>
                    <Text type="success"><CheckCircleOutlined /> 已验证</Text>
                  </Col>
                  <Col>
                    <Button size="small">更换手机</Button>
                  </Col>
                </Row>
              </div>
              
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                >
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card 
            title={
              <Space>
                <NotificationOutlined />
                通知设置
              </Space>
            }
          >
            <Form
              layout="vertical"
              initialValues={{
                systemNotifications: true,
                projectNotifications: true,
                reportNotifications: true,
                taskNotifications: true,
                emailNotifications: ['system', 'project'],
                smsNotifications: []
              }}
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="systemNotifications"
                    label="系统通知"
                    valuePropName="checked"
                    extra="系统更新、维护信息等"
                  >
                    <Switch />
                  </Form.Item>
                  
                  <Form.Item
                    name="projectNotifications"
                    label="项目通知"
                    valuePropName="checked"
                    extra="项目进度、截止日期提醒等"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="reportNotifications"
                    label="报告通知"
                    valuePropName="checked"
                    extra="报告更新、审核结果等"
                  >
                    <Switch />
                  </Form.Item>
                  
                  <Form.Item
                    name="taskNotifications"
                    label="任务通知"
                    valuePropName="checked"
                    extra="任务分配、任务进度更新等"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              
              <Divider />
              
              <Form.Item
                name="emailNotifications"
                label="邮件通知"
                extra="选择需要通过邮件接收的通知类型"
              >
                <Select mode="multiple" placeholder="请选择邮件通知类型">
                  <Option value="system">系统通知</Option>
                  <Option value="project">项目通知</Option>
                  <Option value="report">报告通知</Option>
                  <Option value="task">任务通知</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="smsNotifications"
                label="短信通知"
                extra="选择需要通过短信接收的通知类型（建议只接收重要通知）"
              >
                <Select mode="multiple" placeholder="请选择短信通知类型">
                  <Option value="system">系统通知</Option>
                  <Option value="project">项目通知</Option>
                  <Option value="report">报告通知</Option>
                  <Option value="task">任务通知</Option>
                </Select>
              </Form.Item>
              
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                >
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card 
            title={
              <Space>
                <UserSwitchOutlined />
                登录记录
              </Space>
            }
          >
            <Alert
              message="安全提示"
              description="如果您发现可疑登录记录，请立即更改密码并联系系统管理员。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <List
              itemLayout="horizontal"
              dataSource={[
                {
                  id: '1',
                  time: '2023-03-30 10:15:32',
                  ip: '192.168.1.1',
                  location: '浙江省杭州市',
                  device: 'Chrome 98.0.4758.102 / Windows 10',
                  status: 'success'
                },
                {
                  id: '2',
                  time: '2023-03-28 14:23:45',
                  ip: '192.168.1.1',
                  location: '浙江省杭州市',
                  device: 'Chrome 98.0.4758.102 / Windows 10',
                  status: 'success'
                },
                {
                  id: '3',
                  time: '2023-03-26 09:05:18',
                  ip: '114.88.123.45',
                  location: '上海市',
                  device: 'Safari 15.4 / macOS',
                  status: 'failed'
                },
                {
                  id: '4',
                  time: '2023-03-25 16:47:52',
                  ip: '192.168.1.1',
                  location: '浙江省杭州市',
                  device: 'Chrome 98.0.4758.102 / Windows 10',
                  status: 'success'
                }
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text>{item.time}</Text>
                        {item.status === 'success' ? (
                          <Text type="success">
                            <CheckCircleOutlined /> 登录成功
                          </Text>
                        ) : (
                          <Text type="danger">
                            <CloseCircleOutlined /> 登录失败
                          </Text>
                        )}
                      </Space>
                    }
                    description={
                      <>
                        <div>IP地址: {item.ip} | 地点: {item.location}</div>
                        <div>设备信息: {item.device}</div>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
      
      {/* 更换邮箱弹窗 */}
      <Modal
        title="更换关联邮箱"
        open={isEmailModalVisible}
        onOk={handleEmailModalOk}
        onCancel={handleEmailModalCancel}
        okText="下一步"
        cancelText="取消"
      >
        <Alert
          message="更换邮箱提示"
          description="更换邮箱后，新邮箱将用于接收系统通知和重置密码等操作。请确保新邮箱真实有效。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form
          form={emailForm}
          layout="vertical"
        >
          <Form.Item
            name="newEmail"
            label="新邮箱地址"
            rules={[
              { required: true, message: '请输入新邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="请输入新邮箱地址" />
          </Form.Item>
          <Form.Item
            name="password"
            label="当前密码"
            rules={[
              { required: true, message: '请输入当前密码以验证身份' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入当前密码" />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 验证码弹窗 */}
      <Modal
        title="验证新邮箱"
        open={isVerifyModalVisible}
        onOk={handleVerifyModalOk}
        onCancel={handleVerifyModalCancel}
        okText="确认更换"
        cancelText="取消"
      >
        <Alert
          message="验证码已发送"
          description={`我们已向 ${newEmail} 发送了验证码，请查收邮件并在下方输入验证码完成邮箱更换。`}
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form
          form={emailForm}
          layout="vertical"
        >
          <Form.Item
            name="verificationCode"
            label="验证码"
            rules={[
              { required: true, message: '请输入验证码' },
              { len: 6, message: '验证码为6位数字' }
            ]}
          >
            <Input 
              maxLength={6}
              placeholder="请输入6位验证码" 
            />
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'right' }}>
          <Button type="link">重新发送验证码</Button>
        </div>
      </Modal>
    </>
  );
};

AccountSettingsPage.getLayout = (page) => {
  return (
    <AppLayout>
      {page}
    </AppLayout>
  );
};

export default AccountSettingsPage; 