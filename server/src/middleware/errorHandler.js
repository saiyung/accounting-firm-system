/**
 * 错误处理中间件
 * 用于捕获和处理API请求过程中的错误
 */

const logger = require('../utils/logger');

/**
 * 处理错误响应
 * @param {Error} err - 错误对象
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const errorHandler = (err, req, res, next) => {
  // 获取错误状态码，默认为500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // 记录错误日志
  logger.error(`[错误] ${req.method} ${req.originalUrl}: ${err.message}`);
  if (err.stack) {
    logger.error(err.stack);
  }
  
  // 发送错误响应
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || '服务器内部错误',
      stack: process.env.NODE_ENV === 'production' ? null : err.stack
    }
  });
};

module.exports = errorHandler; 