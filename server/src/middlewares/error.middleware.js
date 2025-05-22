/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  // 默认状态码和错误消息
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || '服务器内部错误';
  let errorDetails = null;

  // 处理MongoDB错误
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = '无效的ID格式';
  }

  // 处理MongoDB验证错误
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = '数据验证失败';
    errorDetails = Object.values(err.errors).map(val => val.message);
  }

  // 处理MongoDB重复键错误
  if (err.code === 11000) {
    statusCode = 400;
    message = '数据已存在，请检查重复字段';
    errorDetails = err.keyValue;
  }

  // 处理JWT错误
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '无效的令牌，请重新登录';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '令牌已过期，请重新登录';
  }

  // 用户信息不匹配错误特殊处理
  if (message.includes('用户不存在') || message.includes('用户信息不匹配')) {
    statusCode = 400;
    errorDetails = {
      errorType: 'USER_MISMATCH',
      suggestion: '请确认用户信息是否正确，可以尝试使用邮箱查找用户'
    };
  }

  // 发送错误响应
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      details: errorDetails,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack
    }
  });
};

module.exports = {
  errorHandler
}; 