import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Statistic, Typography, Dropdown, Button, Menu, DatePicker, Space, Tabs, Table, Tag, Progress, Badge, Select, Modal, Form, Input, message, Avatar, Tooltip, Timeline, List, Slider, Radio, Segmented, Spin, Empty, Checkbox, Divider, Alert } from 'antd';
import {
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  CalendarOutlined,
  DownOutlined,
  UserOutlined,
  RiseOutlined,
  FallOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EditOutlined,
  SaveOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  DragOutlined,
  HistoryOutlined,
  LockOutlined,
  TeamOutlined,
  FileTextOutlined,
  BellOutlined,
  EyeOutlined,
  SyncOutlined,
  NotificationOutlined,
  RobotOutlined,
  DatabaseOutlined,
  ProjectOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  LoadingOutlined,
  TagOutlined
} from '@ant-design/icons';
import { NextPage } from 'next';
import ReactEcharts from 'echarts-for-react';
import Link from 'next/link';
import AppLayout from '@/components/Layout';
import moment from 'moment';
// 导入甘特图相关依赖
import 'gantt-task-react/dist/index.css';
import { ViewMode, Task } from 'gantt-task-react';
import { Gantt } from 'gantt-task-react';
// 从@ant-design/pro-components导入PageHeader
import { PageHeader } from '@ant-design/pro-components';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

// 用户角色枚举
enum UserRole {
  EMPLOYEE = 'employee',
  PROJECT_MANAGER = 'manager',
  EXECUTIVE = 'executive'
}

// 项目状态类型
type ProjectStatus = 'planned' | 'progress' | 'review' | 'completed' | 'overdue';

// 项目风险等级
type RiskLevel = 'low' | 'medium' | 'high';

// 项目类型
type ProjectType = 'audit' | 'tax' | 'advisory' | 'accounting' | 'internal';

// 项目优先级
type PriorityLevel = 'low' | 'medium' | 'high';

// 甘特图任务类型
interface GanttTask extends Task {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  type: 'task';
  styles?: { progressColor?: string; progressSelectedColor?: string; };
  dependencies?: string[];
  isDisabled?: boolean;
  project?: string;
  hideChildren?: boolean;
  displayOrder?: number;
}

// 修改记录类型
interface ChangeLog {
  id: number;
  projectId: number;
  timestamp: string;
  user: string;
  field: string;
  oldValue: string;
  newValue: string;
  comment?: string;
}

// 项目团队成员类型
interface TeamMember {
  id: number;
  name: string;
  role: string;
  avatar?: string;
}

// 扩展的项目数据类型
interface Project {
  id: number;
  name: string;
  client: string;
  manager: string;
  team: TeamMember[];
  members?: string[];
  teamDetails?: TeamMember[];
  status: ProjectStatus;
  type: ProjectType;
  priority: PriorityLevel;
  startDate: string;
  deadline: string;
  progress: number;
  risk: RiskLevel;
  lastUpdate: string;
  description?: string;
  milestones?: {
    id: number;
    name: string;
    dueDate: string;
    completed: boolean;
  }[];
  notes?: string;
  changeLogs?: ChangeLog[];
  dependencies?: number[];
  assignedTo?: string[];
}

// 状态映射
const statusMap = {
  'planned': { text: '计划中', color: '#108ee9' },
  'progress': { text: '进行中', color: '#87d068' },
  'review': { text: '审核中', color: '#faad14' },
  'completed': { text: '已完成', color: '#52c41a' },
  'overdue': { text: '已逾期', color: '#f5222d' },
};

// 风险等级映射
const riskMap = {
  'low': { text: '低风险', color: '#52c41a', status: 'success' as const },
  'medium': { text: '中等风险', color: '#faad14', status: 'warning' as const },
  'high': { text: '高风险', color: '#f5222d', status: 'error' as const },
};

// 优先级映射
const priorityMap = {
  'low': { text: '低优先级', color: '#d9d9d9' },
  'medium': { text: '中等优先级', color: '#faad14' },
  'high': { text: '高优先级', color: '#f5222d' },
};

// 项目类型映射
const typeMap = {
  'audit': { text: '审计项目', color: '#1890ff' },
  'tax': { text: '税务项目', color: '#722ed1' },
  'advisory': { text: '咨询服务', color: '#13c2c2' },
  'accounting': { text: '会计服务', color: '#eb2f96' },
};

// 修改当前用户数据结构
const currentUser = {
  id: 1,
  name: '张明',
  role: 'manager' as UserRole,
  department: '审计部',
  projects: [1, 3, 5]
};

// 甘特图视图模式选项
const viewModeOptions = [
  { label: '日', value: 'Day' },
  { label: '周', value: 'Week' },
  { label: '月', value: 'Month' },
];

