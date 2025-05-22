import React, { useState, useEffect } from 'react';
import { Button, Card, Space, Table, Tag, Typography, Input, Select, DatePicker, Modal, Form, Tabs, Alert, message, Descriptions, Steps, Timeline, Row, Col } from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  FileExcelOutlined, 
  FilterOutlined,
  ExclamationCircleOutlined,
  ExportOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import moment from 'moment';
import AppLayout from '@/components/Layout';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Step } = Steps;

// 类型定义
interface ProjectType {
  id: string;
  name: string;
  client: string;
  manager: string;
  stage: string;
  startDate: string;
  deadline: string;
  status: string;
  risk: string;
  key?: string;
}

const ProjectManagement: NextPage & { getLayout?: (page: React.ReactElement) => React.ReactNode } = () => {
  const router = useRouter();
  const { filter } = router.query;
  
  // 模拟项目数据
  const projectData = [
    {
      id: 'P20250331001',
      name: '杭州智联科技年度审计',
      client: '智联科技有限公司',
      manager: '张明',
      stage: '风险评估',
      startDate: '2025-03-15',
      deadline: '2025-04-30',
      status: '进行中',
      risk: '低'
    },
    {
      id: 'P20250327002',
      name: '上海贸易集团税务咨询',
      client: '上海国际贸易集团',
      manager: '李刚',
      stage: '合同签订',
      startDate: '2025-03-20',
      deadline: '2025-05-10',
      status: '进行中',
      risk: '中'
    },
    {
      id: 'P20250320003',
      name: '北京健康医疗上市审计',
      client: '北京健康医疗科技',
      manager: '王琳',
      stage: '客户需求分析',
      startDate: '2025-03-25',
      deadline: '2025-06-30',
      status: '进行中',
      risk: '高'
    },
    {
      id: 'P20250315004',
      name: '广州餐饮集团内控评估',
      client: '广州餐饮集团',
      manager: '赵伟',
      stage: '团队组建',
      startDate: '2025-03-10',
      deadline: '2025-04-20',
      status: '进行中',
      risk: '低'
    },
  ];

  // 状态管理
  const [activeTab, setActiveTab] = useState('all');
  const [filteredProjects, setFilteredProjects] = useState(projectData);
  const [showDeadlineWarning, setShowDeadlineWarning] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectType | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // 根据URL参数设置初始过滤状态
  useEffect(() => {
    if (filter === 'deadline') {
      // 筛选出即将截止的项目（3天内）
      const today = new Date();
      const threeDaysLater = new Date();
      threeDaysLater.setDate(today.getDate() + 3);
      
      const deadlineProjects = projectData.filter(project => {
        const deadline = new Date(project.deadline);
        return deadline >= today && deadline <= threeDaysLater && project.status !== '已完成';
      });
      
      setFilteredProjects(deadlineProjects);
      setShowDeadlineWarning(true);
      setActiveTab('进行中');
    } else {
      setFilteredProjects(projectData);
    }
  }, [filter]);

  // 切换标签页时的处理函数
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    
    if (key === 'all') {
      setFilteredProjects(projectData);
    } else {
      setFilteredProjects(projectData.filter(item => item.status === key));
    }
    
    setShowDeadlineWarning(false);
  };

  // 表格列定义
  const columns = [
    {
      title: '项目编号',
      dataIndex: 'id',
      key: 'id',
      sorter: (a: any, b: any) => a.id.localeCompare(b.id),
    },
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space>
          <Text strong>{text}</Text>
          {new Date(record.deadline) <= new Date() && record.status !== '已完成' && (
            <Tag color="red">已逾期</Tag>
          )}
          {new Date(record.deadline) > new Date() && 
           new Date(record.deadline) <= new Date(new Date().setDate(new Date().getDate() + 3)) && 
           record.status !== '已完成' && (
            <Tag color="orange">即将截止</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '客户',
      dataIndex: 'client',
      key: 'client',
    },
    {
      title: '项目经理',
      dataIndex: 'manager',
      key: 'manager',
    },
    {
      title: '当前阶段',
      dataIndex: 'stage',
      key: 'stage',
      filters: [
        { text: '客户需求分析', value: '客户需求分析' },
        { text: '合规审查', value: '合规审查' },
        { text: '风险评估', value: '风险评估' },
        { text: '合同签订', value: '合同签订' },
        { text: '团队组建', value: '团队组建' },
      ],
      onFilter: (value: any, record: any) => record.stage.indexOf(value) === 0,
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      sorter: (a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
      sorter: (a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'green';
        if (status === '延期') color = 'red';
        if (status === '待启动') color = 'blue';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: '风险等级',
      dataIndex: 'risk',
      key: 'risk',
      render: (risk: string) => {
        let color = 'green';
        if (risk === '中') color = 'orange';
        if (risk === '高') color = 'red';
        return (
          <Tag color={color}>
            {risk === '高' && <ExclamationCircleOutlined style={{ marginRight: 4 }} />}
            {risk}
          </Tag>
        );
      },
      filters: [
        { text: '低', value: '低' },
        { text: '中', value: '中' },
        { text: '高', value: '高' },
      ],
      onFilter: (value: any, record: any) => record.risk === value,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <a onClick={() => handleProjectDetail(record)}>详情</a>
          <a onClick={() => handleProjectEdit(record)}>编辑</a>
          <a onClick={() => handleProjectWorkflow(record)}>流程</a>
        </Space>
      ),
    },
  ];

  // 添加状态控制模态框显示
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isWorkflowModalVisible, setIsWorkflowModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  
  // 处理新建项目按钮点击
  const handleNewProject = () => {
    setIsModalVisible(true);
  };
  
  // 处理模态框确认
  const handleOk = () => {
    form.validateFields().then(values => {
      console.log('新建项目表单数据:', values);
      
      // 从日期范围中获取开始和结束日期
      const startDate = values.dateRange[0].format('YYYY-MM-DD');
      const deadline = values.dateRange[1].format('YYYY-MM-DD');
      
      // 生成新项目ID (简单模拟自增ID)
      const newId = `P${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(projectData.length + 1).padStart(3, '0')}`;
      
      // 创建新项目对象
      const newProject = {
        id: newId,
        name: values.name,
        client: values.client,
        manager: values.manager,
        stage: values.stage,
        startDate: startDate,
        deadline: deadline,
        status: '待启动',
        risk: values.risk,
        progress: 0, // 新项目默认进度为0
        members: [values.manager] // 初始成员包含项目经理
      };
      
      // 将新项目添加到项目列表
      const updatedProjects = [newProject, ...projectData];
      setFilteredProjects(
        activeTab === 'all' ? updatedProjects : 
        updatedProjects.filter(item => item.status === activeTab)
      );
      
      // 更新原始项目数据
      projectData.unshift(newProject);
      
      // 保存更新后的项目数据到本地存储
      try {
        localStorage.setItem('projectData', JSON.stringify(projectData));
        console.log('项目数据已保存到localStorage，包含完整项目信息:', projectData);
      } catch (error) {
        console.error('保存项目数据到localStorage失败:', error);
      }
      
      // 重置表单并关闭模态框
      message.success(`项目 "${values.name}" 创建成功`);
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

  // 处理项目详情
  const handleProjectDetail = (project: any) => {
    setSelectedProject(project);
    setDetailModalVisible(true);
  };
  
  // 处理项目编辑
  const handleProjectEdit = (project: any) => {
    setSelectedProject(project);
    // 设置表单初始值
    editForm.setFieldsValue({
      name: project.name,
      client: project.client,
      manager: project.manager,
      stage: project.stage,
      dateRange: [
        moment(project.startDate),
        moment(project.deadline)
      ],
      status: project.status,
      risk: project.risk
    });
    setIsEditModalVisible(true);
  };
  
  // 处理项目流程
  const handleProjectWorkflow = (project: any) => {
    setSelectedProject(project);
    setIsWorkflowModalVisible(true);
  };
  
  // 确认编辑项目
  const handleEditOk = () => {
    editForm.validateFields().then(values => {
      console.log('编辑项目表单数据:', values);
      
      if (selectedProject) {
        // 更新日期
        const startDate = values.dateRange ? values.dateRange[0].format('YYYY-MM-DD') : selectedProject.startDate;
        const deadline = values.dateRange ? values.dateRange[1].format('YYYY-MM-DD') : selectedProject.deadline;
        
        // 更新项目数据
        const updatedProject = {
          ...selectedProject,
          name: values.name,
          client: values.client,
          manager: values.manager,
          stage: values.stage,
          startDate: startDate,
          deadline: deadline,
          status: values.status,
          risk: values.risk,
          progress: selectedProject.progress || 0, // 保留进度信息
          members: selectedProject.members || [] // 保留成员信息
        };
        
        // 更新列表中的项目
        const updatedProjects = projectData.map(item => 
          item.id === selectedProject.id ? updatedProject : item
        );
        
        // 更新原始数据
        for (let i = 0; i < projectData.length; i++) {
          if (projectData[i].id === selectedProject.id) {
            projectData[i] = updatedProject;
            break;
          }
        }
        
        setFilteredProjects(
          activeTab === 'all' ? updatedProjects : 
          updatedProjects.filter(item => item.status === activeTab)
        );
        
        // 保存更新后的项目数据到本地存储
        try {
          localStorage.setItem('projectData', JSON.stringify(projectData));
          console.log('项目数据已保存到localStorage，包含日期信息:', projectData);
        } catch (error) {
          console.error('保存项目数据到localStorage失败:', error);
        }
        
        message.success('项目信息已更新');
        editForm.resetFields();
        setIsEditModalVisible(false);
      }
    }).catch(info => {
      console.log('表单验证失败:', info);
    });
  };
  
  // 处理各模态框取消
  const handleDetailCancel = () => {
    setDetailModalVisible(false);
  };
  
  const handleEditCancel = () => {
    editForm.resetFields();
    setIsEditModalVisible(false);
  };
  
  const handleWorkflowCancel = () => {
    setIsWorkflowModalVisible(false);
  };

  // 处理项目删除
  const handleProjectDelete = () => {
    if (!selectedProject) return;
    
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除项目"${selectedProject.name}"吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        // 从项目列表中移除
        const updatedProjects = projectData.filter(item => item.id !== selectedProject.id);
        setFilteredProjects(
          activeTab === 'all' ? updatedProjects : 
          updatedProjects.filter(item => item.status === activeTab)
        );
        
        // 更新原始数据
        const index = projectData.findIndex(item => item.id === selectedProject.id);
        if (index > -1) {
          projectData.splice(index, 1);
        }
        
        // 保存更新后的项目数据到本地存储
        try {
          localStorage.setItem('projectData', JSON.stringify(projectData));
          console.log('项目数据已保存到localStorage', projectData);
        } catch (error) {
          console.error('保存项目数据到localStorage失败:', error);
        }
        
        message.success('项目已删除');
        setIsEditModalVisible(false);
      }
    });
  };

  // 组件加载时从localStorage加载项目数据
  useEffect(() => {
    // 尝试从localStorage读取项目数据
    const storedProjects = localStorage.getItem('projectData');
    if (storedProjects) {
      try {
        const parsedProjects = JSON.parse(storedProjects);
        if (Array.isArray(parsedProjects) && parsedProjects.length > 0) {
          // 清空原有数据
          projectData.length = 0;
          // 将存储的数据填充到projectData
          projectData.push(...parsedProjects);
          // 更新显示的项目列表
          setFilteredProjects(
            activeTab === 'all' ? projectData : 
            projectData.filter(item => item.status === activeTab)
          );
          console.log('已从localStorage加载项目数据', projectData);
        }
      } catch (error) {
        console.error('从localStorage读取项目数据失败:', error);
      }
    } else {
      // 首次加载时，将当前项目数据保存到localStorage
      try {
        localStorage.setItem('projectData', JSON.stringify(projectData));
        console.log('初始项目数据已保存到localStorage', projectData);
      } catch (error) {
        console.error('保存项目数据到localStorage失败:', error);
      }
    }
  }, []);

  return (
    <>
      <Card bordered={false}>
        <Row gutter={16} align="middle" justify="space-between">
          <Col>
            <Title level={4} style={{ margin: 0 }}>项目管理</Title>
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                新建项目
              </Button>
              <Button icon={<FileExcelOutlined />}>导出数据</Button>
            </Space>
          </Col>
        </Row>
      </Card>
      
      {showDeadlineWarning && (
        <Alert 
          message="项目截止提醒" 
          description="您有项目即将截止，请注意项目进度，及时跟进。" 
          type="warning" 
          showIcon 
          closable 
          style={{ marginTop: 16 }}
        />
      )}

      <Card bordered={false} style={{ marginTop: 16 }}>
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane tab="全部项目" key="all" />
          <TabPane tab="进行中" key="进行中" />
          <TabPane tab="待启动" key="待启动" />
          <TabPane tab="已完成" key="已完成" />
          <TabPane tab="已取消" key="已取消" />
        </Tabs>

        <div style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
            <Input
                placeholder="搜索项目" 
              prefix={<SearchOutlined />}
                allowClear
              />
            </Col>
            <Col span={16}>
              <Space style={{ float: 'right' }}>
                <Select 
                  placeholder="项目经理" 
                  style={{ width: 120 }}
                  allowClear
                >
                  <Option value="张明">张明</Option>
                  <Option value="李刚">李刚</Option>
                  <Option value="王琳">王琳</Option>
                  <Option value="赵伟">赵伟</Option>
                </Select>
                <Select 
                  placeholder="风险等级" 
                  style={{ width: 120 }}
                  allowClear
                >
                  <Option value="高">高</Option>
                  <Option value="中">中</Option>
                  <Option value="低">低</Option>
                </Select>
                <RangePicker placeholder={['开始日期', '截止日期']} />
                <Button icon={<FilterOutlined />}>筛选</Button>
              </Space>
            </Col>
          </Row>
        </div>
        
        <Table 
          style={{ marginTop: 16 }}
          columns={columns} 
          dataSource={filteredProjects.map(item => ({ ...item, key: item.id }))} 
          rowKey="id"
          pagination={{ 
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 个项目`
          }}
          onRow={(record) => {
            return {
              onClick: () => {
                setSelectedProject(record);
                setDetailModalVisible(true);
              }
            };
          }}
        />
      </Card>

      {/* 新建项目模态框 */}
      <Modal
        title="新建项目"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          name="newProjectForm"
        >
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          
          <Form.Item
            name="client"
            label="客户名称"
            rules={[{ required: true, message: '请输入客户名称' }]}
          >
            <Input placeholder="请输入客户名称" />
          </Form.Item>
          
          <Form.Item
            name="manager"
            label="项目经理"
            rules={[{ required: true, message: '请选择项目经理' }]}
          >
            <Select placeholder="请选择项目经理">
              <Option value="张明">张明</Option>
              <Option value="李刚">李刚</Option>
              <Option value="王琳">王琳</Option>
              <Option value="赵伟">赵伟</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="stage"
            label="初始阶段"
            rules={[{ required: true, message: '请选择项目初始阶段' }]}
          >
            <Select placeholder="请选择项目初始阶段">
              <Option value="客户需求分析">客户需求分析</Option>
              <Option value="合规审查">合规审查</Option>
              <Option value="风险评估">风险评估</Option>
              <Option value="合同签订">合同签订</Option>
              <Option value="团队组建">团队组建</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="dateRange"
            label="项目时间"
            rules={[{ required: true, message: '请选择项目起止时间' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="risk"
            label="风险等级"
            rules={[{ required: true, message: '请选择风险等级' }]}
          >
            <Select placeholder="请选择风险等级">
              <Option value="低">低</Option>
              <Option value="中">中</Option>
              <Option value="高">高</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 项目详情模态框 */}
      <Modal
        title="项目详情"
        open={detailModalVisible}
        onCancel={handleDetailCancel}
        footer={[
          <Button key="close" onClick={handleDetailCancel}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {selectedProject && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="项目编号" span={2}>{selectedProject.id}</Descriptions.Item>
              <Descriptions.Item label="项目名称" span={2}>{selectedProject.name}</Descriptions.Item>
              <Descriptions.Item label="客户名称">{selectedProject.client}</Descriptions.Item>
              <Descriptions.Item label="项目经理">{selectedProject.manager}</Descriptions.Item>
              <Descriptions.Item label="当前阶段">{selectedProject.stage}</Descriptions.Item>
              <Descriptions.Item label="项目状态">
                <Tag color={selectedProject.status === '延期' ? 'red' : selectedProject.status === '待启动' ? 'blue' : 'green'}>
                  {selectedProject.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="开始日期">{selectedProject.startDate}</Descriptions.Item>
              <Descriptions.Item label="截止日期">{selectedProject.deadline}</Descriptions.Item>
              <Descriptions.Item label="风险等级">
                <Tag color={selectedProject.risk === '高' ? 'red' : selectedProject.risk === '中' ? 'orange' : 'green'}>
                  {selectedProject.risk === '高' && <ExclamationCircleOutlined style={{ marginRight: 4 }} />}
                  {selectedProject.risk}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            
            <div style={{ marginTop: 24 }}>
              <Tabs defaultActiveKey="members">
                <TabPane tab="项目成员" key="members">
                  <Table
                    columns={[
                      { title: '姓名', dataIndex: 'name', key: 'name' },
                      { title: '职位', dataIndex: 'position', key: 'position' },
                      { title: '角色', dataIndex: 'role', key: 'role' },
                    ]}
                    dataSource={[
                      { key: '1', name: selectedProject.manager, position: '高级审计师', role: '项目经理' },
                      { key: '2', name: '陈华', position: '审计师', role: '组员' },
                      { key: '3', name: '刘芳', position: '助理审计师', role: '组员' },
                    ]}
                    pagination={false}
                  />
                </TabPane>
                <TabPane tab="项目文档" key="docs">
                  <Table
                    columns={[
                      { title: '文档名称', dataIndex: 'name', key: 'name' },
                      { title: '更新时间', dataIndex: 'date', key: 'date' },
                      { title: '创建人', dataIndex: 'creator', key: 'creator' },
                      { 
                        title: '操作', 
                        key: 'action',
                        render: () => (
                          <Space>
                            <a>查看</a>
                            <a>下载</a>
                          </Space>
                        )
                      },
                    ]}
                    dataSource={[
                      { key: '1', name: '项目计划书.docx', date: '2025-03-20', creator: selectedProject.manager },
                      { key: '2', name: '客户资料汇总.xlsx', date: '2025-03-22', creator: '陈华' },
                      { key: '3', name: '风险评估报告.pdf', date: '2025-03-25', creator: '刘芳' },
                    ]}
                    pagination={false}
                  />
                </TabPane>
              </Tabs>
            </div>
          </div>
        )}
      </Modal>
      
      {/* 项目编辑模态框 */}
      <Modal
        title="编辑项目"
        open={isEditModalVisible}
        onOk={handleEditOk}
        onCancel={handleEditCancel}
        width={700}
        footer={[
          <Button key="delete" type="primary" danger onClick={handleProjectDelete}>
            删除项目
          </Button>,
          <Button key="cancel" onClick={handleEditCancel}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleEditOk}>
            保存
          </Button>
        ]}
      >
        {selectedProject && (
          <Form
            form={editForm}
            layout="vertical"
            name="editProjectForm"
          >
            <Form.Item
              name="name"
              label="项目名称"
              rules={[{ required: true, message: '请输入项目名称' }]}
            >
              <Input placeholder="请输入项目名称" />
            </Form.Item>
            
            <Form.Item
              name="client"
              label="客户名称"
              rules={[{ required: true, message: '请输入客户名称' }]}
            >
              <Input placeholder="请输入客户名称" />
            </Form.Item>
            
            <Form.Item
              name="manager"
              label="项目经理"
              rules={[{ required: true, message: '请选择项目经理' }]}
            >
              <Select placeholder="请选择项目经理">
                <Option value="张明">张明</Option>
                <Option value="李刚">李刚</Option>
                <Option value="王琳">王琳</Option>
                <Option value="赵伟">赵伟</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="stage"
              label="当前阶段"
              rules={[{ required: true, message: '请选择项目当前阶段' }]}
            >
              <Select placeholder="请选择项目当前阶段">
                <Option value="客户需求分析">客户需求分析</Option>
                <Option value="合规审查">合规审查</Option>
                <Option value="风险评估">风险评估</Option>
                <Option value="合同签订">合同签订</Option>
                <Option value="团队组建">团队组建</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="dateRange"
              label="项目时间"
              rules={[{ required: true, message: '请选择项目起止时间' }]}
            >
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              name="status"
              label="项目状态"
              rules={[{ required: true, message: '请选择项目状态' }]}
            >
              <Select placeholder="请选择项目状态">
              <Option value="待启动">待启动</Option>
              <Option value="进行中">进行中</Option>
              <Option value="已完成">已完成</Option>
              <Option value="延期">延期</Option>
            </Select>
            </Form.Item>
            
            <Form.Item
              name="risk"
              label="风险等级"
              rules={[{ required: true, message: '请选择风险等级' }]}
            >
              <Select placeholder="请选择风险等级">
                <Option value="低">低</Option>
                <Option value="中">中</Option>
                <Option value="高">高</Option>
              </Select>
            </Form.Item>
          </Form>
        )}
      </Modal>
      
      {/* 项目流程模态框 */}
      <Modal
        title="项目流程"
        open={isWorkflowModalVisible}
        onCancel={handleWorkflowCancel}
        footer={[
          <Button key="close" onClick={handleWorkflowCancel}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {selectedProject && (
          <div>
            <Steps
              current={
                selectedProject.stage === "客户需求分析" ? 0 :
                selectedProject.stage === "合规审查" ? 1 :
                selectedProject.stage === "风险评估" ? 2 :
                selectedProject.stage === "合同签订" ? 3 :
                selectedProject.stage === "团队组建" ? 4 : 0
              }
              size="small"
              style={{ marginBottom: 32 }}
            >
              <Step title="客户需求分析" description="收集和分析客户需求" />
              <Step title="合规审查" description="确保项目符合法律法规" />
              <Step title="风险评估" description="评估项目潜在风险" />
              <Step title="合同签订" description="正式确认合作关系" />
              <Step title="团队组建" description="组建项目执行团队" />
            </Steps>
            
            <Timeline mode="left" style={{ marginTop: 32 }}>
              <Timeline.Item dot={<CheckCircleOutlined style={{ fontSize: '16px' }} />} color="green">
                创建项目 <small>{moment().subtract(10, 'days').format('YYYY-MM-DD HH:mm')}</small>
              </Timeline.Item>
              <Timeline.Item dot={<CheckCircleOutlined style={{ fontSize: '16px' }} />} color="green">
                确认客户需求 <small>{moment().subtract(8, 'days').format('YYYY-MM-DD HH:mm')}</small>
              </Timeline.Item>
              <Timeline.Item dot={
                selectedProject.stage === "客户需求分析" ? 
                <SyncOutlined spin style={{ fontSize: '16px' }} /> : 
                <CheckCircleOutlined style={{ fontSize: '16px' }} />
              } color={selectedProject.stage === "客户需求分析" ? "blue" : "green"}>
                完成需求分析 <small>{
                  selectedProject.stage === "客户需求分析" ? "进行中" : moment().subtract(6, 'days').format('YYYY-MM-DD HH:mm')
                }</small>
              </Timeline.Item>
              <Timeline.Item dot={
                selectedProject.stage === "合规审查" ? 
                <SyncOutlined spin style={{ fontSize: '16px' }} /> : 
                (selectedProject.stage === "客户需求分析" ? 
                  <ClockCircleOutlined style={{ fontSize: '16px' }} /> : 
                  <CheckCircleOutlined style={{ fontSize: '16px' }} />)
              } color={
                selectedProject.stage === "合规审查" ? "blue" : 
                (selectedProject.stage === "客户需求分析" ? "gray" : "green")
              }>
                完成合规审查 <small>{
                  selectedProject.stage === "合规审查" ? "进行中" : 
                  (selectedProject.stage === "客户需求分析" ? "未开始" : moment().subtract(4, 'days').format('YYYY-MM-DD HH:mm'))
                }</small>
              </Timeline.Item>
              <Timeline.Item dot={
                selectedProject.stage === "风险评估" ? 
                <SyncOutlined spin style={{ fontSize: '16px' }} /> : 
                (["客户需求分析", "合规审查"].includes(selectedProject.stage) ? 
                  <ClockCircleOutlined style={{ fontSize: '16px' }} /> : 
                  <CheckCircleOutlined style={{ fontSize: '16px' }} />)
              } color={
                selectedProject.stage === "风险评估" ? "blue" : 
                (["客户需求分析", "合规审查"].includes(selectedProject.stage) ? "gray" : "green")
              }>
                完成风险评估 <small>{
                  selectedProject.stage === "风险评估" ? "进行中" : 
                  (["客户需求分析", "合规审查"].includes(selectedProject.stage) ? "未开始" : moment().subtract(2, 'days').format('YYYY-MM-DD HH:mm'))
                }</small>
              </Timeline.Item>
              <Timeline.Item dot={
                <ClockCircleOutlined style={{ fontSize: '16px' }} />
              } color="gray">
                项目执行 <small>未开始</small>
              </Timeline.Item>
            </Timeline>
        </div>
        )}
      </Modal>
    </>
  );
};

ProjectManagement.getLayout = (page: React.ReactElement) => {
  return (
    <AppLayout>
      {page}
    </AppLayout>
  );
};

export default ProjectManagement; 