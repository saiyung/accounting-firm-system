import React, { useState } from 'react';
import { Form, Input, Button, Select, DatePicker, InputNumber, Card, Row, Col, message, Steps, Divider, Typography, Space } from 'antd';
import { UserOutlined, TeamOutlined, FileTextOutlined, CalendarOutlined, DollarOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import AppLayout from '@/components/Layout';
import axios from 'axios';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { NextPage } from 'next';
import moment from 'moment';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

// 定义带有getLayout的NextPage类型
type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactNode) => ReactNode
}

const NewProject: NextPageWithLayout = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // 分步骤表单内容
  const formSteps = [
    { title: '基本信息', icon: <FileTextOutlined /> },
    { title: '团队与日期', icon: <TeamOutlined /> },
    { title: '预算与合同', icon: <DollarOutlined /> },
  ];

  // 项目类型选项
  const projectTypes = [
    { value: '审计', label: '审计' },
    { value: '税务', label: '税务' },
    { value: '内控', label: '内控' },
    { value: '尽调', label: '尽调' },
    { value: '评估', label: '评估' },
    { value: '咨询', label: '咨询' },
    { value: '其他', label: '其他' },
  ];

  // 优先级选项
  const priorityOptions = [
    { value: '低', label: '低' },
    { value: '中', label: '中' },
    { value: '高', label: '高' },
    { value: '紧急', label: '紧急' },
  ];

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
        return ['name', 'client', 'type', 'description', 'priority'];
      case 1:
        return ['manager', 'startDate', 'endDate'];
      case 2:
        return ['hours', 'budget', 'contractNumber'];
      default:
        return [];
    }
  };

  // 提交表单
  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const formattedValues = {
        ...values,
        startDate: values.startDate?.format('YYYY-MM-DD'),
        endDate: values.endDate?.format('YYYY-MM-DD'),
        contractDate: values.contractDate?.format('YYYY-MM-DD'),
        // 格式化其他需要的字段
      };
      
      const response = await axios.post('/api/projects', formattedValues);
      
      if (response.data.success) {
        message.success('项目创建成功！');
        router.push(`/project/${response.data.data._id}`);
      }
    } catch (error) {
      console.error('创建项目失败:', error);
      message.error('创建项目失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 保存草稿
  const saveDraft = async () => {
    try {
      const values = await form.validateFields();
      message.success('草稿已保存');
      // 实际应用中可以调用保存草稿的接口
    } catch (error) {
      message.error('保存草稿失败');
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
                  name="name"
                  label="项目名称"
                  rules={[{ required: true, message: '请输入项目名称' }]}
                >
                  <Input placeholder="请输入项目名称" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="client"
                  label="客户"
                  rules={[{ required: true, message: '请选择客户' }]}
                >
                  <Select placeholder="请选择客户">
                    <Option value="client1">客户A</Option>
                    <Option value="client2">客户B</Option>
                    <Option value="client3">客户C</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="type"
                  label="项目类型"
                  rules={[{ required: true, message: '请选择项目类型' }]}
                >
                  <Select placeholder="请选择项目类型">
                    {projectTypes.map(type => (
                      <Option key={type.value} value={type.value}>{type.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="项目描述"
              rules={[{ required: true, message: '请输入项目描述' }]}
            >
              <TextArea rows={4} placeholder="请输入项目描述" />
            </Form.Item>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="priority"
                  label="优先级"
                  rules={[{ required: true, message: '请选择优先级' }]}
                >
                  <Select placeholder="请选择优先级">
                    {priorityOptions.map(priority => (
                      <Option key={priority.value} value={priority.value}>{priority.label}</Option>
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
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="manager"
                  label="项目经理"
                  rules={[{ required: true, message: '请选择项目经理' }]}
                >
                  <Select placeholder="请选择项目经理">
                    <Option value="manager1">张经理</Option>
                    <Option value="manager2">李经理</Option>
                    <Option value="manager3">王经理</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="team"
                  label="项目团队"
                >
                  <Select mode="multiple" placeholder="请选择团队成员">
                    <Option value="member1">成员1</Option>
                    <Option value="member2">成员2</Option>
                    <Option value="member3">成员3</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="startDate"
                  label="计划开始日期"
                  rules={[{ required: true, message: '请选择计划开始日期' }]}
                >
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="endDate"
                  label="计划结束日期"
                  rules={[{ required: true, message: '请选择计划结束日期' }]}
                >
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="phases"
              label="项目阶段"
            >
              <Input placeholder="项目阶段设置（可选）" />
            </Form.Item>
          </>
        );
      case 2:
        return (
          <>
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="hours"
                  label="估计工时"
                  rules={[{ required: true, message: '请输入估计工时' }]}
                >
                  <InputNumber min={1} style={{ width: '100%' }} placeholder="小时数" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="budget"
                  label="项目预算"
                  rules={[{ required: true, message: '请输入项目预算' }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value!.replace(/\¥\s?|(,*)/g, '')}
                    placeholder="项目预算"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="contractNumber"
                  label="合同编号"
                >
                  <Input placeholder="合同编号（可选）" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="contractDate"
                  label="合同日期"
                >
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="contractInfo"
              label="合同信息"
            >
              <TextArea rows={4} placeholder="其他合同相关信息（可选）" />
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
        <Title level={2}>新建项目</Title>
        <Paragraph type="secondary">填写以下信息来创建一个新项目</Paragraph>

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
            priority: '中',
            startDate: moment(),
            endDate: moment().add(30, 'days'),
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
                    创建项目
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

NewProject.getLayout = (page: ReactNode) => {
  return (
    <AppLayout>
      {page}
    </AppLayout>
  );
};

export default NewProject; 