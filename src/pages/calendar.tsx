import React, { useState } from 'react';
import { Calendar, Badge, Card, Select, Row, Col, Typography, Button, Modal, Form, Input, DatePicker, TimePicker, message } from 'antd';
import { PlusOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { NextPage } from 'next';
import type { BadgeProps } from 'antd';
import type { Moment } from 'moment';
import moment from 'moment';
import 'moment/locale/zh-cn';
import AppLayout from '@/components/Layout';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

// 定义事件类型
type EventItem = {
  id: number;
  title: string;
  type: string;
  content?: string;
  date: string;
  time?: string;
  status?: string;
};

// 颜色映射
const typeColorMap: Record<string, string> = {
  '会议': 'blue',
  '截止日期': 'red',
  '任务': 'orange',
  '面谈': 'purple',
  '提醒': 'cyan',
};

// 示例日程数据
const initialEvents: EventItem[] = [
  {
    id: 1,
    title: '项目启动会议',
    type: '会议',
    content: '讨论新项目启动事项和分工',
    date: '2024-06-15',
    time: '09:30-11:00',
    status: '未开始'
  },
  {
    id: 2,
    title: '客户财务报表截止',
    type: '截止日期',
    content: '提交审计报告初稿',
    date: '2024-06-16',
    status: '未完成'
  },
  {
    id: 3,
    title: '项目进度汇报',
    type: '任务',
    content: '准备本月项目进度汇报材料',
    date: '2024-06-18',
    time: '14:00-15:00',
    status: '未开始'
  },
  {
    id: 4,
    title: '与李总面谈',
    type: '面谈',
    content: '讨论项目预算调整',
    date: '2024-06-20',
    time: '10:00-11:30',
    status: '未开始'
  },
  {
    id: 5,
    title: '内部培训',
    type: '提醒',
    content: '新税务法规培训',
    date: '2024-06-21',
    time: '15:30-17:00',
    status: '未开始'
  }
];

const CalendarPage: NextPage = () => {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [currentDate, setCurrentDate] = useState(moment());
  const [selectedDate, setSelectedDate] = useState<Moment | null>(null);

  // 根据日期获取事件列表
  const getListData = (value: Moment) => {
    const dateString = value.format('YYYY-MM-DD');
    return events.filter(event => event.date === dateString);
  };

  // 日期单元格渲染
  const dateCellRender = (value: Moment) => {
    const listData = getListData(value);
    return (
      <ul className="events" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {listData.map(item => (
          <li key={item.id} style={{ marginBottom: '3px' }}>
            <Badge
              status={typeColorMap[item.type] as BadgeProps['status']}
              text={<span style={{ fontSize: '12px' }}>{item.title}</span>}
            />
          </li>
        ))}
      </ul>
    );
  };

  // 打开新建事件模态框
  const showModal = (date?: Moment) => {
    if (date) {
      setSelectedDate(date);
      form.setFieldsValue({ date: date });
    } else {
      setSelectedDate(currentDate);
      form.setFieldsValue({ date: currentDate });
    }
    setIsModalVisible(true);
  };

  // 处理事件提交
  const handleOk = () => {
    form.validateFields().then(values => {
      const newEvent: EventItem = {
        id: Date.now(),
        title: values.title,
        type: values.type,
        content: values.content,
        date: values.date.format('YYYY-MM-DD'),
        time: values.time ? `${values.time[0].format('HH:mm')}-${values.time[1].format('HH:mm')}` : undefined,
        status: '未开始'
      };

      setEvents([...events, newEvent]);
      message.success('日程添加成功');
      form.resetFields();
      setIsModalVisible(false);
    }).catch(info => {
      console.log('表单验证失败:', info);
    });
  };

  // 处理模态框取消
  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
  };

  // 日历选择回调
  const onSelect = (date: Moment) => {
    setCurrentDate(date);
    showModal(date);
  };

  // 日历面板变化回调
  const onPanelChange = (date: Moment) => {
    setCurrentDate(date);
  };

  return (
    <div className="calendar-page">
      <Card bordered={false}>
        <Row gutter={16} align="middle" justify="space-between" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>我的日程</Title>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
              添加日程
            </Button>
          </Col>
        </Row>

        <Calendar 
          dateCellRender={dateCellRender} 
          onSelect={onSelect}
          onPanelChange={onPanelChange}
          mode="month"
        />
      </Card>

      <Modal
        title="添加日程"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          name="event_form"
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入日程标题' }]}
          >
            <Input placeholder="请输入日程标题" />
          </Form.Item>

          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择日程类型' }]}
          >
            <Select placeholder="请选择日程类型">
              <Option value="会议">会议</Option>
              <Option value="截止日期">截止日期</Option>
              <Option value="任务">任务</Option>
              <Option value="面谈">面谈</Option>
              <Option value="提醒">提醒</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="time"
                label="时间范围"
              >
                <TimePicker.RangePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="content"
            label="内容描述"
          >
            <TextArea rows={4} placeholder="请输入日程详细内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

CalendarPage.getLayout = (page: React.ReactElement) => {
  return (
    <AppLayout>
      {page}
    </AppLayout>
  );
};

export default CalendarPage; 