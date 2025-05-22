import React, { useState } from 'react';
import { NextPage } from 'next';
import { Typography, Form, Input, Button, Card, Alert, message, Steps, Result, Row, Col, Space } from 'antd';
import { LockOutlined, KeyOutlined, CheckCircleOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons';
import AppLayout from '@/components/Layout';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;

const PasswordChangePage: NextPage & { getLayout?: (page: React.ReactElement) => React.ReactNode } = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // 提交表单处理
  const handleSubmit = (values: any) => {
    setLoading(true);
    
    // 模拟API请求
    setTimeout(() => {
      console.log('提交的数据:', values);
      setLoading(false);
      setCurrentStep(1);
    }, 1000);
  };
  
  // 验证新密码步骤
  const handleVerify = () => {
    setLoading(true);
    
    // 模拟API请求
    setTimeout(() => {
      setLoading(false);
      setCurrentStep(2);
    }, 1000);
  };
  
  // 重置状态
  const handleReset = () => {
    form.resetFields();
    setCurrentStep(0);
  };
  
  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <Alert
              message="密码安全提示"
              description="为保障账户安全，请设置包含大小写字母、数字和特殊字符的强密码，且不要使用与其他网站相同的密码。"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Form.Item
                name="currentPassword"
                label="当前密码"
                rules={[
                  { required: true, message: '请输入当前密码' },
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="请输入当前密码" 
                />
              </Form.Item>
              
              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 8, message: '密码长度至少8位' },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/,
                    message: '密码必须包含大小写字母、数字和特殊字符'
                  }
                ]}
                tooltip="密码长度至少8位，且必须包含大小写字母、数字和特殊字符"
              >
                <Input.Password 
                  prefix={<KeyOutlined />} 
                  placeholder="请输入新密码" 
                />
              </Form.Item>
              
              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<KeyOutlined />} 
                  placeholder="请再次输入新密码" 
                />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  style={{ marginRight: 16 }}
                >
                  下一步
                </Button>
                <Button onClick={handleReset}>重置</Button>
              </Form.Item>
            </Form>
          </Card>
        );
      case 1:
        return (
          <Card>
            <Alert
              message="验证身份"
              description="为确保是您本人操作，我们向您的注册邮箱和手机发送了验证码，请输入验证码完成修改密码。"
              type="warning"
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            <Form
              layout="vertical"
              onFinish={handleVerify}
            >
              <Form.Item
                name="emailCode"
                label={
                  <span>
                    <MailOutlined style={{ marginRight: 8 }} />
                    邮箱验证码
                  </span>
                }
                extra="验证码已发送至 zh****ng@example.com"
                rules={[
                  { required: true, message: '请输入邮箱验证码' },
                  { len: 6, message: '验证码应为6位' }
                ]}
              >
                <Input 
                  maxLength={6}
                  placeholder="请输入6位邮箱验证码" 
                />
              </Form.Item>
              
              <Form.Item
                name="mobileCode"
                label={
                  <span>
                    <SafetyOutlined style={{ marginRight: 8 }} />
                    手机验证码
                  </span>
                }
                extra="验证码已发送至 138****5678"
                rules={[
                  { required: true, message: '请输入手机验证码' },
                  { len: 6, message: '验证码应为6位' }
                ]}
              >
                <Input 
                  maxLength={6}
                  placeholder="请输入6位手机验证码" 
                />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  style={{ marginRight: 16 }}
                >
                  提交验证
                </Button>
                <Button onClick={() => setCurrentStep(0)}>返回上一步</Button>
              </Form.Item>
              
              <Text type="secondary">
                没有收到验证码？
                <Button type="link" size="small">重新发送</Button>
              </Text>
            </Form>
          </Card>
        );
      case 2:
        return (
          <Card>
            <Result
              status="success"
              title="密码修改成功！"
              subTitle="您的账号安全性已提升，新密码将在下次登录时生效。"
              extra={[
                <Button 
                  type="primary" 
                  key="home" 
                  onClick={() => window.location.href = '/'}
                >
                  返回首页
                </Button>,
                <Button 
                  key="reset" 
                  onClick={handleReset}
                >
                  修改其他密码
                </Button>,
              ]}
            />
          </Card>
        );
      default:
        return null;
    }
  };
  
  return (
    <>
      <Card bordered={false}>
        <Row gutter={16} align="middle" justify="space-between">
          <Col>
            <Space direction="vertical" size={4}>
              <Text type="secondary">账号管理</Text>
              <Title level={4} style={{ margin: 0 }}>修改密码</Title>
            </Space>
          </Col>
        </Row>
      </Card>
      
      <Card bordered={false}>
        <Steps
          current={currentStep}
          style={{ marginBottom: 40 }}
          responsive={true}
        >
          <Step title="设置新密码" description="输入当前密码和新密码" />
          <Step title="验证身份" description="通过邮箱和手机验证" />
          <Step title="完成" description="密码修改成功" />
        </Steps>
        
        {renderStepContent()}
      </Card>
    </>
  );
};

PasswordChangePage.getLayout = (page: React.ReactElement) => {
  return (
    <AppLayout>
      {page}
    </AppLayout>
  );
};

export default PasswordChangePage; 