const logger = require('../utils/logger');

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  // 记录错误信息
  logger.error(`${err.name}: ${err.message}\n${err.stack}`);

  // 确定状态码
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // 发送错误响应
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
};

module.exports = errorHandler; 