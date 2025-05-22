import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Switch, Card, Row, Col, message, Steps, Divider, Typography, Space, Radio } from 'antd';
import { FileTextOutlined, ProjectOutlined, TeamOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import AppLayout from '@/components/Layout';
import axios from 'axios';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { NextPage } from 'next';
import dynamic from 'next/dynamic';

// 动态导入富文本编辑器，避免服务端渲染问题
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

// 定义带有getLayout的NextPage类型
type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactNode) => ReactNode
}

const NewReport: NextPageWithLayout = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [reportContent, setReportContent] = useState('');
  const [selectedModelType, setSelectedModelType] = useState('deepseek.r1');

  // 步骤定义
  const formSteps = [
    { title: '基本信息', icon: <FileTextOutlined /> },
    { title: '报告内容', icon: <ProjectOutlined /> },
    { title: '设置与提交', icon: <TeamOutlined /> },
  ];

  // AI模型选项
  const modelOptions = [
    { label: 'Deepseek R1', value: 'deepseek.r1' },
    { label: 'Deepseek V3', value: 'deepseek.v3' },
  ];

  // 加载项目和用户数据
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('/api/projects?limit=50');
        if (response.data.success) {
          setProjects(response.data.data);
        }
      } catch (error) {
        console.error('获取项目列表失败:', error);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/users?limit=50');
        if (response.data.success) {
          setUsers(response.data.data);
        }
      } catch (error) {
        console.error('获取用户列表失败:', error);
      }
    };

    const fetchTemplates = async () => {
      try {
        const response = await axios.get('/api/reports/templates');
        if (response.data.success) {
          setTemplates(response.data.data);
        }
      } catch (error) {
        console.error('获取报告模板失败:', error);
      }
    };

    fetchProjects();
    fetchUsers();
    fetchTemplates();
  }, []);

  // 下一步
  const onNextStep = async () => {
    try {
      // 验证当前步骤表单
      await form.validateFields(getFieldsForCurrentStep());
      setCurrentStep(currentStep + 1);
    } catch (error) {
      // 验证失败，表单会自动显示错误信息
      console.error('表单验证失败:', error);
    }
  };

  // 上一步
  const onPrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // 获取当前步骤需要验证的字段
  const getFieldsForCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return ['title', 'project', 'reportType', 'description'];
      case 1:
        return ['content'];
      case 2:
        return ['reviewers'];
      default:
        return [];
    }
  };

  // AI生成报告内容
  const generateReportContent = async () => {
    try {
      const values = form.getFieldsValue(['project', 'reportType', 'description']);
      
      if (!values.project || !values.reportType || !values.description) {
        message.warning('请先填写项目、报告类型和描述信息');
        return;
      }
      
      setLoading(true);
      message.loading('AI正在生成报告内容，请稍候...', 0);
      
      const response = await axios.post('/api/reports/generate', {
        ...values,
        modelType: selectedModelType
      });
      
      message.destroy();
      
      if (response.data.success) {
        const generatedContent = response.data.data.content;
        setReportContent(generatedContent);
        form.setFieldsValue({ content: generatedContent });
        message.success('报告内容已生成');
      }
    } catch (error) {
      console.error('生成报告内容失败:', error);
      message.error('生成报告内容失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 提交表单
  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      
      const reportData = {
        ...values,
        content: reportContent,
      };
      
      const response = await axios.post('/api/reports', reportData);
      
      if (response.data.success) {
        message.success('报告创建成功！');
        router.push(`/report/${response.data.data._id}`);
      }
    } catch (error) {
      console.error('创建报告失败:', error);
      message.error('创建报告失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 保存草稿
  const saveDraft = async () => {
    try {
      const values = form.getFieldsValue();
      
      if (!values.title) {
        message.warning('请至少填写报告标题');
        return;
      }
      
      setLoading(true);
      
      const reportData = {
        ...values,
        content: reportContent,
        status: '草稿',
      };
      
      const response = await axios.post('/api/reports', reportData);
      
      if (response.data.success) {
        message.success('草稿已保存');
        router.push(`/report/${response.data.data._id}`);
      }
    } catch (error) {
      console.error('保存草稿失败:', error);
      message.error('保存草稿失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 应用模板
  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t._id === templateId);
    if (template) {
      setReportContent(template.content);
      form.setFieldsValue({ content: template.content });
      message.success('已应用模板');
    }
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item
                  name="title"
                  label="报告标题"
                  rules={[{ required: true, message: '请输入报告标题' }]}
                >
                  <Input placeholder="请输入报告标题" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="project"
                  label="关联项目"
                  rules={[{ required: true, message: '请选择关联项目' }]}
                >
                  <Select placeholder="请选择关联项目">
                    {projects.map(project => (
                      <Option key={project._id} value={project._id}>{project.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="reportType"
                  label="报告类型"
                  rules={[{ required: true, message: '请选择报告类型' }]}
                >
                  <Select placeholder="请选择报告类型">
                    <Option value="审计报告">审计报告</Option>
                    <Option value="税务报告">税务报告</Option>
                    <Option value="内控报告">内控报告</Option>
                    <Option value="尽职调查报告">尽职调查报告</Option>
                    <Option value="评估报告">评估报告</Option>
                    <Option value="咨询报告">咨询报告</Option>
                    <Option value="其他">其他</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="报告概述"
              rules={[{ required: true, message: '请输入报告概述' }]}
            >
              <TextArea rows={4} placeholder="请输入报告概述" />
            </Form.Item>

            <Row gutter={24}>
              <Col span={24}>
                <Form.Item
                  name="template"
                  label="选择模板"
                >
                  <Select 
                    placeholder="选择报告模板（可选）" 
                    allowClear
                    onChange={(value) => {
                      if (value) applyTemplate(value);
                    }}
                  >
                    {templates.map(template => (
                      <Option key={template._id} value={template._id}>{template.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </>
        );
      case 1:
        return (
          <>
            <Row gutter={24} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Title level={5}>AI辅助</Title>
                <Paragraph type="secondary">选择AI模型，一键生成报告内容</Paragraph>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Space>
                  <Radio.Group 
                    options={modelOptions} 
                    value={selectedModelType}
                    onChange={e => setSelectedModelType(e.target.value)}
                    optionType="button"
                  />
                  <Button type="primary" onClick={generateReportContent} loading={loading}>
                    生成报告内容
                  </Button>
                </Space>
              </Col>
            </Row>

            <Form.Item
              name="content"
              label="报告内容"
              rules={[{ required: true, message: '请输入报告内容' }]}
            >
              <ReactQuill 
                theme="snow" 
                value={reportContent} 
                onChange={setReportContent}
                style={{ height: 400, marginBottom: 50 }}
              />
            </Form.Item>
          </>
        );
      case 2:
        return (
          <>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="reviewers"
                  label="审核人"
                  rules={[{ required: true, message: '请选择审核人' }]}
                >
                  <Select mode="multiple" placeholder="请选择审核人">
                    {users.map(user => (
                      <Option key={user._id} value={user._id}>{user.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="tags"
                  label="标签"
                >
                  <Select mode="tags" placeholder="添加标签">
                    <Option value="重要">重要</Option>
                    <Option value="紧急">紧急</Option>
                    <Option value="年度">年度</Option>
                    <Option value="季度">季度</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="isPrivate"
                  label="私密报告"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="notifyMembers"
                  label="通知项目成员"
                  valuePropName="checked"
                  initialValue={true}
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="remarks"
              label="备注"
            >
              <TextArea rows={4} placeholder="其他说明（可选）" />
            </Form.Item>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <Card>
        <Title level={2}>新建报告</Title>
        <Paragraph type="secondary">填写以下信息来创建一个新报告</Paragraph>

        <Steps current={currentStep} style={{ marginBottom: 40 }}>
          {formSteps.map(step => (
            <Step key={step.title} title={step.title} icon={step.icon} />
          ))}
        </Steps>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            isPrivate: false,
            notifyMembers: true
          }}
        >
          {renderStepContent()}

          <Divider />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            {currentStep > 0 && (
              <Button onClick={onPrevStep}>
                上一步
              </Button>
            )}
            
            <div style={{ marginLeft: 'auto' }}>
              <Space>
                <Button icon={<SaveOutlined />} onClick={saveDraft}>
                  保存草稿
                </Button>
                
                {currentStep < formSteps.length - 1 ? (
                  <Button type="primary" onClick={onNextStep}>
                    下一步
                  </Button>
                ) : (
                  <Button type="primary" icon={<SendOutlined />} loading={loading} htmlType="submit">
                    提交报告
                  </Button>
                )}
              </Space>
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
};

NewReport.getLayout = (page: ReactNode) => {
  return (
    <AppLayout>
      {page}
    </AppLayout>
  );
};

export default NewReport; 