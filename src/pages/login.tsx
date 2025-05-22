import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Tabs } from 'antd';
import { MailOutlined, SafetyOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

const { Title } = Typography;
const { TabPane } = Tabs;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const router = useRouter();

  // 发送验证码（前端模拟）
  const sendCode = () => {
    if (!email || !/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      message.error('请输入有效的邮箱地址');
      return;
    }
    setSent(true);
    message.success('验证码已发送到您的邮箱（演示环境，任意6位数字均可通过）');
  };

  // 密码登录
  const handlePasswordLogin = () => {
    if (!email || !/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      message.error('请输入有效的邮箱地址');
      return;
    }
    if (!password) {
      message.error('请输入密码');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      // 模拟校验（演示环境，任意邮箱+任意密码都通过）
      localStorage.setItem('user', JSON.stringify({
        email,
        name: email.split('@')[0],
        role: 'employee',
        department: '审计部',
        id: 'U' + Math.floor(Math.random() * 10000)
      }));
      message.success('登录成功');
      router.push('/');
    }, 800);
  };

  // 验证码登录/注册
  const handleCodeLogin = () => {
    if (!email || !/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      message.error('请输入有效的邮箱地址');
      return;
    }
    if (!code || code.length !== 6) {
      message.error('请输入6位验证码');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      // 模拟登录/注册成功
      localStorage.setItem('user', JSON.stringify({
        email,
        name: email.split('@')[0],
        role: 'employee',
        department: '审计部',
        id: 'U' + Math.floor(Math.random() * 10000)
      }));
      message.success('登录成功');
      router.push('/');
    }, 800);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f6fa' }}>
      <Card style={{ width: 400, boxShadow: '0 2px 16px #eee' }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>登录到会计师事务所系统</Title>
        <Tabs activeKey={tab} onChange={setTab} centered>
          <TabPane tab="账号密码登录" key="password">
            <Form layout="vertical" onFinish={handlePasswordLogin}>
              <Form.Item label="邮箱" required>
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="请输入邮箱" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </Form.Item>
              <Form.Item label="密码" required>
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="请输入密码" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading}>
                  登录
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
          <TabPane tab="验证码登录/注册" key="code">
            <Form layout="vertical" onFinish={handleCodeLogin}>
              <Form.Item label="邮箱" required>
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="请输入邮箱" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </Form.Item>
              <Form.Item label="验证码" required>
                <Input.Group compact>
                  <Input 
                    prefix={<SafetyOutlined />} 
                    placeholder="请输入6位验证码" 
                    maxLength={6}
                    style={{ width: '60%' }}
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    autoComplete="one-time-code"
                  />
                  <Button style={{ width: '38%' }} disabled={sent && !code} onClick={sendCode} type="primary">
                    获取验证码
                  </Button>
                </Input.Group>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading}>
                  登录/注册
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default LoginPage; 