const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const compression = require('compression');
const path = require('path');
const { errors } = require('celebrate');
const { errorHandler } = require('./middlewares/error.middleware');
const { requestLogger, errorLogger } = require('./middlewares/logger.middleware');

const config = require('./config/config');
const logger = require('./utils/logger');

// 路由导入
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const timesheetRoutes = require('./routes/timesheet.routes');
const knowledgeRoutes = require('./routes/knowledge.routes');
const projectRoutes = require('./routes/project.routes');
const clientRoutes = require('./routes/client.routes');
const reportRoutes = require('./routes/report.routes');
const templateRoutes = require('./routes/template.routes');
// TODO: 导入其他路由

// 初始化应用
const app = express();

// 连接数据库
mongoose
  .connect(config.db.url, config.db.options)
  .then(() => {
    logger.info('数据库连接成功');
  })
  .catch((err) => {
    logger.error(`数据库连接失败: ${err.message}`);
    process.exit(1);
  });

// 安全中间件
app.use(helmet()); // 设置各种HTTP头以增强安全性
app.use(xss()); // 防止XSS攻击
app.use(mongoSanitize()); // 防止MongoDB操作符注入
app.use(hpp()); // 防止HTTP参数污染

// 请求限制
const limiter = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.max,
  message: {
    success: false,
    message: config.security.rateLimit.message,
  },
});
app.use('/api/', limiter);

// 常规中间件
app.use(cors(config.security.cors)); // 跨域资源共享
app.use(express.json({ limit: '10kb' })); // Body解析，限制大小
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser()); // Cookie解析
app.use(compression()); // 压缩响应
app.use(morgan('dev')); // HTTP请求日志

// 日志中间件
app.use(requestLogger);

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/templates', templateRoutes);
// TODO: 注册其他路由

// API状态检查
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: '系统运行正常',
    version: config.system.version,
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

// 处理未找到的路由
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `无法找到 ${req.originalUrl} 路由`,
  });
});

// 错误处理
app.use(errorLogger);
app.use(errors());
app.use(errorHandler);

// 导出应用
module.exports = app; 