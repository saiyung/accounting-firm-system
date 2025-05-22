import React, { useState } from 'react';
import { Card, Row, Col, Typography, Space, Button, Divider, Modal, Tabs, Input, Select, Form, Table, Upload, message, InputNumber, Radio, DatePicker } from 'antd';
import { 
  CalculatorOutlined, 
  FileSearchOutlined, 
  FileExcelOutlined, 
  FilePdfOutlined, 
  BarChartOutlined, 
  BuildOutlined, 
  CloudDownloadOutlined, 
  LockOutlined, 
  RocketOutlined, 
  TranslationOutlined, 
  BarcodeOutlined, 
  FormOutlined,
  BookOutlined,
  FundOutlined,
  SafetyOutlined,
  MessageOutlined,
  ApartmentOutlined,
  FileZipOutlined,
  SearchOutlined,
  UploadOutlined,
  CloseOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { NextPage } from 'next';
import Link from 'next/link';
import AppLayout from '@/components/Layout';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

// 工具类别定义
const toolCategories = [
  {
    title: '日常工具',
    tools: [
      { 
        icon: <CalculatorOutlined style={{ fontSize: 36, color: '#1890ff' }} />, 
        title: '税务计算器', 
        description: '快速计算税额、预提所得税等',
        link: '/tools/tax-calculator',
        color: '#e6f7ff',
        id: 'tax-calculator'
      },
      { 
        icon: <FileSearchOutlined style={{ fontSize: 36, color: '#52c41a' }} />, 
        title: '法规检索', 
        description: '检索最新会计准则与税务法规',
        link: '/tools/regulations',
        color: '#f6ffed',
        id: 'regulations'
      },
      { 
        icon: <TranslationOutlined style={{ fontSize: 36, color: '#722ed1' }} />, 
        title: '专业术语翻译', 
        description: '会计、审计、税务专业术语中英互译',
        link: '/tools/terminology',
        color: '#f9f0ff',
        id: 'terminology'
      },
      { 
        icon: <FormOutlined style={{ fontSize: 36, color: '#eb2f96' }} />, 
        title: '工作底稿模板', 
        description: '标准化工作底稿模板库',
        link: '/tools/workpaper-templates',
        color: '#fff0f6',
        id: 'workpaper-templates'
      }
    ]
  },
  {
    title: '文档工具',
    tools: [
      { 
        icon: <FileExcelOutlined style={{ fontSize: 36, color: '#52c41a' }} />, 
        title: 'Excel处理工具', 
        description: '数据透视表、公式与财务函数向导',
        link: '/tools/excel',
        color: '#f6ffed',
        id: 'excel'
      },
      { 
        icon: <FilePdfOutlined style={{ fontSize: 36, color: '#f5222d' }} />, 
        title: 'PDF转换工具', 
        description: 'PDF与Word、Excel互转',
        link: '/tools/pdf-converter',
        color: '#fff1f0',
        id: 'pdf-converter'
      },
      { 
        icon: <BarcodeOutlined style={{ fontSize: 36, color: '#faad14' }} />, 
        title: '条码/二维码生成', 
        description: '生成各类条码、二维码',
        link: '/tools/barcode-generator',
        color: '#fff7e6',
        id: 'barcode-generator'
      },
      { 
        icon: <FileZipOutlined style={{ fontSize: 36, color: '#13c2c2' }} />, 
        title: '文件压缩/加密', 
        description: '文件打包与密码保护',
        link: '/tools/file-compressor',
        color: '#e6fffb',
        id: 'file-compressor'
      }
    ]
  },
  {
    title: '分析工具',
    tools: [
      { 
        icon: <BarChartOutlined style={{ fontSize: 36, color: '#1890ff' }} />, 
        title: '财务比率分析', 
        description: '计算并分析关键财务指标',
        link: '/tools/financial-ratios',
        color: '#e6f7ff',
        id: 'financial-ratios'
      },
      { 
        icon: <FundOutlined style={{ fontSize: 36, color: '#fa8c16' }} />, 
        title: '趋势分析工具', 
        description: '财务数据时间序列分析',
        link: '/tools/trend-analysis',
        color: '#fff7e6',
        id: 'trend-analysis'
      },
      { 
        icon: <ApartmentOutlined style={{ fontSize: 36, color: '#722ed1' }} />, 
        title: '流程图生成器', 
        description: '业务流程与内控流程图绘制',
        link: '/tools/flowchart',
        color: '#f9f0ff',
        id: 'flowchart'
      },
      { 
        icon: <BookOutlined style={{ fontSize: 36, color: '#eb2f96' }} />, 
        title: '会计账簿模拟', 
        description: '总账、明细账、日记账模拟',
        link: '/tools/ledger-simulation',
        color: '#fff0f6',
        id: 'ledger-simulation'
      }
    ]
  },
  {
    title: '专业工具',
    tools: [
      { 
        icon: <SafetyOutlined style={{ fontSize: 36, color: '#f5222d' }} />, 
        title: '风险评估工具', 
        description: '审计风险评估与内控测试',
        link: '/tools/risk-assessment',
        color: '#fff1f0',
        id: 'risk-assessment'
      },
      { 
        icon: <BuildOutlined style={{ fontSize: 36, color: '#13c2c2' }} />, 
        title: '抽样计算器', 
        description: '审计抽样规模与方法计算',
        link: '/tools/sampling-calculator',
        color: '#e6fffb',
        id: 'sampling-calculator'
      },
      { 
        icon: <RocketOutlined style={{ fontSize: 36, color: '#1890ff' }} />, 
        title: 'AI审计助手', 
        description: '智能审计发现与异常检测',
        link: '/tools/ai-audit',
        color: '#e6f7ff',
        id: 'ai-audit'
      },
      { 
        icon: <MessageOutlined style={{ fontSize: 36, color: '#52c41a' }} />, 
        title: '客户沟通助手', 
        description: '专业沟通话术与邮件模板',
        link: '/tools/communication',
        color: '#f6ffed',
        id: 'communication'
      }
    ]
  }
];

// 法规数据示例
const regulationsData = [
  {
    key: '1',
    title: '企业会计准则第14号——收入（2024年修订）',
    category: '会计准则',
    issueDate: '2024-03-15',
    effectiveDate: '2024-06-01',
    source: '财政部'
  },
  {
    key: '2',
    title: '关于进一步加强企业环境信息依法披露监管工作的指导意见',
    category: '信息披露',
    issueDate: '2024-01-18',
    effectiveDate: '2024-01-18',
    source: '证监会'
  },
  {
    key: '3',
    title: '企业所得税优惠政策指引（2024版）',
    category: '税法',
    issueDate: '2024-04-10',
    effectiveDate: '2024-05-01',
    source: '国家税务总局'
  },
  {
    key: '4',
    title: '关于支持民营经济发展财税政策措施的通知',
    category: '税法',
    issueDate: '2023-11-28',
    effectiveDate: '2024-01-01',
    source: '财政部、税务总局'
  },
  {
    key: '5',
    title: '金融企业财务规则（2024年修订）',
    category: '财务规则',
    issueDate: '2024-02-25',
    effectiveDate: '2024-04-01',
    source: '财政部'
  },
  {
    key: '6',
    title: '注册会计师审计准则第1522号——对财务报表形成审计意见和出具审计报告',
    category: '审计准则',
    issueDate: '2023-09-15',
    effectiveDate: '2024-01-01',
    source: '中国注册会计师协会'
  },
  {
    key: '7',
    title: '个人所得税法实施条例（2023年修订）',
    category: '税法',
    issueDate: '2023-08-12',
    effectiveDate: '2023-10-01',
    source: '国务院'
  },
  {
    key: '8',
    title: '关于促进养老托育服务业高质量发展的若干财税措施',
    category: '行业支持',
    issueDate: '2024-05-20',
    effectiveDate: '2024-07-01',
    source: '财政部、税务总局'
  },
  {
    key: '9',
    title: '上市公司独立董事管理办法（2025版）',
    category: '公司治理',
    issueDate: '2025-01-10',
    effectiveDate: '2025-03-01',
    source: '证监会'
  },
  {
    key: '10',
    title: '关于完善企业碳排放权交易财务核算的指导意见',
    category: '环保财务',
    issueDate: '2024-11-15',
    effectiveDate: '2025-01-01',
    source: '财政部'
  }
];

// 术语词典示例
const terminologyData = [
  { key: '1', cn: '资产负债表', en: 'Balance Sheet', category: '财务报表' },
  { key: '2', cn: '应收账款', en: 'Accounts Receivable', category: '会计科目' },
  { key: '3', cn: '固定资产折旧', en: 'Depreciation of Fixed Assets', category: '会计处理' },
  { key: '4', cn: '审计风险', en: 'Audit Risk', category: '审计' },
  { key: '5', cn: '所得税费用', en: 'Income Tax Expense', category: '税务' },
  { key: '6', cn: '内部控制', en: 'Internal Control', category: '内控' },
  { key: '7', cn: '会计政策', en: 'Accounting Policies', category: '会计准则' },
  { key: '8', cn: '不确定性', en: 'Uncertainty', category: '审计' },
  { key: '9', cn: '利润表', en: 'Income Statement', category: '财务报表' },
  { key: '10', cn: '现金流量表', en: 'Cash Flow Statement', category: '财务报表' },
  { key: '11', cn: '所有者权益变动表', en: 'Statement of Changes in Equity', category: '财务报表' },
  { key: '12', cn: '财务报表附注', en: 'Notes to Financial Statements', category: '财务报表' },
  { key: '13', cn: '坏账准备', en: 'Allowance for Bad Debts', category: '会计科目' },
  { key: '14', cn: '无形资产摊销', en: 'Amortization of Intangible Assets', category: '会计处理' },
  { key: '15', cn: '递延所得税资产', en: 'Deferred Tax Assets', category: '会计科目' },
  { key: '16', cn: '递延所得税负债', en: 'Deferred Tax Liabilities', category: '会计科目' },
  { key: '17', cn: '预提费用', en: 'Accrued Expenses', category: '会计科目' },
  { key: '18', cn: '预收款项', en: 'Advances from Customers', category: '会计科目' },
  { key: '19', cn: '长期股权投资', en: 'Long-term Equity Investments', category: '会计科目' },
  { key: '20', cn: '存货跌价准备', en: 'Provision for Inventory Impairment', category: '会计处理' },
  { key: '21', cn: '重要性水平', en: 'Materiality Level', category: '审计' },
  { key: '22', cn: '审计抽样', en: 'Audit Sampling', category: '审计' },
  { key: '23', cn: '控制测试', en: 'Tests of Controls', category: '审计' },
  { key: '24', cn: '实质性程序', en: 'Substantive Procedures', category: '审计' },
  { key: '25', cn: '舞弊风险', en: 'Fraud Risk', category: '审计' },
  { key: '26', cn: '职业怀疑态度', en: 'Professional Skepticism', category: '审计' },
  { key: '27', cn: '审计证据', en: 'Audit Evidence', category: '审计' },
  { key: '28', cn: '函证', en: 'Confirmation', category: '审计' },
  { key: '29', cn: '期后事项', en: 'Subsequent Events', category: '审计' },
  { key: '30', cn: '持续经营假设', en: 'Going Concern Assumption', category: '审计' },
  { key: '31', cn: '增值税', en: 'Value-Added Tax (VAT)', category: '税务' },
  { key: '32', cn: '企业所得税', en: 'Corporate Income Tax', category: '税务' },
  { key: '33', cn: '个人所得税', en: 'Individual Income Tax', category: '税务' },
  { key: '34', cn: '纳税调整', en: 'Tax Adjustment', category: '税务' },
  { key: '35', cn: '税务筹划', en: 'Tax Planning', category: '税务' },
  { key: '36', cn: '税收优惠', en: 'Tax Incentives', category: '税务' },
  { key: '37', cn: '税收抵免', en: 'Tax Credit', category: '税务' },
  { key: '38', cn: '资产减值', en: 'Asset Impairment', category: '会计处理' },
  { key: '39', cn: '权责发生制', en: 'Accrual Basis', category: '会计准则' },
  { key: '40', cn: '收入确认', en: 'Revenue Recognition', category: '会计准则' },
  { key: '41', cn: '合并财务报表', en: 'Consolidated Financial Statements', category: '财务报表' },
  { key: '42', cn: '非控制性权益', en: 'Non-controlling Interest', category: '会计科目' },
  { key: '43', cn: '商誉', en: 'Goodwill', category: '会计科目' },
  { key: '44', cn: '经营租赁', en: 'Operating Lease', category: '会计处理' },
  { key: '45', cn: '融资租赁', en: 'Finance Lease', category: '会计处理' },
  { key: '46', cn: '关联方交易', en: 'Related Party Transactions', category: '会计处理' },
  { key: '47', cn: '或有负债', en: 'Contingent Liability', category: '会计科目' },
  { key: '48', cn: '公允价值', en: 'Fair Value', category: '会计准则' },
  { key: '49', cn: '会计估计变更', en: 'Change in Accounting Estimate', category: '会计处理' },
  { key: '50', cn: '会计差错更正', en: 'Correction of Accounting Errors', category: '会计处理' }
];

const ToolsPage: NextPage = () => {
  // 状态管理
  const [activeToolModal, setActiveToolModal] = useState<string | null>(null);
  const [taxForm] = Form.useForm();
  const [taxResult, setTaxResult] = useState<any>(null);
  const [regulationSearchText, setRegulationSearchText] = useState('');
  const [filteredRegulations, setFilteredRegulations] = useState(regulationsData);
  const [termSearchText, setTermSearchText] = useState('');
  const [filteredTerms, setFilteredTerms] = useState(terminologyData);
  const [pdfFiles, setPdfFiles] = useState<any[]>([]);

  // 打开工具模态框
  const openToolModal = (toolId: string) => {
    setActiveToolModal(toolId);
    
    // 如果是法规检索，重置筛选结果
    if (toolId === 'regulations') {
      setFilteredRegulations(regulationsData);
    }
    
    // 如果是术语翻译，重置筛选结果
    if (toolId === 'terminology') {
      setFilteredTerms(terminologyData);
    }
  };

  // 关闭模态框
  const closeToolModal = () => {
    setActiveToolModal(null);
    setTaxResult(null);
    setPdfFiles([]);
  };

  // 处理税务计算
  const handleTaxCalculation = (values: any) => {
    const { income, type, expenses, deductions } = values;
    
    let taxableIncome = income;
    let taxAmount = 0;
    
    // 减去费用和扣除额
    if (expenses) {
      taxableIncome -= expenses;
    }
    
    if (deductions) {
      taxableIncome -= deductions;
    }
    
    // 确保应税收入不为负
    taxableIncome = Math.max(0, taxableIncome);
    
    // 根据类型计算税额
    if (type === 'personal') {
      // 简化的个人所得税计算
      if (taxableIncome <= 36000) {
        taxAmount = taxableIncome * 0.03;
      } else if (taxableIncome <= 144000) {
        taxAmount = taxableIncome * 0.1 - 2520;
      } else if (taxableIncome <= 300000) {
        taxAmount = taxableIncome * 0.2 - 16920;
      } else if (taxableIncome <= 420000) {
        taxAmount = taxableIncome * 0.25 - 31920;
      } else if (taxableIncome <= 660000) {
        taxAmount = taxableIncome * 0.3 - 52920;
      } else if (taxableIncome <= 960000) {
        taxAmount = taxableIncome * 0.35 - 85920;
      } else {
        taxAmount = taxableIncome * 0.45 - 181920;
      }
    } else if (type === 'corporate') {
      // 简化的企业所得税计算
      taxAmount = taxableIncome * 0.25;
    } else if (type === 'vat') {
      // 简化的增值税计算
      taxAmount = taxableIncome * 0.13;
    }
    
    setTaxResult({
      taxableIncome: taxableIncome.toFixed(2),
      taxAmount: taxAmount.toFixed(2)
    });
  };

  // 处理法规搜索
  const handleRegulationSearch = (value: string) => {
    setRegulationSearchText(value);
    const filtered = regulationsData.filter(
      reg => 
        reg.title.toLowerCase().includes(value.toLowerCase()) ||
        reg.category.toLowerCase().includes(value.toLowerCase()) ||
        reg.source.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredRegulations(filtered);
  };

  // 处理术语搜索
  const handleTermSearch = (value: string) => {
    setTermSearchText(value);
    const filtered = terminologyData.filter(
      term => 
        term.cn.toLowerCase().includes(value.toLowerCase()) ||
        term.en.toLowerCase().includes(value.toLowerCase()) ||
        term.category.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredTerms(filtered);
  };

  // 处理PDF文件上传
  const handlePdfUpload = (info: any) => {
    const { status, name } = info.file;
    
    if (status === 'done') {
      message.success(`${name} 文件上传成功`);
      setPdfFiles([...pdfFiles, info.file]);
    } else if (status === 'error') {
      message.error(`${name} 文件上传失败`);
    }
  };

  // 渲染工具模态框内容
  const renderToolContent = () => {
    switch (activeToolModal) {
      case 'tax-calculator':
        return (
          <Card>
            <Form
              form={taxForm}
              layout="vertical"
              onFinish={handleTaxCalculation}
            >
              <Form.Item
                name="type"
                label="税种类型"
                rules={[{ required: true, message: '请选择税种类型' }]}
                initialValue="personal"
              >
                <Radio.Group>
                  <Radio.Button value="personal">个人所得税</Radio.Button>
                  <Radio.Button value="corporate">企业所得税</Radio.Button>
                  <Radio.Button value="vat">增值税</Radio.Button>
                </Radio.Group>
              </Form.Item>
              
              <Form.Item
                name="income"
                label="收入金额"
                rules={[{ required: true, message: '请输入收入金额' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入收入金额" />
              </Form.Item>
              
              <Form.Item name="expenses" label="费用支出">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入费用支出" />
              </Form.Item>
              
              <Form.Item name="deductions" label="税前扣除额">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入税前扣除额" />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit">计算税额</Button>
              </Form.Item>
            </Form>
            
            {taxResult && (
              <Card title="计算结果" style={{ marginTop: 16 }}>
                <p>应纳税所得额: ¥{taxResult.taxableIncome}</p>
                <p>应纳税额: ¥{taxResult.taxAmount}</p>
              </Card>
            )}
          </Card>
        );
        
      case 'regulations':
        return (
          <Card>
            <Input.Search
              placeholder="搜索法规标题、类别或来源"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={regulationSearchText}
              onChange={e => setRegulationSearchText(e.target.value)}
              onSearch={handleRegulationSearch}
              style={{ marginBottom: 16 }}
            />
            
            <Table
              dataSource={filteredRegulations}
              columns={[
                { title: '法规标题', dataIndex: 'title', key: 'title' },
                { title: '类别', dataIndex: 'category', key: 'category' },
                { title: '发布日期', dataIndex: 'issueDate', key: 'issueDate' },
                { title: '生效日期', dataIndex: 'effectiveDate', key: 'effectiveDate' },
                { title: '来源', dataIndex: 'source', key: 'source' },
                {
                  title: '操作',
                  key: 'action',
                  render: () => (
                    <Button type="link">查看详情</Button>
                  ),
                },
              ]}
              pagination={{ pageSize: 5 }}
            />
          </Card>
        );
        
      case 'terminology':
        return (
          <Card>
            <Input.Search
              placeholder="搜索中文或英文术语"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={termSearchText}
              onChange={e => setTermSearchText(e.target.value)}
              onSearch={handleTermSearch}
              style={{ marginBottom: 16 }}
            />
            
            <Table
              dataSource={filteredTerms}
              columns={[
                { title: '中文术语', dataIndex: 'cn', key: 'cn' },
                { title: '英文术语', dataIndex: 'en', key: 'en' },
                { title: '分类', dataIndex: 'category', key: 'category' },
              ]}
              pagination={{ pageSize: 5 }}
            />
          </Card>
        );
        
      case 'pdf-converter':
        return (
          <Card>
            <Tabs defaultActiveKey="pdf-to-word">
              <TabPane tab="PDF转Word" key="pdf-to-word">
                <Upload.Dragger
                  name="file"
                  multiple
                  action="/api/convert/pdf-to-word"
                  onChange={handlePdfUpload}
                  accept=".pdf"
                  showUploadList={true}
                  style={{ padding: '20px 0' }}
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽PDF文件到此区域上传</p>
                  <p className="ant-upload-hint">支持单个或批量上传，单个文件大小不超过20MB</p>
                </Upload.Dragger>
              </TabPane>
              
              <TabPane tab="PDF转Excel" key="pdf-to-excel">
                <Upload.Dragger
                  name="file"
                  multiple
                  action="/api/convert/pdf-to-excel"
                  onChange={handlePdfUpload}
                  accept=".pdf"
                  showUploadList={true}
                  style={{ padding: '20px 0' }}
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽PDF文件到此区域上传</p>
                  <p className="ant-upload-hint">支持单个或批量上传，单个文件大小不超过20MB</p>
                </Upload.Dragger>
              </TabPane>
              
              <TabPane tab="Word转PDF" key="word-to-pdf">
                <Upload.Dragger
                  name="file"
                  multiple
                  action="/api/convert/word-to-pdf"
                  onChange={handlePdfUpload}
                  accept=".doc,.docx"
                  showUploadList={true}
                  style={{ padding: '20px 0' }}
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽Word文件到此区域上传</p>
                  <p className="ant-upload-hint">支持单个或批量上传，单个文件大小不超过20MB</p>
                </Upload.Dragger>
              </TabPane>
              
              <TabPane tab="Excel转PDF" key="excel-to-pdf">
                <Upload.Dragger
                  name="file"
                  multiple
                  action="/api/convert/excel-to-pdf"
                  onChange={handlePdfUpload}
                  accept=".xls,.xlsx"
                  showUploadList={true}
                  style={{ padding: '20px 0' }}
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽Excel文件到此区域上传</p>
                  <p className="ant-upload-hint">支持单个或批量上传，单个文件大小不超过20MB</p>
                </Upload.Dragger>
              </TabPane>
            </Tabs>
          </Card>
        );
        
      default:
        return (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Title level={4}>功能开发中</Title>
              <Paragraph>该功能正在开发中，敬请期待！</Paragraph>
            </div>
          </Card>
        );
    }
  };

  return (
    <div className="tools-page">
      <Card bordered={false} style={{ marginBottom: 24 }}>
        <Title level={4}>更多功能</Title>
        <Paragraph>
          会计师事务所日常工作实用工具集，提高工作效率，降低出错风险。
        </Paragraph>
      </Card>

      {toolCategories.map((category, index) => (
        <Card 
          key={index} 
          title={category.title} 
          bordered={false} 
          style={{ marginBottom: 24 }}
        >
          <Row gutter={[24, 24]}>
            {category.tools.map((tool, toolIndex) => (
              <Col xs={24} sm={12} md={6} key={toolIndex}>
                <Card 
                  hoverable
                  style={{ 
                    height: '100%',
                    background: tool.color,
                    borderRadius: 8,
                    border: 'none'
                  }}
                  bodyStyle={{ padding: '20px' }}
                  onClick={() => openToolModal(tool.id)}
                >
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    {tool.icon}
                  </div>
                  <Title level={5} style={{ textAlign: 'center', marginTop: 0 }}>
                    {tool.title}
                  </Title>
                  <Paragraph style={{ textAlign: 'center', marginBottom: 16 }}>
                    {tool.description}
                  </Paragraph>
                  <div style={{ textAlign: 'center' }}>
                    <Button 
                      type="primary" 
                      shape="round" 
                      onClick={(e) => {
                        e.stopPropagation();
                        openToolModal(tool.id);
                      }}
                    >
                      使用工具
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      ))}

      <Card bordered={false}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={5}>未找到你需要的工具？</Title>
          <Paragraph>
            我们持续更新和开发新的工具以满足会计师事务所日常工作需求。如果您有任何建议或需求，请联系系统管理员。
          </Paragraph>
          <Button type="primary" icon={<RocketOutlined />}>提交工具建议</Button>
        </Space>
      </Card>

      {/* 工具模态框 */}
      <Modal
        title={
          activeToolModal && 
          toolCategories.flatMap(c => c.tools).find(t => t.id === activeToolModal)?.title
        }
        open={!!activeToolModal}
        onCancel={closeToolModal}
        width={800}
        footer={[
          <Button key="back" onClick={closeToolModal}>
            关闭
          </Button>
        ]}
      >
        {renderToolContent()}
      </Modal>
    </div>
  );
};

ToolsPage.getLayout = (page: React.ReactElement) => {
  return (
    <AppLayout>
      {page}
    </AppLayout>
  );
};

export default ToolsPage; 