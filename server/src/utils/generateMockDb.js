/**
 * 生成模拟数据库工具
 * 用于在没有MongoDB的情况下使用JSON文件模拟数据存储
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// 模拟数据目录
const DATA_DIR = path.join(__dirname, '../../data');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  logger.info(`创建数据目录: ${DATA_DIR}`);
}

// 初始模拟数据
const initialData = {
  users: [
    {
      id: 'admin001',
      name: '系统管理员',
      email: 'admin@example.com',
      password: '$2a$10$X3ej8B4h1n.w6H9xv7Vz6ehjMPuzWKHZfO1.v9QvNh8hBSjAls0au', // 'password123'
      role: 'admin',
      department: 'IT部门',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'user001',
      name: '张明',
      email: 'zhangming@example.com',
      password: '$2a$10$X3ej8B4h1n.w6H9xv7Vz6ehjMPuzWKHZfO1.v9QvNh8hBSjAls0au', // 'password123'
      role: 'manager',
      department: '审计部',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  clients: [
    {
      id: 'C001',
      name: '上海星辰科技有限公司',
      industry: '科技',
      contact: '张三',
      phone: '13800138000',
      address: '上海市浦东新区张江高科技园区',
      tags: ['高价值', '上市企业'],
      createdAt: '2023-01-15',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'C002',
      name: '北京未来医疗科技有限公司',
      industry: '医疗',
      contact: '李四',
      phone: '13900139000',
      address: '北京市朝阳区望京SOHO',
      tags: ['潜力客户'],
      createdAt: '2023-02-20',
      updatedAt: new Date().toISOString()
    }
  ],
  projects: [
    {
      id: 'P001',
      name: '杭州智联科技年度审计',
      client: 'C001',
      status: '进行中',
      startDate: '2023-01-20',
      endDate: '2023-12-31',
      manager: 'user001',
      team: ['user001'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'P002',
      name: '上海贸易集团税务咨询',
      client: 'C001',
      status: '计划中',
      startDate: '2023-05-01',
      endDate: '2023-06-30',
      manager: 'user001',
      team: ['user001'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  reports: [
    {
      id: 'R001',
      name: '杭州智联科技2023年第一季度审计报告',
      project: 'P001',
      status: '草稿',
      content: '这是一份审计报告草稿...',
      author: 'user001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  templates: [
    {
      id: 'T001',
      name: '标准审计报告模板',
      category: '审计报告',
      content: '审计报告标准模板内容...',
      author: 'admin001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  documents: [
    {
      id: 'D001',
      name: '财务报表.xlsx',
      project: 'P001',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 1024000,
      path: '/uploads/financial_statements.xlsx',
      uploadedBy: 'user001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

// 生成模拟数据库文件
const generateMockDb = () => {
  try {
    // 遍历数据类型，为每种类型创建JSON文件
    Object.entries(initialData).forEach(([collection, data]) => {
      const filePath = path.join(DATA_DIR, `${collection}.json`);
      
      // 如果文件已存在，不覆盖
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        logger.info(`创建模拟数据文件: ${filePath}`);
      } else {
        logger.info(`模拟数据文件已存在: ${filePath}`);
      }
    });
    
    logger.info('模拟数据库初始化完成');
    return true;
  } catch (error) {
    logger.error(`模拟数据库初始化失败: ${error.message}`);
    return false;
  }
};

module.exports = { generateMockDb, DATA_DIR }; 