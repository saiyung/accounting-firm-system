const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const logger = require('./utils/logger');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const projectRoutes = require('./routes/project.routes');
const reportRoutes = require('./routes/report.routes');
const clientRoutes = require('./routes/client.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const errorHandler = require('./middlewares/errorHandler');
const timesheetRoutes = require('./routes/timesheet.routes');
const taskRoutes = require('./routes/task.routes');
const activityRoutes = require('./routes/activity.routes');

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();

// 连接数据库
connectDB();

// 中间件
app.use(helmet()); // 安全HTTP头
app.use(compression()); // 压缩响应
app.use(cors()); // 启用CORS
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码的请求体
app.use(morgan('dev')); // HTTP请求日志

// 定义根路由
app.get('/', (req, res) => {
  res.json({ message: '会计师事务所智能管理系统API运行正常' });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/activities', activityRoutes);

// 错误处理中间件
app.use(errorHandler);

// 未找到的路由处理
app.use((req, res) => {
  res.status(404).json({ message: '请求的资源不存在' });
});

// 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`服务器已启动，监听端口: ${PORT}`);
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  logger.error('未捕获的异常:', err);
  process.exit(1);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (err) => {
  logger.error('未处理的Promise拒绝:', err);
  process.exit(1);
});

module.exports = app; // 导出应用实例供测试使用 