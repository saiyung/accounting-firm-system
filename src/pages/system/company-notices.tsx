import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Typography,
  Divider,
  message,
  Popconfirm,
  Badge,
  DatePicker
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ExclamationCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { useCompanyNotices, NoticeType, typeMap } from '@/context/CompanyNoticeContext';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CompanyNoticesPage: NextPage = () => {
  // 使用公司通知上下文
  const { 
    notices, 
    addNotice, 
    updateNotice, 
    deleteNotice, 
    resetAllToUnread 
  } = useCompanyNotices();

  // 表单状态
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNotice, setEditingNotice] = useState<{
    id: number;
    title: string;
    content: string;
    date: string;
    type: NoticeType;
    read: boolean;
  } | null>(null);

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: NoticeType) => (
        <Badge 
          color={typeMap[type].color} 
          text={typeMap[type].text} 
        />
      ),
      filters: [
        { text: '重要', value: 'important' },
        { text: '更新', value: 'update' },
        { text: '通知', value: 'notice' },
        { text: '活动', value: 'event' }
      ],
      onFilter: (value: string, record: any) => record.type === value
    },
    {
      title: '发布日期',
      dataIndex: 'date',
      key: 'date',
      sorter: (a: any, b: any) => {
        return moment(a.date).unix() - moment(b.date).unix();
      }
    },
    {
      title: '状态',
      dataIndex: 'read',
      key: 'read',
      render: (read: boolean) => (
        <Badge 
          status={read ? 'default' : 'processing'} 
          text={read ? '已读' : '未读'} 
        />
      ),
      filters: [
        { text: '未读', value: false },
        { text: '已读', value: true }
      ],
      onFilter: (value: boolean, record: any) => record.read === value
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条通知吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 处理添加新通知
  const handleAdd = () => {
    setEditingNotice(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 处理编辑通知
  const handleEdit = (notice: any) => {
    setEditingNotice(notice);
    form.setFieldsValue({
      ...notice,
      date: moment(notice.date)
    });
    setModalVisible(true);
  };

  // 处理删除通知
  const handleDelete = (id: number) => {
    deleteNotice(id);
    message.success('通知已删除');
  };

  // 处理模态框确认
  const handleModalOk = () => {
    form.validateFields().then(values => {
      const formattedValues = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        read: false
      };

      if (editingNotice) {
        // 更新现有通知
        updateNotice({
          ...formattedValues,
          id: editingNotice.id,
          read: editingNotice.read
        });
        message.success('通知已更新');
      } else {
        // 添加新通知
        addNotice(formattedValues);
        message.success('通知已添加');
      }

      setModalVisible(false);
    });
  };

  // 处理模态框取消
  const handleModalCancel = () => {
    setModalVisible(false);
  };

  // 重置所有通知为未读状态
  const handleResetRead = () => {
    Modal.confirm({
      title: '确认操作',
      icon: <ExclamationCircleOutlined />,
      content: '确定要将所有通知重置为未读状态吗？这将影响所有用户。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        resetAllToUnread();
        message.success('所有通知已重置为未读状态');
      }
    });
  };

  return (
    <>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <Title level={4}>公司通知管理</Title>
            <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
              管理向所有员工发布的公司通知，包括重要公告、更新、一般通知和活动通知。
            </Text>
          </div>
          <Space>
            <Button danger onClick={handleResetRead}>
              全部标为未读
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增通知
            </Button>
          </Space>
        </div>
        
        <Divider style={{ margin: '16px 0' }} />

        <Table 
          columns={columns} 
          dataSource={notices} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ margin: 0, padding: '12px 24px', background: '#fafafa' }}>
                <Text strong>通知内容：</Text>
                <div style={{ marginTop: 8, whiteSpace: 'pre-line' }}>{record.content}</div>
              </div>
            ),
          }}
        />
      </Card>

      {/* 添加/编辑通知的模态框 */}
      <Modal
        title={editingNotice ? '编辑通知' : '添加新通知'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          name="notice_form"
        >
          <Form.Item
            name="title"
            label="通知标题"
            rules={[{ required: true, message: '请输入通知标题' }]}
          >
            <Input placeholder="请输入通知标题" />
          </Form.Item>

          <Form.Item
            name="type"
            label="通知类型"
            rules={[{ required: true, message: '请选择通知类型' }]}
          >
            <Select placeholder="请选择通知类型">
              <Option value="important">重要</Option>
              <Option value="update">更新</Option>
              <Option value="notice">通知</Option>
              <Option value="event">活动</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="date"
            label="发布日期"
            rules={[{ required: true, message: '请选择发布日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="content"
            label="通知内容"
            rules={[{ required: true, message: '请输入通知内容' }]}
          >
            <TextArea rows={6} placeholder="请输入通知内容" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CompanyNoticesPage; 