// 模拟项目数据
const mockProjects: Project[] = [
  {
    id: 1,
    name: '杭州智联科技年度审计',
    client: '智联科技有限公司',
    manager: '张明',
    team: [
      { id: 1, name: '张明', role: '项目经理', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
      { id: 2, name: '李娜', role: '高级审计师', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
      { id: 3, name: '王强', role: '审计师', avatar: 'https://randomuser.me/api/portraits/men/3.jpg' },
    ],
    members: ['张明', '李娜', '王强'],
    status: 'progress',
    type: 'audit',
    priority: 'high',
    startDate: '2025-03-15',
    deadline: '2025-04-30',
    progress: 65,
    risk: 'low',
    lastUpdate: '2025-03-29'
  },
  {
    id: 2,
    name: '上海贸易集团税务咨询',
    client: '上海国际贸易集团',
    manager: '李刚',
    team: [
      { id: 4, name: '李刚', role: '项目经理', avatar: 'https://randomuser.me/api/portraits/men/4.jpg' },
      { id: 5, name: '张丽', role: '税务专家', avatar: 'https://randomuser.me/api/portraits/women/5.jpg' },
    ],
    members: ['李刚', '张丽'],
    status: 'progress',
    type: 'tax',
    priority: 'medium',
    startDate: '2025-03-20',
    deadline: '2025-05-10',
    progress: 40,
    risk: 'medium',
    lastUpdate: '2025-03-28'
  },
  {
    id: 3,
    name: '北京健康医疗上市审计',
    client: '北京健康医疗科技',
    manager: '王琳',
    team: [
      { id: 6, name: '王琳', role: '项目经理', avatar: 'https://randomuser.me/api/portraits/women/6.jpg' },
      { id: 7, name: '赵伟', role: '高级审计师', avatar: 'https://randomuser.me/api/portraits/men/7.jpg' },
      { id: 8, name: '陈明', role: '审计师', avatar: 'https://randomuser.me/api/portraits/men/8.jpg' },
      { id: 9, name: '林芳', role: '审计助理', avatar: 'https://randomuser.me/api/portraits/women/9.jpg' },
    ],
    members: ['王琳', '赵伟', '陈明', '林芳'],
    status: 'progress',
    type: 'audit',
    priority: 'high',
    startDate: '2025-03-25',
    deadline: '2025-06-30',
    progress: 25,
    risk: 'high',
    lastUpdate: '2025-03-27'
  },
  {
    id: 4,
    name: '广州餐饮集团内控评估',
    client: '广州餐饮集团',
    manager: '赵伟',
    team: [
      { id: 10, name: '赵伟', role: '项目经理', avatar: 'https://randomuser.me/api/portraits/men/10.jpg' },
      { id: 11, name: '王丽', role: '内控专家', avatar: 'https://randomuser.me/api/portraits/women/11.jpg' },
    ],
    members: ['赵伟', '王丽'],
    status: 'progress',
    type: 'advisory',
    priority: 'low',
    startDate: '2025-03-10',
    deadline: '2025-04-20',
    progress: 80,
    risk: 'low',
    lastUpdate: '2025-03-29'
  },
  {
    id: 5,
    name: '深圳科技集团财务规划',
    client: '深圳科技有限公司',
    manager: '张明',
    team: [
      { id: 1, name: '张明', role: '项目经理', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
      { id: 11, name: '孙晓明', role: '财务分析师', avatar: 'https://randomuser.me/api/portraits/men/11.jpg' },
    ],
    members: ['张明', '孙晓明'],
    status: 'planned',
    type: 'accounting',
    priority: 'low',
    startDate: '2025-04-01',
    deadline: '2025-05-15',
    progress: 0,
    risk: 'low',
    notes: '等待项目启动',
    lastUpdate: '2025-03-26',
  },
];

const Dashboard: NextPage & { getLayout?: (page: React.ReactElement) => React.ReactNode } = () => {
  const [timeRange, setTimeRange] = useState('本月');
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');
  
  // 看板视图相关状态
  const [kanbanView, setKanbanView] = useState('status');
  const [sortBy, setSortBy] = useState('deadline');
  
  // 甘特图相关状态
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);
  
  // 项目历史变更状态
  const [changeLogVisible, setChangeLogVisible] = useState(false);
  const [projectChangeLogs, setProjectChangeLogs] = useState<ChangeLog[]>([]);
  
  // 权限控制相关状态
  const [userPermission, setUserPermission] = useState<{
    canEdit: boolean;
    canApprove: boolean;
    canViewAll: boolean;
  }>({
    canEdit: currentUser.role !== UserRole.EMPLOYEE, 
    canApprove: currentUser.role === UserRole.EXECUTIVE,
    canViewAll: currentUser.role !== UserRole.EMPLOYEE
  });
  
  // 拖拽进度状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  
  // 汇总统计数据
  const [teamPerformance, setTeamPerformance] = useState<any[]>([]);
  
  // 分析建议
  const [aiSuggestions, setAiSuggestions] = useState<{
    title: string;
    content: string;
    type: 'success' | 'info' | 'warning' | 'error';
  }[]>([]);
  const [loadingAI, setIsLoadingAI] = useState(false);
  
  // 项目统计数据状态
  const [stats, setStats] = useState({
    total: projects.length,
    inProgress: projects.filter(p => p.status === 'progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    planned: projects.filter(p => p.status === 'planned').length,
    overdue: projects.filter(p => {
      const now = new Date();
      const deadline = new Date(p.deadline);
      return deadline < now && p.status !== 'completed';
    }).length,
    highRisk: projects.filter(p => p.risk === 'high').length,
    onTrack: projects.filter(p => {
      const now = new Date().getTime();
      const start = new Date(p.startDate).getTime();
      const end = new Date(p.deadline).getTime();
      const elapsed = now - start;
      const total = end - start;
      const plannedProgress = Math.min(100, Math.max(0, Math.round(elapsed / total * 100)));
      
      return p.status === 'progress' && p.progress >= plannedProgress;
    }).length,
    behindSchedule: projects.filter(p => {
      const now = new Date().getTime();
      const start = new Date(p.startDate).getTime();
      const end = new Date(p.deadline).getTime();
      const elapsed = now - start;
      const total = end - start;
      const plannedProgress = Math.min(100, Math.max(0, Math.round(elapsed / total * 100)));
      
      return p.status === 'progress' && p.progress < plannedProgress;
    }).length,
  });
  
  // 初始化甘特图数据
  useEffect(() => {
    convertProjectsToGanttTasks();
    generateTeamPerformance();
    // 初始化模拟的变更历史记录
    initializeChangeLogs();
    // 模拟获取分析建议
    generateAISuggestions();
  }, [projects]);
  
  // 在组件初始化时，从localStorage或API获取最新项目信息
  useEffect(() => {
    // 尝试从localStorage获取项目数据
    const storedProjects = localStorage.getItem('projectData');
    if (storedProjects) {
      try {
        // 解析存储的项目数据
        const parsedProjects = JSON.parse(storedProjects);
        
        // 转换项目状态格式
        const convertedProjects = parsedProjects.map((project: any) => {
          // 转换状态格式
          let status: ProjectStatus = 'planned';
          if (project.status === '进行中') status = 'progress';
          else if (project.status === '已完成') status = 'completed';
          else if (project.status === '延期') status = 'overdue';
          else if (project.status === '待启动') status = 'planned';
          
          // 转换风险等级
          let risk: RiskLevel = 'low';
          if (project.risk === '中') risk = 'medium';
          else if (project.risk === '高') risk = 'high';
          
          // 创建兼容的项目对象
          return {
            id: parseInt(project.id.replace(/\D/g, '')) || Math.floor(Math.random() * 1000),
            name: project.name,
            client: project.client,
            manager: project.manager,
            team: [],
            members: project.members || [],
            status,
            type: 'audit', // 默认类型
            priority: 'medium', // 默认优先级
            startDate: project.startDate || new Date().toISOString().split('T')[0],
            deadline: project.deadline || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
            progress: project.progress || 50, // 使用传入的进度值或默认值
            risk,
            lastUpdate: new Date().toISOString().split('T')[0]
          };
        });
        
        // 更新本地状态
        setProjects(convertedProjects);
        console.log('已从localStorage加载并转换项目数据:', convertedProjects);
        
        // 重新计算统计数据和甘特图
        updateStats(convertedProjects);
        convertProjectsToGanttTasks(convertedProjects);
      } catch (error) {
        console.error('解析项目数据出错:', error);
        initializeData(); // 失败时使用默认数据
      }
    } else {
      // 没有存储数据时使用默认数据
      initializeData();
    }
  }, []);
  
  // 将项目数据转换为甘特图任务
  const convertProjectsToGanttTasks = (projectList?: Project[]) => {
    const projectsToUse = projectList || projects;
    
    const tasks: GanttTask[] = projectsToUse.map(project => {
      // 从开始日期和截止日期创建日期对象
      const start = new Date(project.startDate);
      const end = new Date(project.deadline);
      
      // 创建甘特图任务
      return {
        id: `task-${project.id}`,
        name: project.name,
        start: start,
        end: end,
        progress: project.progress / 100,
        type: 'task',
        project: project.client,
        styles: {
          progressColor: project.risk === 'high' ? '#f5222d' : project.risk === 'medium' ? '#faad14' : '#52c41a',
          progressSelectedColor: project.risk === 'high' ? '#ff7875' : project.risk === 'medium' ? '#ffd666' : '#95de64',
        }
      };
    });
    
    setGanttTasks(tasks);
  };
  
  // 初始化模拟的变更历史记录
  const initializeChangeLogs = () => {
    const mockChangeLogs: ChangeLog[] = [
      {
        id: 1,
        projectId: 1,
        timestamp: '2025-03-28 14:30',
        user: '张明',
        field: '进度',
        oldValue: '60%',
        newValue: '65%',
        comment: '完成初步风险评估'
      },
      {
        id: 2,
        projectId: 1,
        timestamp: '2025-03-27 10:15',
        user: '李娜',
        field: '文档',
        oldValue: '13份',
        newValue: '16份',
        comment: '上传了客户补充材料'
      },
      {
        id: 3,
        projectId: 2,
        timestamp: '2025-03-29 16:45',
        user: '李刚',
        field: '进度',
        oldValue: '35%',
        newValue: '40%',
        comment: '完成合同条款磋商'
      },
      {
        id: 4,
        projectId: 3,
        timestamp: '2025-03-30 09:30',
        user: '王琳',
        field: '风险等级',
        oldValue: '中',
        newValue: '高',
        comment: '发现客户内部控制存在重大问题'
      },
      {
        id: 5,
        projectId: 4,
        timestamp: '2025-03-25 11:20',
        user: '赵伟',
        field: '团队',
        oldValue: '1人',
        newValue: '2人',
        comment: '增加陈静顾问参与项目'
      }
    ];
    
    if (currentProject) {
      setProjectChangeLogs(mockChangeLogs.filter(log => log.projectId === currentProject.id));
    }
  };
  
  // 生成团队绩效数据
  const generateTeamPerformance = () => {
    // 创建一个临时的成员列表，从项目的members属性获取
    const allMembers: string[] = [];
    projects.forEach(project => {
      if (project.members) {
        project.members.forEach(member => {
          if (!allMembers.includes(member)) {
            allMembers.push(member);
          }
        });
      }
    });
    
    const performance = allMembers.map(member => {
      const memberProjects = projects.filter(p => p.members?.includes(member));
      const completedProjects = memberProjects.filter(p => p.status === 'completed').length;
      const onTrackProjects = memberProjects.filter(p => {
        if (p.status !== 'progress') return false;
        
        const now = new Date().getTime();
        const start = new Date(p.startDate).getTime();
        const end = new Date(p.deadline).getTime();
        const elapsed = now - start;
        const total = end - start;
        const plannedProgress = Math.min(100, Math.max(0, Math.round(elapsed / total * 100)));
        
        return p.progress >= plannedProgress;
      }).length;
      
      return {
        name: member,
        totalProjects: memberProjects.length,
        completedProjects,
        onTrackProjects,
        completionRate: memberProjects.length > 0 
          ? Math.round((completedProjects / memberProjects.length) * 100) 
          : 0,
        efficiency: memberProjects.length > 0
          ? Math.round(((completedProjects + onTrackProjects) / memberProjects.length) * 100)
          : 0
      };
    }).sort((a, b) => b.efficiency - a.efficiency);
    
    setTeamPerformance(performance);
  };
  
  // 生成分析建议
  const generateAISuggestions = () => {
    setIsLoadingAI(true);
    
    // 模拟API调用延迟
    setTimeout(() => {
      const suggestions = [
        {
          title: '存在高风险项目',
          content: '北京健康医疗上市审计项目风险等级为高，请安排专门的风险控制会议。',
          type: 'error' as const
        },
        {
          title: '项目即将到期',
          content: '广州餐饮集团内控评估项目将在21天内到期，但进度仅为30%，建议关注进度。',
          type: 'warning' as const
        },
        {
          title: '资源优化建议',
          content: '张明目前负责2个项目，考虑重新分配工作量。',
          type: 'info' as const
        },
        {
          title: '客户关系维护',
          content: '智联科技有限公司是重要客户，建议安排季度回访。',
          type: 'success' as const
        }
      ];
      
      setAiSuggestions(suggestions);
      setIsLoadingAI(false);
    }, 1500);
  };

  // 显示编辑项目弹窗
  const showEditModal = (project: Project) => {
    setCurrentProject(project);
    form.setFieldsValue({
      progress: project.progress,
      status: project.status,
      risk: project.risk,
      notes: project.notes || '',
    });
    setDragValue(project.progress);
    setEditModalVisible(true);
    
    // 加载项目的变更记录
    if (project.changeLogs) {
      setProjectChangeLogs(project.changeLogs);
    } else {
      // 如果没有变更记录，则重置为空数组
      setProjectChangeLogs([]);
    }
  };

  // 处理更新项目状态
  const handleUpdateProject = () => {
    form.validateFields().then(values => {
      const oldProject = projects.find(p => p.id === currentProject?.id);
      if (!oldProject) return;
      
      // 创建变更记录
      const newChangeLogs: ChangeLog[] = [];
      
      if (oldProject.progress !== values.progress) {
        newChangeLogs.push({
          id: Date.now() + 1,
          projectId: oldProject.id,
          timestamp: new Date().toISOString(),
          user: currentUser.name,
          field: '进度',
          oldValue: `${oldProject.progress}%`,
          newValue: `${values.progress}%`,
          comment: values.notes
        });
      }
      
      if (oldProject.status !== values.status) {
        newChangeLogs.push({
          id: Date.now() + 2,
          projectId: oldProject.id,
          timestamp: new Date().toISOString(),
          user: currentUser.name,
          field: '状态',
          oldValue: statusMap[oldProject.status as keyof typeof statusMap].text,
          newValue: statusMap[values.status as keyof typeof statusMap].text,
          comment: values.notes
        });
      }
      
      if (oldProject.risk !== values.risk) {
        newChangeLogs.push({
          id: Date.now() + 3,
          projectId: oldProject.id,
          timestamp: new Date().toISOString(),
          user: currentUser.name,
          field: '风险等级',
          oldValue: riskMap[oldProject.risk as keyof typeof riskMap].text,
          newValue: riskMap[values.risk as keyof typeof riskMap].text,
          comment: values.notes
        });
      }
      
      // 更新项目数据
      const updatedProjects = projects.map(project => {
        if (project.id === currentProject?.id) {
          const existingChangeLogs = project.changeLogs || [];
          
          return {
            ...project,
            progress: values.progress,
            status: values.status,
            risk: values.risk,
            notes: values.notes,
            lastUpdate: new Date().toISOString().split('T')[0],
            changeLogs: [...existingChangeLogs, ...newChangeLogs]
          };
        }
        return project;
      });
      
      setProjects(updatedProjects);
      setEditModalVisible(false);
      message.success('项目状态已更新');
      
      // 更新甘特图任务
      convertProjectsToGanttTasks();
      
      // 更新团队绩效数据
      generateTeamPerformance();
      
      // 触发实时协作消息（模拟）
      message.info(`已通知项目相关成员：${currentProject?.name} 状态已更新`);
    });
  };
  
  // 处理进度条拖拽
  const handleProgressDrag = (value: number) => {
    setDragValue(value);
    form.setFieldsValue({ progress: value });
  };
  
  // 查看项目变更历史
  const showChangeLog = (project: Project) => {
    setCurrentProject(project);
    if (project.changeLogs) {
      setProjectChangeLogs(project.changeLogs);
    } else {
      // 初始化一些模拟数据
      initializeChangeLogs();
    }
    setChangeLogVisible(true);
  };
  
  // 处理甘特图任务变更
  const handleTaskChange = (task: Task, children: Task[]) => {
    // 找到对应的项目
    const projectIndex = projects.findIndex(p => p.id.toString() === task.id);
    if (projectIndex === -1) return;
    
    // 更新项目日期和进度
    const updatedProjects = [...projects];
    updatedProjects[projectIndex] = {
      ...updatedProjects[projectIndex],
      startDate: task.start.toISOString().split('T')[0],
      deadline: task.end.toISOString().split('T')[0],
      progress: Math.round(task.progress * 100),
      lastUpdate: new Date().toISOString().split('T')[0]
    };
    
    setProjects(updatedProjects);
    
    // 记录变更
    const newChangeLog: ChangeLog = {
      id: Date.now(),
      projectId: parseInt(task.id),
      timestamp: new Date().toISOString(),
      user: currentUser.name,
      field: '时间与进度',
      oldValue: `${projects[projectIndex].startDate} 至 ${projects[projectIndex].deadline}, ${projects[projectIndex].progress}%`,
      newValue: `${task.start.toISOString().split('T')[0]} 至 ${task.end.toISOString().split('T')[0]}, ${Math.round(task.progress * 100)}%`,
      comment: '通过甘特图调整'
    };
    
    const existingChangeLogs = updatedProjects[projectIndex].changeLogs || [];
    updatedProjects[projectIndex].changeLogs = [...existingChangeLogs, newChangeLog];
    
    message.success('项目计划已更新');
  };

  // 项目进度数据
  const getProjectProgressOption = () => {
    // 按进度排序的进行中项目
    const sortedProjects = [...projects]
      .filter(p => p.status === 'progress')
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 5);
      
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['计划进度', '实际进度']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        boundaryGap: [0, 0.01],
        max: 100,
        axisLabel: {
          formatter: '{value}%'
        }
      },
      yAxis: {
        type: 'category',
        data: sortedProjects.map(p => p.name)
      },
      series: [
        {
          name: '计划进度',
          type: 'bar',
          data: sortedProjects.map(p => {
            // 根据当前日期和项目起止日期计算计划进度
            const start = new Date(p.startDate).getTime();
            const end = new Date(p.deadline).getTime();
            const now = new Date().getTime();
            const total = end - start;
            const elapsed = now - start;
            const planned = Math.min(100, Math.max(0, Math.round(elapsed / total * 100)));
            return planned;
          })
        },
        {
          name: '实际进度',
          type: 'bar',
          data: sortedProjects.map(p => p.progress)
        }
      ]
    };
  };

  // 项目状态分布
  const getProjectStatusOption = () => {
    const statusCounts = {
      planned: projects.filter(p => p.status === 'planned').length,
      progress: projects.filter(p => p.status === 'progress').length,
      review: projects.filter(p => p.status === 'review').length,
      completed: projects.filter(p => p.status === 'completed').length,
      overdue: projects.filter(p => {
        const now = new Date();
        const deadline = new Date(p.deadline);
        return deadline < now && p.status !== 'completed';
      }).length
    };

    return {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: '项目状态',
          type: 'pie',
          radius: '70%',
          data: [
            { value: statusCounts.planned, name: '计划中', itemStyle: { color: '#1890ff' } },
            { value: statusCounts.progress, name: '进行中', itemStyle: { color: '#87d068' } },
            { value: statusCounts.review, name: '审核中', itemStyle: { color: '#faad14' } },
            { value: statusCounts.completed, name: '已完成', itemStyle: { color: '#52c41a' } },
            { value: statusCounts.overdue, name: '已逾期', itemStyle: { color: '#f5222d' } }
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
  };

  // 营收分析数据
  const getRevenueOption = () => {
    return {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: '营收来源',
          type: 'pie',
          radius: '70%',
          data: [
            { value: 45, name: '审计服务' },
            { value: 25, name: '税务咨询' },
            { value: 15, name: '内控评估' },
            { value: 10, name: '资产评估' },
            { value: 5, name: '其他服务' }
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
  };

  // 资源利用率数据
  const getResourceUtilizationOption = () => {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: '#999'
          }
        }
      },
      toolbox: {
        feature: {
          dataView: { show: true, readOnly: false },
          magicType: { show: true, type: ['line', 'bar'] },
          restore: { show: true },
          saveAsImage: { show: true }
        }
      },
      legend: {
        data: ['人力资源利用率', '时间利用率', '平均项目利润率']
      },
      xAxis: [
        {
          type: 'category',
          data: ['一月', '二月', '三月', '四月', '五月', '六月'],
          axisPointer: {
            type: 'shadow'
          }
        }
      ],
      yAxis: [
        {
          type: 'value',
          name: '利用率',
          min: 0,
          max: 100,
          interval: 20,
          axisLabel: {
            formatter: '{value}%'
          }
        },
        {
          type: 'value',
          name: '利润率',
          min: 0,
          max: 50,
          interval: 10,
          axisLabel: {
            formatter: '{value}%'
          }
        }
      ],
      series: [
        {
          name: '人力资源利用率',
          type: 'bar',
          data: [75.5, 78.2, 82.6, 80.4, 85.1, 83.7]
        },
        {
          name: '时间利用率',
          type: 'bar',
          data: [72.3, 75.7, 79.8, 76.5, 82.3, 80.1]
        },
        {
          name: '平均项目利润率',
          type: 'line',
          yAxisIndex: 1,
          data: [28.5, 29.1, 30.8, 31.2, 32.5, 33.1]
        }
      ]
    };
  };

  // 风险热力图数据
  const getRiskHeatmapOption = () => {
    // 生成风险热力图数据
    const hours = ['审计风险', '合规风险', '税务风险', '内控风险', '项目交付风险'];
    const days = ['低', '中低', '中', '中高', '高'];
    
    const data = [
      [0, 0, 5], [0, 1, 12], [0, 2, 20], [0, 3, 8], [0, 4, 2],
      [1, 0, 8], [1, 1, 15], [1, 2, 10], [1, 3, 7], [1, 4, 3],
      [2, 0, 6], [2, 1, 8], [2, 2, 18], [2, 3, 12], [2, 4, 4],
      [3, 0, 10], [3, 1, 14], [3, 2, 6], [3, 3, 5], [3, 4, 2],
      [4, 0, 9], [4, 1, 13], [4, 2, 11], [4, 3, 6], [4, 4, 1]
    ];

    return {
      title: {
        text: '未来90天风险预测',
        left: 'center'
      },
      tooltip: {
        position: 'top',
        formatter: function (params: any) {
          return '风险等级: ' + days[params.value[1]] + 
                 '<br>风险种类: ' + hours[params.value[0]] + 
                 '<br>项目数量: ' + params.value[2];
        }
      },
      grid: {
        top: '15%',
        left: '10%',
        right: '10%',
        bottom: '10%'
      },
      xAxis: {
        type: 'category',
        data: days,
        splitArea: {
          show: true
        }
      },
      yAxis: {
        type: 'category',
        data: hours,
        splitArea: {
          show: true
        }
      },
      visualMap: {
        min: 0,
        max: 20,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        inRange: {
          color: ['#b8f1ed', '#7ee8e0', '#4fd9cd', '#2ebeb1', '#05a396']
        }
      },
      series: [
        {
          type: 'heatmap',
          data: data,
          label: {
            show: true
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
  };

  // 项目列表表格列定义
  const projectColumns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space>
          <Text strong>{text}</Text>
          {new Date(record.deadline) <= new Date() && record.status !== 'completed' && (
            <Tag color="red">已逾期</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '客户',
      dataIndex: 'client',
      key: 'client',
      width: 150,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={typeMap[type as keyof typeof typeMap].color}>
          {typeMap[type as keyof typeof typeMap].text}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusMap[status as keyof typeof statusMap].color}>
          {statusMap[status as keyof typeof statusMap].text}
        </Tag>
      ),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: (progress: number) => (
        <Progress percent={progress} size="small" status={progress === 100 ? 'success' : 'active'} />
      ),
    },
    {
      title: '风险',
      dataIndex: 'risk',
      key: 'risk',
      width: 100,
      render: (risk: string) => (
        <Badge status={riskMap[risk as keyof typeof riskMap].status} text={riskMap[risk as keyof typeof riskMap].text} />
      ),
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 110,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (text: string, record: any) => (
        <Button type="primary" icon={<EditOutlined />} size="small" onClick={() => showEditModal(record)}>
          更新
        </Button>
      ),
    },
  ];

  const timeRangeMenu = (
    <Menu 
      onClick={(e) => setTimeRange(e.key)}
      selectedKeys={[timeRange]}
    >
      <Menu.Item key="今日">今日</Menu.Item>
      <Menu.Item key="本周">本周</Menu.Item>
      <Menu.Item key="本月">本月</Menu.Item>
      <Menu.Item key="本季度">本季度</Menu.Item>
      <Menu.Item key="本年">本年</Menu.Item>
    </Menu>
  );

  // 修改initializeData函数，根据当前项目数据初始化
  const initializeData = () => {
    setProjects(mockProjects);
    
    // 初始化甘特图任务
    convertProjectsToGanttTasks();
    
    // 初始化团队绩效数据
    generateTeamPerformance();
    
    // 初始化分析建议
    generateAISuggestions();
    
    // 更新统计数据
    updateStats(mockProjects);
  };
  
  // 添加更新统计数据的函数
  const updateStats = (projectList: Project[]) => {
    setStats({
      total: projectList.length,
      inProgress: projectList.filter(p => p.status === 'progress').length,
      completed: projectList.filter(p => p.status === 'completed').length,
      planned: projectList.filter(p => p.status === 'planned').length,
      overdue: projectList.filter(p => {
        const now = new Date();
        const deadline = new Date(p.deadline);
        return deadline < now && p.status !== 'completed';
      }).length,
      highRisk: projectList.filter(p => p.risk === 'high').length,
      onTrack: projectList.filter(p => {
        const now = new Date().getTime();
        const start = new Date(p.startDate).getTime();
        const end = new Date(p.deadline).getTime();
        const elapsed = now - start;
        const total = end - start;
        const plannedProgress = Math.min(100, Math.max(0, Math.round(elapsed / total * 100)));
        
        return p.status === 'progress' && p.progress >= plannedProgress;
      }).length,
      behindSchedule: projectList.filter(p => {
        const now = new Date().getTime();
        const start = new Date(p.startDate).getTime();
        const end = new Date(p.deadline).getTime();
        const elapsed = now - start;
        const total = end - start;
        const plannedProgress = Math.min(100, Math.max(0, Math.round(elapsed / total * 100)));
        
        return p.status === 'progress' && p.progress < plannedProgress;
      }).length,
    });
  };

  return (
    <>
      <Card bordered={false}>
        <Row gutter={16} align="middle" justify="space-between">
          <Col>
            <Space direction="vertical" size={4}>
              <Text type="secondary">可视化分析</Text>
              <Title level={4} style={{ margin: 0 }}>决策支持</Title>
            </Space>
          </Col>
          <Col>
        <Space>
              <Radio.Group 
                value={timeRange} 
                onChange={e => setTimeRange(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="week">本周</Radio.Button>
                <Radio.Button value="month">本月</Radio.Button>
                <Radio.Button value="quarter">本季度</Radio.Button>
                <Radio.Button value="year">本年度</Radio.Button>
              </Radio.Group>
              <Button icon={<SyncOutlined />} onClick={initializeData}>刷新数据</Button>
              </Space>
          </Col>
        </Row>
      </Card>
      
      {/* 统计概览卡片 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总项目数"
              value={stats.total}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="进行中"
              value={stats.inProgress}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#87d068' }}
              suffix={<small style={{ fontSize: '14px', color: '#999' }}>({Math.round(stats.inProgress / stats.total * 100)}%)</small>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={<small style={{ fontSize: '14px', color: '#999' }}>({Math.round(stats.completed / stats.total * 100)}%)</small>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="高风险项目"
              value={stats.highRisk}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#f5222d' }}
              suffix={<small style={{ fontSize: '14px', color: '#999' }}>({Math.round(stats.highRisk / stats.total * 100)}%)</small>}
            />
          </Card>
        </Col>
      </Row>
      
      {/* 项目状态看板 */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>项目状态看板</span>
            <div>
              <Radio.Group
                size="small"
                value={kanbanView}
                onChange={e => setKanbanView(e.target.value)}
                style={{ marginRight: 16 }}
              >
                <Radio.Button value="status">按状态</Radio.Button>
                <Radio.Button value="manager">按负责人</Radio.Button>
                <Radio.Button value="risk">按风险</Radio.Button>
              </Radio.Group>
              <Select
                style={{ width: 120 }}
                placeholder="排序方式"
                onChange={value => setSortBy(value)}
                defaultValue="deadline"
                size="small"
              >
                <Select.Option value="deadline">截止日期</Select.Option>
                <Select.Option value="progress">完成进度</Select.Option>
                <Select.Option value="priority">优先级</Select.Option>
              </Select>
            </div>
          </div>
        }
        style={{ marginTop: 16 }}
      >
        <div className="project-board">
          <div className="project-columns" style={{ display: 'flex', overflowX: 'auto' }}>
            {kanbanView === 'status' && (
              <>
                {Object.entries(statusMap).map(([status, { text, color }]) => (
                  <div key={status} className="project-column" style={{ minWidth: 280, marginRight: 16 }}>
                    <div className="column-header" style={{ backgroundColor: color, padding: '8px 12px', borderRadius: '4px 4px 0 0' }}>
                      <h3 style={{ color: 'white', margin: 0 }}>{text}</h3>
                      <Badge count={projects.filter(p => p.status === status).length} style={{ backgroundColor: 'white', color: color }} />
                    </div>
                    <div className="column-content" style={{ minHeight: 300, padding: '8px 0', background: '#f5f5f5', borderRadius: '0 0 4px 4px' }}>
                      {projects
                        .filter(p => p.status === status)
                        .sort((a, b) => {
                          if (sortBy === 'deadline') return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                          if (sortBy === 'progress') return b.progress - a.progress;
                          if (sortBy === 'priority') {
                            const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
                            return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
                          }
                          return 0;
                        })
                        .map(project => (
                          <Card 
                            key={project.id} 
                            size="small" 
                            style={{ margin: '8px', cursor: 'pointer' }}
                            onClick={() => showEditModal(project)}
                            actions={[
                              <Tooltip title="编辑状态"><EditOutlined key="edit" /></Tooltip>,
                              <Tooltip title="查看变更历史"><HistoryOutlined key="history" onClick={(e) => { e.stopPropagation(); showChangeLog(project); }} /></Tooltip>
                            ]}
                          >
                            <div style={{ marginBottom: 8 }}>
                              <Tag color={typeMap[project.type as keyof typeof typeMap].color}>{typeMap[project.type as keyof typeof typeMap].text}</Tag>
                              <Tag color={priorityMap[project.priority as keyof typeof priorityMap].color}>{priorityMap[project.priority as keyof typeof priorityMap].text}</Tag>
                            </div>
                            <h4 style={{ margin: '8px 0' }}>{project.name}</h4>
                            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                              <TeamOutlined /> {project.manager}
                            </div>
                            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                              <CalendarOutlined /> 截止: {project.deadline}
                            </div>
                            <Progress percent={project.progress} size="small" status={
                              project.status === 'overdue' ? 'exception' : 
                              project.status === 'completed' ? 'success' : 'active'
                            } />
          </Card>
                        ))
                      }
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {kanbanView === 'manager' && (
              <>
                {Array.from(new Set(projects.map(p => p.manager))).map(manager => (
                  <div key={manager} className="project-column" style={{ minWidth: 280, marginRight: 16 }}>
                    <div className="column-header" style={{ backgroundColor: '#1890ff', padding: '8px 12px', borderRadius: '4px 4px 0 0' }}>
                      <h3 style={{ color: 'white', margin: 0 }}>{manager}</h3>
                      <Badge count={projects.filter(p => p.manager === manager).length} style={{ backgroundColor: 'white', color: '#1890ff' }} />
                    </div>
                    <div className="column-content" style={{ minHeight: 300, padding: '8px 0', background: '#f5f5f5', borderRadius: '0 0 4px 4px' }}>
                      {projects
                        .filter(p => p.manager === manager)
                        .map(project => (
                          <Card 
                            key={project.id} 
                            size="small" 
                            style={{ margin: '8px', cursor: 'pointer', borderLeft: `3px solid ${statusMap[project.status as keyof typeof statusMap].color}` }}
                            onClick={() => showEditModal(project)}
                          >
                            <h4 style={{ margin: '8px 0' }}>{project.name}</h4>
                            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                              <TagOutlined /> 
                              <span style={{ color: statusMap[project.status as keyof typeof statusMap].color }}>
                                {statusMap[project.status as keyof typeof statusMap].text}
            </span>
                            </div>
                            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                              <CalendarOutlined /> 截止: {project.deadline}
                            </div>
                            <Progress percent={project.progress} size="small" status={
                              project.status === 'overdue' ? 'exception' : 
                              project.status === 'completed' ? 'success' : 'active'
                            } />
                          </Card>
                        ))
                      }
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {kanbanView === 'risk' && (
              <>
                {Object.entries(riskMap).map(([risk, { text, color }]) => (
                  <div key={risk} className="project-column" style={{ minWidth: 280, marginRight: 16 }}>
                    <div className="column-header" style={{ backgroundColor: color, padding: '8px 12px', borderRadius: '4px 4px 0 0' }}>
                      <h3 style={{ color: 'white', margin: 0 }}>{text}</h3>
                      <Badge count={projects.filter(p => p.risk === risk).length} style={{ backgroundColor: 'white', color: color }} />
                    </div>
                    <div className="column-content" style={{ minHeight: 300, padding: '8px 0', background: '#f5f5f5', borderRadius: '0 0 4px 4px' }}>
                      {projects
                        .filter(p => p.risk === risk)
                        .map(project => (
                          <Card 
                            key={project.id} 
                            size="small" 
                            style={{ margin: '8px', cursor: 'pointer', borderLeft: `3px solid ${statusMap[project.status as keyof typeof statusMap].color}` }}
                            onClick={() => showEditModal(project)}
                          >
                            <h4 style={{ margin: '8px 0' }}>{project.name}</h4>
                            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                              <TagOutlined /> 
                              <span style={{ color: statusMap[project.status as keyof typeof statusMap].color }}>
                                {statusMap[project.status as keyof typeof statusMap].text}
                              </span>
                            </div>
                            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                              <TeamOutlined /> {project.manager}
                            </div>
                            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                              <CalendarOutlined /> 截止: {project.deadline}
                            </div>
                            <Progress percent={project.progress} size="small" status={
                              project.status === 'overdue' ? 'exception' : 
                              project.status === 'completed' ? 'success' : 'active'
                            } />
          </Card>
                        ))
                      }
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </Card>
      
      {/* 甘特图时间线 */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>项目时间线（甘特图）</span>
            <Radio.Group
              options={viewModeOptions}
              value={viewMode}
              onChange={e => setViewMode(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              size="small"
            />
          </div>
        }
        style={{ marginTop: 16 }}
      >
        <div className="gantt-container" style={{ height: 300, width: '100%', overflowX: 'auto' }}>
          {ganttTasks.length > 0 ? (
            <Gantt
              tasks={ganttTasks}
              viewMode={viewMode}
              onDateChange={handleTaskChange}
              onProgressChange={handleTaskChange}
              listCellWidth=""
              columnWidth={60}
            />
          ) : (
            <Empty description="暂无项目数据" />
          )}
        </div>
          </Card>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* 团队绩效 */}
        <Col xs={24} md={12}>
          <Card title="团队绩效" extra={<Tooltip title="根据项目完成情况计算"><InfoCircleOutlined /></Tooltip>}>
            <Table
              dataSource={teamPerformance}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                {
                  title: '成员',
                  dataIndex: 'name',
                  key: 'name',
                  render: (text, record) => (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar src={record.avatar} size="small" style={{ marginRight: 8 }} />
                      {text}
                    </div>
                  ),
                },
                {
                  title: '项目数',
                  dataIndex: 'totalProjects',
                  key: 'totalProjects',
                  width: 80,
                  align: 'center',
                },
                {
                  title: '完成率',
                  dataIndex: 'completionRate',
                  key: 'completionRate',
                  width: 100,
                  align: 'center',
                  render: (text) => `${text}%`,
                },
                {
                  title: '效率',
                  dataIndex: 'efficiency',
                  key: 'efficiency',
                  width: 140,
                  align: 'center',
                  render: (value) => (
                    <Progress 
                      percent={value} 
                      size="small" 
                      strokeColor={value >= 80 ? '#52c41a' : value >= 60 ? '#faad14' : '#f5222d'} 
                    />
                  ),
                },
              ]}
            />
          </Card>
        </Col>
        
        {/* 分析建议 */}
        <Col xs={24} md={12}>
          <Card 
            title="分析建议" 
            extra={
              <Button type="link" size="small" icon={<ReloadOutlined />} onClick={generateAISuggestions} />
            }
          >
            {loadingAI ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                <div style={{ marginTop: 8 }}>正在分析项目数据...</div>
              </div>
            ) : (
              <>
                {aiSuggestions.map((suggestion, index) => (
                  <Alert
                    key={index}
                    message={suggestion.title}
                    description={suggestion.content}
                    type={suggestion.type}
                    showIcon
                    style={{ marginBottom: 8 }}
                  />
                ))}
              </>
            )}
          </Card>
        </Col>
      </Row>
      
      {/* 编辑项目状态弹窗 */}
      <Modal
        title={`更新项目状态: ${currentProject?.name}`}
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleUpdateProject}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="项目状态" name="status" rules={[{ required: true, message: '请选择项目状态' }]}>
                <Select>
                  {Object.entries(statusMap).map(([value, { text, color }]) => (
                    <Select.Option key={value} value={value}>
                      <Badge color={color} text={text} />
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="风险等级" name="risk" rules={[{ required: true, message: '请选择风险等级' }]}>
                <Select>
                  {Object.entries(riskMap).map(([value, { text, color }]) => (
                    <Select.Option key={value} value={value}>
                      <Badge color={color} text={text} />
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item label="完成进度" name="progress" rules={[{ required: true, message: '请设置完成进度' }]}>
            <Slider
              min={0}
              max={100}
              onChange={handleProgressDrag}
              value={typeof dragValue === 'number' ? dragValue : 0}
              marks={{
                0: '0%',
                25: '25%',
                50: '50%',
                75: '75%',
                100: '100%'
              }}
              step={5}
            />
          </Form.Item>
          
          <Form.Item label="备注说明" name="notes">
            <Input.TextArea rows={4} placeholder="请输入状态变更的原因或其他备注信息" />
          </Form.Item>
        </Form>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <div style={{ fontSize: 12, color: '#999' }}>
          <p>项目信息：{currentProject?.client} | 负责人: {currentProject?.manager} | 截止日期: {currentProject?.deadline}</p>
          {currentUser.role !== 'employee' && (
            <p>系统将自动通知项目组所有成员此次状态变更</p>
          )}
    </div>
      </Modal>
      
      {/* 项目变更历史弹窗 */}
      <Modal
        title={`项目变更历史: ${currentProject?.name}`}
        visible={changeLogVisible}
        onCancel={() => setChangeLogVisible(false)}
        footer={[
          <Button key="close" onClick={() => setChangeLogVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        <Timeline>
          {projectChangeLogs.length > 0 ? (
            projectChangeLogs.map((log) => (
              <Timeline.Item key={log.id} color={log.field.includes('风险') ? 'red' : log.field.includes('进度') ? 'green' : 'blue'}>
                <div style={{ marginBottom: 4 }}>
                  <Tag color="blue">{new Date(log.timestamp).toLocaleString()}</Tag>
                  <Tag color="purple">{log.user}</Tag>
                </div>
                <div style={{ marginBottom: 4 }}>
                  修改了 <b>{log.field}</b>: {log.oldValue} → <b>{log.newValue}</b>
                </div>
                {log.comment && (
                  <div style={{ fontSize: 12, color: '#666', background: '#f9f9f9', padding: 8, borderRadius: 4 }}>
                    备注: {log.comment}
                  </div>
                )}
              </Timeline.Item>
            ))
          ) : (
            <Empty description="暂无变更记录" />
          )}
        </Timeline>
      </Modal>
    </>
  );
};

Dashboard.getLayout = (page: React.ReactElement) => {
  return (
    <AppLayout>
      {page}
    </AppLayout>
  );
};

export default Dashboard; 