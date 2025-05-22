/**
 * 会计师事务所管理系统API服务器
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const { generateMockDb } = require('./utils/generateMockDb');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const clientRoutes = require('./routes/client.routes');
const projectRoutes = require('./routes/project.routes');
const reportRoutes = require('./routes/report.routes');

// 加载环境变量
dotenv.config();

// 初始化应用
const app = express();

// 中间件
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(helmet()); // 安全HTTP头
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析表单数据
app.use(morgan('dev')); // HTTP请求日志

// 初始化模拟数据库
const initData = async () => {
  try {
    const result = await generateMockDb();
    if (result) {
      logger.info('模拟数据库初始化成功');
    } else {
      logger.error('模拟数据库初始化失败');
    }
  } catch (error) {
    logger.error(`模拟数据库初始化错误: ${error.message}`);
  }
};

// 路由
app.get('/', (req, res) => {
  res.json({
    message: '会计师事务所管理系统API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reports', reportRoutes);

// 错误处理中间件
app.use(errorHandler);

// 未找到的路由处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: '请求的资源不存在'
    }
  });
});

// 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  logger.info(`服务器在端口 ${PORT} 上运行`);
  await initData();
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  logger.error(`未捕获的异常: ${err.message}`);
  process.exit(1);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (err) => {
  logger.error(`未处理的Promise拒绝: ${err.message}`);
  process.exit(1);
}); 