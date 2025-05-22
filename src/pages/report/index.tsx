import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  Space, 
  Table, 
  Tag, 
  Typography, 
  Input, 
  Select,
  Tabs,
  Modal,
  Form,
  Upload,
  message,
  Row,
  Col,
  Divider,
  Alert
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  UploadOutlined, 
  FileTextOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { NextPage } from 'next';
import AppLayout from '@/components/Layout';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const ReportGeneration: NextPage & { getLayout?: (page: React.ReactElement) => React.ReactNode } = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [reportForm] = Form.useForm();
  const [templateForm] = Form.useForm();
  const [editReportForm] = Form.useForm();
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [previewReport, setPreviewReport] = useState<any>(null);
  const [isVersionModalVisible, setIsVersionModalVisible] = useState(false);
  const [versionReport, setVersionReport] = useState<any>(null);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [isEditTemplateModalVisible, setIsEditTemplateModalVisible] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  const [editTemplateForm] = Form.useForm();
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [aiReportContent, setAiReportContent] = useState<any>(null);
  const [selectedAIModel, setSelectedAIModel] = useState<string>('deepseek.r1');

  // 模拟报告数据
  const reportData = [
    {
      id: 'R20250331001',
      name: '杭州智联科技年度审计报告',
      project: 'P20250331001',
      projectName: '杭州智联科技年度审计',
      creator: '张明',
      createTime: '2025-03-28',
      updateTime: '2025-03-31',
      status: '草稿',
      compliance: '通过'
    },
    {
      id: 'R20250327002',
      name: '上海贸易集团税务合规报告',
      project: 'P20250327002',
      projectName: '上海贸易集团税务咨询',
      creator: '李刚',
      createTime: '2025-03-25',
      updateTime: '2025-03-30',
      status: '审核中',
      compliance: '需修改'
    },
    {
      id: 'R20250320003',
      name: '北京健康医疗资产评估报告',
      project: 'P20250320003',
      projectName: '北京健康医疗上市审计',
      creator: '王琳',
      createTime: '2025-03-22',
      updateTime: '2025-03-29',
      status: '已定稿',
      compliance: '通过'
    },
    {
      id: 'R20250315004',
      name: '广州餐饮集团内控评估报告',
      project: 'P20250315004',
      projectName: '广州餐饮集团内控评估',
      creator: '赵伟',
      createTime: '2025-03-20',
      updateTime: '2025-03-28',
      status: '待修订',
      compliance: '需修改'
    },
  ];

  // 模拟模板数据
  const templateData = [
    {
      id: 'T001',
      name: '标准审计报告模板',
      category: '审计',
      updater: '系统管理员',
      updateTime: '2025-01-15',
      usage: 152
    },
    {
      id: 'T002',
      name: '税务咨询报告模板',
      category: '税务',
      updater: '李刚',
      updateTime: '2025-02-10',
      usage: 88
    },
    {
      id: 'T003',
      name: '内控评估报告模板',
      category: '内控',
      updater: '王琳',
      updateTime: '2025-02-28',
      usage: 64
    },
    {
      id: 'T004',
      name: '财务尽职调查报告模板',
      category: '尽调',
      updater: '张明',
      updateTime: '2025-03-05',
      usage: 42
    },
  ];

  // 从localStorage加载报告和模板数据
  useEffect(() => {
    // 加载报告数据
    try {
      const savedReports = localStorage.getItem('reportData');
      if (savedReports) {
        const parsedReports = JSON.parse(savedReports);
        if (Array.isArray(parsedReports) && parsedReports.length > 0) {
          // 合并预设数据和保存的数据（避免重复）
          const existingIds = new Set(reportData.map(r => r.id));
          const newReports = parsedReports.filter(r => !existingIds.has(r.id));
          
          if (newReports.length > 0) {
            // 将新报告添加到数组前端
            reportData.unshift(...newReports);
            console.log('从localStorage加载了报告数据', reportData);
          }
        }
      }
    } catch (error) {
      console.error('加载报告数据失败:', error);
    }
    
    // 加载模板数据
    try {
      const savedTemplates = localStorage.getItem('templateData');
      if (savedTemplates) {
        const parsedTemplates = JSON.parse(savedTemplates);
        if (Array.isArray(parsedTemplates) && parsedTemplates.length > 0) {
          // 合并预设模板和保存的模板（避免重复）
          const existingIds = new Set(templateData.map(t => t.id));
          const newTemplates = parsedTemplates.filter(t => !existingIds.has(t.id));
          
          if (newTemplates.length > 0) {
            // 将新模板添加到模板数据
            templateData.push(...newTemplates);
            console.log('从localStorage加载了模板数据', templateData);
          }
        }
      }
    } catch (error) {
      console.error('加载模板数据失败:', error);
    }
  }, []);

  // 报告表格列定义
  const reportsColumns = [
    {
      title: '报告编号',
      dataIndex: 'id',
      key: 'id',
      sorter: (a: any, b: any) => a.id.localeCompare(b.id),
    },
    {
      title: '报告名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: '关联项目',
      dataIndex: 'projectName',
      key: 'projectName',
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      sorter: (a: any, b: any) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime(),
    },
    {
      title: '最近更新',
      dataIndex: 'updateTime',
      key: 'updateTime',
      sorter: (a: any, b: any) => new Date(a.updateTime).getTime() - new Date(b.updateTime).getTime(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'blue';
        if (status === '审核中') color = 'orange';
        if (status === '已定稿') color = 'green';
        if (status === '待修订') color = 'red';
        return <Tag color={color}>{status}</Tag>;
      },
      filters: [
        { text: '草稿', value: '草稿' },
        { text: '审核中', value: '审核中' },
        { text: '已定稿', value: '已定稿' },
        { text: '待修订', value: '待修订' },
      ],
      onFilter: (value: any, record: any) => record.status === value,
    },
    {
      title: '合规检查',
      dataIndex: 'compliance',
      key: 'compliance',
      render: (compliance: string) => {
        const color = compliance === '通过' ? 'green' : 'red';
        const icon = compliance === '通过' 
          ? <CheckCircleOutlined style={{ marginRight: 4 }} /> 
          : <ExclamationCircleOutlined style={{ marginRight: 4 }} />;
        return (
          <Tag color={color}>
            {icon}
            {compliance}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <a onClick={() => handleEditReport(record)}>编辑</a>
          <a onClick={() => handlePreviewReport(record)}>预览</a>
          <a onClick={() => handleVersionHistory(record)}>版本</a>
        </Space>
      ),
    },
  ];

  // 模板表格列定义
  const templateColumns = [
    {
      title: '模板编号',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      filters: [
        { text: '审计', value: '审计' },
        { text: '税务', value: '税务' },
        { text: '内控', value: '内控' },
        { text: '尽调', value: '尽调' },
      ],
      onFilter: (value: any, record: any) => record.category === value,
    },
    {
      title: '更新人',
      dataIndex: 'updater',
      key: 'updater',
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      sorter: (a: any, b: any) => new Date(a.updateTime).getTime() - new Date(b.updateTime).getTime(),
    },
    {
      title: '使用次数',
      dataIndex: 'usage',
      key: 'usage',
      sorter: (a: any, b: any) => a.usage - b.usage,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <a onClick={() => handleUseTemplate(record)}>使用</a>
          <a onClick={() => handleEditTemplate(record)}>编辑</a>
          <a onClick={() => handleCopyTemplate(record)}>复制</a>
        </Space>
      ),
    },
  ];

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    reportForm.validateFields().then(values => {
      console.log('表单数据:', values);
      
      // 创建新报告ID
      const newId = `R${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(reportData.length + 1).padStart(3, '0')}`;
      
      // 获取项目名称
      const selectedProject = reportData.find(r => r.project === values.project) || 
        { projectName: values.project.includes('P') ? `项目${values.project.slice(-3)}` : '未知项目' };
      
      // 创建新报告
      const newReport = {
        id: newId,
        name: values.name,
        project: values.project,
        projectName: selectedProject.projectName,
        creator: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').name || '当前用户' : '当前用户',
        createTime: new Date().toISOString().split('T')[0],
        updateTime: new Date().toISOString().split('T')[0],
        status: '草稿',
        compliance: '通过'
      };
      
      // 如果有AI生成的内容，添加到报告中
      if (aiReportContent) {
        newReport.content = aiReportContent;
        console.log('使用AI生成的内容创建报告', aiReportContent);
      }
      
      // 将新报告添加到列表
      const updatedReports = [newReport, ...reportData];
      
      // 更新本地数据
      reportData.unshift(newReport);
      
      // 保存到本地存储
      try {
        localStorage.setItem('reportData', JSON.stringify(updatedReports));
        console.log('报告数据已保存到localStorage', updatedReports);
      } catch (error) {
        console.error('保存报告数据到localStorage失败:', error);
      }
      
      message.success('报告已创建');
      reportForm.resetFields();
      setAiReportContent(null);
      setIsModalVisible(false);
    }).catch(info => {
      console.log('表单验证失败:', info);
    });
  };

  const handleCancel = () => {
    reportForm.resetFields();
    setIsModalVisible(false);
  };

  const showTemplateModal = () => {
    setIsTemplateModalVisible(true);
  };

  const handleTemplateOk = () => {
    templateForm.validateFields().then(values => {
      console.log('新建模板表单数据:', values);
      
      // 创建新模板ID
      const newId = `T${String(templateData.length + 1).padStart(3, '0')}`;
      
      // 创建新模板对象
      const newTemplate = {
        id: newId,
        name: values.name || '新模板',
        category: values.category || '其他',
        content: values.content || '',
        updater: localStorage.getItem('user') ? 
          JSON.parse(localStorage.getItem('user') || '{}').name || '当前用户' : 
          '当前用户',
        updateTime: new Date().toISOString().split('T')[0],
        usage: 0,
        permissions: values.permissions || 'all'
      };
      
      // 添加到模板列表
      const updatedTemplates = [...templateData, newTemplate];
      
      // 更新本地数据
      templateData.push(newTemplate);
      
      // 保存到本地存储
      try {
        localStorage.setItem('templateData', JSON.stringify(updatedTemplates));
        console.log('更新后的模板数据已保存到localStorage', updatedTemplates);
      } catch (error) {
        console.error('保存模板数据到localStorage失败:', error);
      }
      
      templateForm.resetFields();
      message.success('模板创建成功');
      setIsTemplateModalVisible(false);
    }).catch(info => {
      console.log('表单验证失败:', info);
    });
  };

  const handleTemplateCancel = () => {
    templateForm.resetFields();
    setIsTemplateModalVisible(false);
  };

  // 处理编辑报告
  const handleEditReport = (report: any) => {
    setCurrentReport(report);
    editReportForm.setFieldsValue({
      name: report.name,
      project: report.project,
      status: report.status,
      compliance: report.compliance,
      content: "这里是报告的详细内容，实际应从数据库获取...",
      reviewers: ['张明', '李刚']
    });
    setIsEditModalVisible(true);
  };

  // 确认编辑报告
  const handleEditReportOk = () => {
    editReportForm.validateFields().then(values => {
      console.log('更新报告数据:', values);
      
      if (currentReport) {
        // 更新报告对象
        const updatedReport = {
          ...currentReport,
          name: values.name,
          project: values.project,
          projectName: values.project === currentReport.project ? 
            currentReport.projectName : 
            reportData.find(r => r.project === values.project)?.projectName || '未知项目',
          status: values.status,
          compliance: values.compliance,
          content: values.content,
          updateTime: new Date().toISOString().split('T')[0],
        };
        
        // 更新列表中的报告
        const updatedReports = reportData.map(report => 
          report.id === currentReport.id ? updatedReport : report
        );
        
        // 保存到本地存储
        try {
          localStorage.setItem('reportData', JSON.stringify(updatedReports));
          console.log('更新后的报告数据已保存到localStorage', updatedReports);
        } catch (error) {
          console.error('保存报告数据到localStorage失败:', error);
        }
        
        // 更新原始数据
        for (let i = 0; i < reportData.length; i++) {
          if (reportData[i].id === currentReport.id) {
            reportData[i] = updatedReport;
            break;
          }
        }
        
        message.success('报告已更新');
        setIsEditModalVisible(false);
      }
    }).catch(info => {
      console.log('表单验证失败:', info);
    });
  };

  // 取消编辑报告
  const handleEditReportCancel = () => {
    setIsEditModalVisible(false);
  };

  // 处理预览报告
  const handlePreviewReport = (report: any) => {
    setPreviewReport(report);
    setIsPreviewModalVisible(true);
  };

  // 关闭预览报告
  const handlePreviewCancel = () => {
    setIsPreviewModalVisible(false);
  };

  // 处理查看版本历史
  const handleVersionHistory = (report: any) => {
    setVersionReport(report);
    // 模拟版本历史数据
    setVersionHistory([
      {
        version: '1.0',
        updater: report.creator,
        updateTime: report.createTime,
        remark: '初始版本'
      },
      {
        version: '1.1',
        updater: '李刚',
        updateTime: new Date(new Date(report.createTime).getTime() + 86400000).toISOString().split('T')[0],
        remark: '修正财务数据'
      },
      {
        version: '1.2',
        updater: '王琳',
        updateTime: new Date(new Date(report.createTime).getTime() + 172800000).toISOString().split('T')[0],
        remark: '合规性审查修改'
      },
      {
        version: '1.3',
        updater: report.creator,
        updateTime: report.updateTime,
        remark: '最终修改与定稿'
      }
    ]);
    setIsVersionModalVisible(true);
  };

  // 关闭版本历史
  const handleVersionCancel = () => {
    setIsVersionModalVisible(false);
  };

  // 查看特定版本
  const viewSpecificVersion = (version: string) => {
    // 查找当前版本
    const currentVersion = versionHistory.find(v => v.version === version);
    
    if (currentVersion) {
      message.success(`正在查看版本 ${version} (${currentVersion.updateTime})`);
      // 设置预览内容
      setPreviewReport({
        ...versionReport,
        name: `${versionReport.name} (版本 ${version})`,
        updateTime: currentVersion.updateTime,
        creator: currentVersion.updater
      });
      setIsVersionModalVisible(false);
      setIsPreviewModalVisible(true);
    } else {
      message.error('未找到该版本信息');
    }
  };

  // 恢复特定版本
  const restoreSpecificVersion = (version: string) => {
    // 查找当前版本
    const currentVersion = versionHistory.find(v => v.version === version);
    
    if (!currentVersion) {
      message.error('未找到该版本信息');
      return;
    }
    
    Modal.confirm({
      title: '恢复版本',
      content: `确定要恢复到版本 ${version} (${currentVersion.updateTime}) 吗？当前的更改将会丢失。`,
      okText: '确定',
      cancelText: '取消',
      onOk() {
        // 更新当前报告的版本信息
        const updatedReport = {
          ...versionReport,
          updateTime: new Date().toISOString().split('T')[0],
          status: '草稿', // 恢复版本后默认为草稿状态
          // 假设恢复了版本内容
          content: `版本${version}的内容：${currentVersion.remark}`
        };
        
        // 更新列表中的报告
        const updatedReports = reportData.map(report => 
          report.id === versionReport.id ? updatedReport : report
        );
        
        // 更新原始数据
        for (let i = 0; i < reportData.length; i++) {
          if (reportData[i].id === versionReport.id) {
            reportData[i] = updatedReport;
            break;
          }
        }
        
        // 保存到本地存储
        try {
          localStorage.setItem('reportData', JSON.stringify(updatedReports));
          console.log('更新后的报告数据已保存到localStorage', updatedReports);
        } catch (error) {
          console.error('保存报告数据到localStorage失败:', error);
        }
        
        message.success(`已恢复到版本 ${version}`);
        handleVersionCancel();
      }
    });
  };

  // 处理使用模板
  const handleUseTemplate = (template: any) => {
    // 填充新建报告表单中的模板字段
    reportForm.setFieldsValue({
      template: template.id
    });
    message.success(`已选择"${template.name}"模板`);
    setIsModalVisible(true); // 打开新建报告对话框
  };

  // 处理编辑模板
  const handleEditTemplate = (template: any) => {
    setCurrentTemplate(template);
    editTemplateForm.setFieldsValue({
      id: template.id,
      name: template.name,
      category: template.category,
      content: `这里是${template.name}的详细内容，实际应从数据库获取...`,
      permissions: 'all'
    });
    setIsEditTemplateModalVisible(true);
  };

  // 处理复制模板
  const handleCopyTemplate = (template: any) => {
    // 弹出确认对话框
    Modal.confirm({
      title: '复制模板',
      content: `确定要创建"${template.name}"的副本吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk() {
        // 创建新模板ID
        const newId = `T${String(templateData.length + 1).padStart(3, '0')}`;
        
        // 创建模板副本
        const templateCopy = {
          ...template,
          id: newId,
          name: `${template.name} - 副本`,
          updater: localStorage.getItem('user') ? 
            JSON.parse(localStorage.getItem('user') || '{}').name || '当前用户' : 
            '当前用户',
          updateTime: new Date().toISOString().split('T')[0],
          usage: 0 // 新模板使用次数重置为0
        };
        
        // 添加到模板列表
        const updatedTemplates = [...templateData, templateCopy];
        
        // 更新本地数据
        templateData.push(templateCopy);
        
        // 保存到本地存储
        try {
          localStorage.setItem('templateData', JSON.stringify(updatedTemplates));
          console.log('更新后的模板数据已保存到localStorage', updatedTemplates);
        } catch (error) {
          console.error('保存模板数据到localStorage失败:', error);
        }
        
        message.success(`已创建"${template.name}的副本"`);
      }
    });
  };

  // 确认编辑模板
  const handleEditTemplateOk = () => {
    editTemplateForm.validateFields().then(values => {
      console.log('更新模板数据:', values);
      
      if (currentTemplate) {
        // 更新模板对象
        const updatedTemplate = {
          ...currentTemplate,
          name: values.name,
          category: values.category,
          content: values.content,
          permissions: values.permissions,
          updater: localStorage.getItem('user') ? 
            JSON.parse(localStorage.getItem('user') || '{}').name || '当前用户' : 
            '当前用户',
          updateTime: new Date().toISOString().split('T')[0]
        };
        
        // 更新列表中的模板
        const updatedTemplates = templateData.map(template => 
          template.id === currentTemplate.id ? updatedTemplate : template
        );
        
        // 保存到本地存储
        try {
          localStorage.setItem('templateData', JSON.stringify(updatedTemplates));
          console.log('更新后的模板数据已保存到localStorage', updatedTemplates);
        } catch (error) {
          console.error('保存模板数据到localStorage失败:', error);
        }
        
        // 更新原始数据
        for (let i = 0; i < templateData.length; i++) {
          if (templateData[i].id === currentTemplate.id) {
            templateData[i] = updatedTemplate;
            break;
          }
        }
        
        message.success('模板已更新');
        setIsEditTemplateModalVisible(false);
      }
    }).catch(info => {
      console.log('表单验证失败:', info);
    });
  };

  // 取消编辑模板
  const handleEditTemplateCancel = () => {
    setIsEditTemplateModalVisible(false);
  };

  // 处理AI预生成
  const handleAIGenerate = async () => {
    try {
      // 首先验证必填字段
      const formValues = await reportForm.validateFields(['name', 'project', 'template']);
      
      // 开始生成
      setIsAIGenerating(true);
      
      // 获取项目和模板详情
      const selectedProject = reportData.find(r => r.project === formValues.project);
      const templateName = reportForm.getFieldValue('template') === 'T001' ? '标准审计报告模板' : 
                          reportForm.getFieldValue('template') === 'T002' ? '税务咨询报告模板' : 
                          reportForm.getFieldValue('template') === 'T003' ? '内控评估报告模板' : 
                          reportForm.getFieldValue('template') === 'T004' ? '财务尽职调查报告模板' : '自定义模板';
      
      try {
        // 实际应该通过API调用AI服务
        // const response = await axios.post('/api/ai/generate', {
        //   projectName: selectedProject?.projectName,
        //   templateName: templateName,
        //   reportName: formValues.name,
        //   modelType: selectedAIModel
        // });
        
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 模拟AI生成的内容
        const generatedContent = generateMockAIContent(
          templateName,
          formValues.name,
          selectedProject?.projectName || '未指定项目'
        );
        
        setAiReportContent(generatedContent);
        message.success('AI内容生成成功');
        
        // 缓存AI生成的结果，防止网络错误
        try {
          localStorage.setItem('lastGeneratedReport', JSON.stringify({
            content: generatedContent,
            timestamp: new Date().getTime()
          }));
        } catch (e) {
          console.error('缓存AI生成结果失败:', e);
        }
      } catch (error) {
        console.error('调用AI服务生成内容失败:', error);
        message.error('内容生成失败，请重试');
        
        // 尝试从缓存读取上次生成的内容
        try {
          const cachedReport = localStorage.getItem('lastGeneratedReport');
          if (cachedReport) {
            const { content, timestamp } = JSON.parse(cachedReport);
            const cachedTime = new Date(timestamp);
            // 只使用一天以内的缓存内容
            if (new Date().getTime() - cachedTime.getTime() < 24 * 60 * 60 * 1000) {
              setAiReportContent(content);
              message.warning('使用了缓存的上次生成结果');
            }
          }
        } catch (e) {
          console.error('读取缓存报告失败:', e);
        }
      }
    } catch (error) {
      console.error('生成内容前验证失败:', error);
      message.warning('请先填写必要的字段');
    } finally {
      setIsAIGenerating(false);
    }
  };
  
  // 获取AI模型名称的显示文本
  const getAIModelName = (model: string) => {
    const modelNames: {[key: string]: string} = {
      'deepseek.r1': 'Deepseek R1',
      'deepseek.v3': 'Deepseek V3'
    };
    return modelNames[model] || model;
  };
  
  // 辅助函数：根据模板类型生成模拟内容
  const generateMockAIContent = (templateType: string, reportName: string, projectName: string) => {
    const reportTypes = {
      'T001': '审计报告',
      'T002': '税务咨询报告',
      'T003': '内控评估报告',
      'T004': '财务尽职调查报告'
    };
    
    // 提取客户名称
    const clientName = projectName.split(/年度|税务|内控|集团/)[0] || '客户';
    const reportType = reportTypes[templateType as keyof typeof reportTypes] || '报告';
    
    return {
      sections: [
        {
          title: `${reportName}`,
          content: `本报告是关于${clientName}的${reportType}，基于我们的专业评估和审核工作。`,
          order: 1,
          aiGenerated: true,
        },
        {
          title: '一、项目概述',
          content: `我们接受${clientName}的委托，对其进行了全面的专业服务。本次工作的主要目标是评估财务报表的公允性、内部控制的有效性以及相关合规情况。\n\n工作开展期间为2025年1月至2025年3月，我们严格遵循相关专业准则和法规要求完成了各项程序。`,
          order: 2,
          aiGenerated: true,
        },
        {
          title: '二、主要发现',
          content: templateType === 'T001' ? 
            `1. 财务报表在所有重大方面按照企业会计准则编制，公允反映了${clientName}的财务状况、经营成果和现金流量。\n2. 会计政策选用恰当，会计估计合理。\n3. 财务报表附注披露充分、适当。` :
            templateType === 'T002' ? 
            `1. ${clientName}的税务申报在大多数方面符合相关税法规定。\n2. 发现部分增值税进项抵扣凭证不完整，建议加强内部审核。\n3. 企业所得税税前扣除项目存在优化空间。` :
            templateType === 'T003' ? 
            `1. ${clientName}已建立较为完善的内部控制体系，覆盖主要业务环节。\n2. 采购流程和审批制度执行良好，但存在部分记录不完整的情况。\n3. 资产管理和保护措施有效，但固定资产盘点制度执行不够严格。` :
            `1. ${clientName}财务状况总体稳健，资产负债结构合理。\n2. 盈利能力持续增长，但存在季节性波动。\n3. 现金流管理良好，资金周转效率高。`,
          order: 3,
          aiGenerated: true,
        },
        {
          title: '三、结论与建议',
          content: templateType === 'T001' ? 
            `根据我们的审计工作，我们认为${clientName}的财务报表在所有重大方面按照企业会计准则的规定编制，公允反映了2025年3月31日的财务状况以及2025年第一季度的经营成果和现金流量。\n\n建议：\n1. 加强应收账款管理，制定更严格的账龄分析和跟踪制度\n2. 优化存货管理流程，减少呆滞物料\n3. 完善财务报告内部控制，确保信息及时准确` :
            templateType === 'T002' ? 
            `基于我们的税务咨询工作，${clientName}的税务合规情况总体良好，但存在部分优化空间。\n\n建议：\n1. 建立增值税进项发票审核机制，确保合规抵扣\n2. 梳理研发费用加计扣除相关资料，充分享受税收优惠\n3. 关注关联交易定价合理性，防范转让定价风险` :
            templateType === 'T003' ? 
            `${clientName}的内部控制体系设计合理，运行有效，能够为企业经营管理提供合理保障。\n\n建议：\n1. 加强固定资产盘点制度执行力度，确保账实相符\n2. 完善信息系统权限管理，防范数据安全风险\n3. 优化合同审批流程，减少潜在法律风险` :
            `${clientName}整体财务状况良好，具有较强的盈利能力和发展潜力。\n\n建议：\n1. 优化资本结构，降低财务成本\n2. 加强应收账款管理，提高资金使用效率\n3. 建立更完善的预算控制体系，提升成本管控能力`,
          order: 4,
          aiGenerated: true,
        }
      ],
      rawContent: `# ${reportName}\n\n本报告是关于${clientName}的${reportType}，基于我们的专业评估和审核工作。\n\n## 一、项目概述\n\n我们接受${clientName}的委托，对其进行了全面的专业服务。本次工作的主要目标是评估财务报表的公允性、内部控制的有效性以及相关合规情况。\n\n工作开展期间为2025年1月至2025年3月，我们严格遵循相关专业准则和法规要求完成了各项程序。\n\n## 二、主要发现\n\n1. 财务报表在所有重大方面按照企业会计准则编制，公允反映了${clientName}的财务状况、经营成果和现金流量。\n2. 会计政策选用恰当，会计估计合理。\n3. 财务报表附注披露充分、适当。\n\n## 三、结论与建议\n\n根据我们的审计工作，我们认为${clientName}的财务报表在所有重大方面按照企业会计准则的规定编制，公允反映了2025年3月31日的财务状况以及2025年第一季度的经营成果和现金流量。\n\n建议：\n1. 加强应收账款管理，制定更严格的账龄分析和跟踪制度\n2. 优化存货管理流程，减少呆滞物料\n3. 完善财务报告内部控制，确保信息及时准确`
    };
  };
  
  // 获取模板内容
  const getTemplateContent = (templateId: string) => {
    switch (templateId) {
      case 'T001':
        return "# 审计报告\n\n## 一、项目概述\n[根据客户情况填写]\n\n## 二、审计范围\n[根据客户情况填写]\n\n## 三、审计发现\n[根据客户情况填写]\n\n## 四、审计结论\n[根据客户情况填写]\n\n## 五、建议\n[根据客户情况填写]";
      case 'T002':
        return "# 税务咨询报告\n\n## 一、基本情况\n[根据客户情况填写]\n\n## 二、税务风险分析\n[根据客户情况填写]\n\n## 三、税收筹划建议\n[根据客户情况填写]\n\n## 四、实施方案\n[根据客户情况填写]";
      default:
        return "";
    }
  };

  return (
    <>
      <Card bordered={false}>
        <Row gutter={16} align="middle" justify="space-between">
          <Col>
            <Title level={4} style={{ margin: 0 }}>智能报告生成</Title>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
              新建报告
            </Button>
          </Col>
        </Row>
      </Card>
      
      <Card bordered={false} style={{ marginTop: 16 }}>
        <Tabs defaultActiveKey="1">
          <TabPane
            tab={
              <span>
                <FileTextOutlined />
                我的报告
              </span>
            }
            key="1"
          >
            <div style={{ marginBottom: 16 }}>
              <Space size="large">
                <Input
                  placeholder="搜索报告名称/编号"
                  prefix={<SearchOutlined />}
                  style={{ width: 300 }}
                />
                <Select placeholder="报告状态" style={{ width: 150 }}>
                  <Option value="草稿">草稿</Option>
                  <Option value="审核中">审核中</Option>
                  <Option value="已定稿">已定稿</Option>
                  <Option value="待修订">待修订</Option>
                </Select>
                <Select placeholder="合规状态" style={{ width: 150 }}>
                  <Option value="通过">通过</Option>
                  <Option value="需修改">需修改</Option>
                </Select>
              </Space>
            </div>
            
            <Table 
              columns={reportsColumns} 
              dataSource={reportData} 
              rowKey="id"
              pagination={{ 
                pageSize: 10,
                showTotal: (total) => `共 ${total} 份报告`
              }}
            />
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <HistoryOutlined />
                报告模板
              </span>
            }
            key="2"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <Space size="large">
                <Input
                  placeholder="搜索模板名称/编号"
                  prefix={<SearchOutlined />}
                  style={{ width: 300 }}
                />
                <Select placeholder="模板分类" style={{ width: 150 }}>
                  <Option value="审计">审计</Option>
                  <Option value="税务">税务</Option>
                  <Option value="内控">内控</Option>
                  <Option value="尽调">尽调</Option>
                </Select>
              </Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={showTemplateModal}>
                新建模板
              </Button>
            </div>
            
            <Table 
              columns={templateColumns} 
              dataSource={templateData} 
              rowKey="id"
              pagination={{ 
                pageSize: 10,
                showTotal: (total) => `共 ${total} 个模板`
              }}
            />
          </TabPane>
        </Tabs>
      </Card>
      
      <Modal
        title="创建新报告"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={700}
        footer={[
          <Button key="back" onClick={handleCancel}>
            取消
          </Button>,
          <Button 
            key="ai" 
            type="default" 
            onClick={handleAIGenerate}
            loading={isAIGenerating}
            disabled={isAIGenerating}
          >
            {isAIGenerating ? '生成中...' : 'AI预生成'}
          </Button>,
          <Button key="submit" type="primary" onClick={handleOk}>
            创建
          </Button>,
        ]}
      >
        <Form layout="vertical" form={reportForm}>
          <Form.Item 
            name="name" 
            label="报告名称" 
            rules={[{ required: true, message: '请输入报告名称' }]}
          >
            <Input placeholder="请输入报告名称" />
          </Form.Item>
          
          <Form.Item 
            name="template" 
            label="选择模板" 
            rules={[{ required: true, message: '请选择报告模板' }]}
          >
            <Select placeholder="请选择报告模板" style={{ width: '100%' }}>
              <Option value="T001">标准审计报告模板</Option>
              <Option value="T002">税务咨询报告模板</Option>
              <Option value="T003">内控评估报告模板</Option>
              <Option value="T004">财务尽职调查报告模板</Option>
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="project" 
            label="关联项目" 
            rules={[{ required: true, message: '请选择关联项目' }]}
          >
            <Select placeholder="请选择关联项目" style={{ width: '100%' }} showSearch>
              <Option value="P20250331001">杭州智联科技年度审计</Option>
              <Option value="P20250327002">上海贸易集团税务咨询</Option>
              <Option value="P20250320003">北京健康医疗上市审计</Option>
              <Option value="P20250315004">广州餐饮集团内控评估</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="files" label="上传参考资料">
            <Upload>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
          
          <Form.Item name="aiAssist" label="启用智能辅助">
            <Select defaultValue="all" style={{ width: '100%' }}>
              <Option value="all">全部启用</Option>
              <Option value="structure">结构化生成</Option>
              <Option value="data">数据自动填充</Option>
              <Option value="regulation">法规智能推荐</Option>
              <Option value="none">不启用</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="aiModel" label="选择AI模型">
            <Select 
              defaultValue="deepseek.r1" 
              style={{ width: '100%' }}
              onChange={(value) => setSelectedAIModel(value)}
            >
              <Option value="deepseek.r1">Deepseek R1</Option>
              <Option value="deepseek.v3">Deepseek V3</Option>
            </Select>
          </Form.Item>
          
          {aiReportContent && (
            <div style={{ marginTop: 16 }}>
              <Alert
                message={`已使用${getAIModelName(selectedAIModel)}生成报告内容`}
                description="系统已根据您提供的信息生成报告内容。创建报告后，您可以进一步编辑和完善。"
                type="success"
                showIcon
              />
              
              <div style={{ marginTop: 16, maxHeight: 300, overflow: 'auto', border: '1px solid #f0f0f0', padding: 16, borderRadius: 4 }}>
                <h3>报告预览</h3>
                {aiReportContent.sections.map((section: any, index: number) => (
                  <div key={index} style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 'bold' }}>{section.title}</div>
                    <div style={{ whiteSpace: 'pre-line' }}>{section.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Form>
      </Modal>
      
      <Modal
        title="创建新模板"
        open={isTemplateModalVisible}
        onOk={handleTemplateOk}
        onCancel={handleTemplateCancel}
        width={700}
      >
        <Form layout="vertical" form={templateForm}>
          <Form.Item label="模板名称" required>
            <Input placeholder="请输入模板名称" />
          </Form.Item>
          
          <Form.Item label="模板分类" required>
            <Select placeholder="请选择模板分类" style={{ width: '100%' }}>
              <Option value="审计">审计</Option>
              <Option value="税务">税务</Option>
              <Option value="内控">内控</Option>
              <Option value="尽调">尽调</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="模板内容" required>
            <Input.TextArea rows={8} placeholder="请输入模板内容或上传文件" />
          </Form.Item>
          
          <Form.Item label="上传模板文件">
            <Upload>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
          
          <Form.Item label="设置权限">
            <Select defaultValue="all" style={{ width: '100%' }}>
              <Option value="all">所有人可用</Option>
              <Option value="manager">仅经理及以上</Option>
              <Option value="partner">仅合伙人可用</Option>
              <Option value="self">仅自己可用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 编辑报告对话框 */}
      <Modal
        title="编辑报告"
        open={isEditModalVisible}
        onOk={handleEditReportOk}
        onCancel={handleEditReportCancel}
        width={800}
        bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
      >
        <Form 
          form={editReportForm}
          layout="vertical"
          initialValues={currentReport}
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item 
                name="name" 
                label="报告名称" 
                rules={[{ required: true, message: '请输入报告名称' }]}
              >
                <Input placeholder="请输入报告名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                name="project" 
                label="关联项目"
                rules={[{ required: true, message: '请选择关联项目' }]}
              >
                <Select placeholder="请选择关联项目">
                  <Option value="P20250331001">杭州智联科技年度审计</Option>
                  <Option value="P20250327002">上海贸易集团税务咨询</Option>
                  <Option value="P20250320003">北京健康医疗上市审计</Option>
                  <Option value="P20250315004">广州餐饮集团内控评估</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="status" 
                label="报告状态"
                rules={[{ required: true, message: '请选择报告状态' }]}
              >
                <Select placeholder="请选择报告状态">
                  <Option value="草稿">草稿</Option>
                  <Option value="审核中">审核中</Option>
                  <Option value="已定稿">已定稿</Option>
                  <Option value="待修订">待修订</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="compliance" 
                label="合规检查结果"
                rules={[{ required: true, message: '请选择合规检查结果' }]}
              >
                <Select placeholder="请选择合规检查结果">
                  <Option value="通过">通过</Option>
                  <Option value="需修改">需修改</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item 
            name="content" 
            label="报告内容"
            rules={[{ required: true, message: '请输入报告内容' }]}
          >
            <Input.TextArea rows={12} placeholder="请输入报告内容" />
          </Form.Item>
          
          <Form.Item name="reviewers" label="审核人员">
            <Select 
              mode="multiple" 
              placeholder="请选择审核人员"
              style={{ width: '100%' }}
            >
              <Option value="张明">张明</Option>
              <Option value="李刚">李刚</Option>
              <Option value="王琳">王琳</Option>
              <Option value="赵伟">赵伟</Option>
              <Option value="陈静">陈静</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="remarks" label="备注说明">
            <Input.TextArea rows={3} placeholder="请输入备注说明" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 报告预览模态框 */}
      <Modal
        title={`报告预览: ${previewReport?.name || ''}`}
        open={isPreviewModalVisible}
        onCancel={handlePreviewCancel}
        width={800}
        footer={[
          <Button key="close" onClick={handlePreviewCancel}>
            关闭
          </Button>,
          <Button key="print" type="primary">
            打印
          </Button>
        ]}
      >
        {previewReport && (
          <div style={{ padding: '20px' }}>
            <Title level={2} style={{ textAlign: 'center' }}>{previewReport.name}</Title>
            <Divider />
            
            <div style={{ marginBottom: '20px' }}>
              <Text strong>报告编号：</Text> {previewReport.id}<br />
              <Text strong>项目名称：</Text> {previewReport.projectName}<br />
              <Text strong>创建人：</Text> {previewReport.creator}<br />
              <Text strong>更新时间：</Text> {previewReport.updateTime}<br />
              <Text strong>状态：</Text> <Tag color={previewReport.status === '已定稿' ? 'green' : 'blue'}>{previewReport.status}</Tag>
            </div>
            
            <Divider orientation="left">报告内容</Divider>
            <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '5px', minHeight: '300px' }}>
              <div>
                <Title level={4}>一、项目概述</Title>
                <Paragraph>
                  本报告是针对{previewReport.projectName}项目的{previewReport.name.includes('审计') ? '审计' : 
                  previewReport.name.includes('税务') ? '税务咨询' : 
                  previewReport.name.includes('内控') ? '内控评估' : '财务'}报告。
                  项目于2025年初启动，目的是{previewReport.name.includes('审计') ? '对该公司财务状况进行年度审计' : 
                  previewReport.name.includes('税务') ? '评估该公司税务合规性并提供咨询建议' : 
                  previewReport.name.includes('内控') ? '评估该公司内部控制体系的有效性' : '进行全面财务分析'}。
                </Paragraph>
              </div>
              <div>
                <Title level={4}>二、主要发现</Title>
                <Paragraph>
                  通过详细分析和评估，我们发现以下几点关键信息：
                  <ul>
                    <li>财务数据整体表现{previewReport.compliance === '通过' ? '良好，符合行业标准' : '存在一定问题，需要进一步调整'}</li>
                    <li>{previewReport.name.includes('审计') ? '会计政策适用合理，财务报表数据真实' : 
                    previewReport.name.includes('税务') ? '税务申报及缴纳整体合规，存在部分优化空间' : 
                    previewReport.name.includes('内控') ? '内部控制体系基本完善，个别环节需加强' : '财务结构健康，现金流管理需要优化'}</li>
                    <li>信息披露{previewReport.compliance === '通过' ? '充分，透明度高' : '有待完善，部分关键信息不够清晰'}</li>
                  </ul>
                </Paragraph>
              </div>
              <div>
                <Title level={4}>三、结论与建议</Title>
                <Paragraph>
                  基于上述分析，我们得出以下结论和建议：
                  <ol>
                    <li>{previewReport.compliance === '通过' ? 
                      '该公司整体运营状况良好，建议继续保持现有管理模式' : 
                      '公司需要在若干方面进行调整，以提高合规性和运营效率'}</li>
                    <li>建议{previewReport.name.includes('审计') ? '完善财务报表附注，增强信息透明度' : 
                    previewReport.name.includes('税务') ? '优化税务筹划，降低合规税负' : 
                    previewReport.name.includes('内控') ? '加强关键业务流程控制点监督' : '调整资本结构，优化资金配置'}</li>
                    <li>后续工作重点应放在{previewReport.name.includes('审计') ? '提高财务数据质量' : 
                    previewReport.name.includes('税务') ? '税务风险预防' : 
                    previewReport.name.includes('内控') ? '内控体系持续改进' : '财务战略调整'}上</li>
                  </ol>
                </Paragraph>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 版本历史模态框 */}
      <Modal
        title={`版本历史: ${versionReport?.name || ''}`}
        open={isVersionModalVisible}
        onCancel={handleVersionCancel}
        footer={[
          <Button key="close" onClick={handleVersionCancel}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {versionReport && (
          <Table
            dataSource={versionHistory}
            rowKey="version"
            pagination={false}
            columns={[
              {
                title: '版本号',
                dataIndex: 'version',
                key: 'version',
              },
              {
                title: '修改人',
                dataIndex: 'updater',
                key: 'updater',
              },
              {
                title: '修改时间',
                dataIndex: 'updateTime',
                key: 'updateTime',
              },
              {
                title: '修改说明',
                dataIndex: 'remark',
                key: 'remark',
              },
              {
                title: '操作',
                key: 'action',
                render: (_, record) => (
                  <Space size="small">
                    <Button type="link" size="small" onClick={() => viewSpecificVersion(record.version)}>
                      查看
                    </Button>
                    <Button type="link" size="small" onClick={() => restoreSpecificVersion(record.version)}>
                      恢复
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Modal>

      {/* 编辑模板模态框 */}
      <Modal
        title="编辑报告模板"
        open={isEditTemplateModalVisible}
        onOk={handleEditTemplateOk}
        onCancel={handleEditTemplateCancel}
        width={700}
      >
        <Form layout="vertical" form={editTemplateForm}>
          <Form.Item 
            name="id" 
            label="模板编号"
          >
            <Input disabled />
          </Form.Item>
          
          <Form.Item 
            name="name" 
            label="模板名称" 
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="请输入模板名称" />
          </Form.Item>
          
          <Form.Item 
            name="category" 
            label="模板分类" 
            rules={[{ required: true, message: '请选择模板分类' }]}
          >
            <Select placeholder="请选择模板分类">
              <Option value="审计">审计</Option>
              <Option value="税务">税务</Option>
              <Option value="内控">内控</Option>
              <Option value="尽调">尽调</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="content" 
            label="模板内容" 
            rules={[{ required: true, message: '请输入模板内容' }]}
          >
            <Input.TextArea rows={8} placeholder="请输入模板内容" />
          </Form.Item>
          
          <Form.Item name="upload" label="更新模板文件">
            <Upload>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
          
          <Form.Item 
            name="permissions" 
            label="设置权限"
            rules={[{ required: true, message: '请设置权限' }]}
          >
            <Select placeholder="请设置权限">
              <Option value="all">所有人可用</Option>
              <Option value="manager">仅经理及以上</Option>
              <Option value="partner">仅合伙人可用</Option>
              <Option value="self">仅自己可用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

ReportGeneration.getLayout = (page: React.ReactElement) => {
  return (
    <AppLayout>
      {page}
    </AppLayout>
  );
};

export default ReportGeneration; 