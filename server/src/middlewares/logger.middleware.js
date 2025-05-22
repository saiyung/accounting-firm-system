const winston = require('winston');
const { format, transports } = winston;
const path = require('path');
const fs = require('fs');

// 确保日志目录存在
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// 定义日志格式
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json(),
  format.printf(info => {
    const { timestamp, level, message, ...rest } = info;
    const logData = Object.keys(rest).length
      ? `${message} ${JSON.stringify(rest)}`
      : message;
    return `${timestamp} [${level.toUpperCase()}]: ${logData}`;
  })
);

// 创建日志记录器
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'accounting-firm-api' },
  transports: [
    // 控制台输出
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(info => {
          const { timestamp, level, message, ...rest } = info;
          const logData = Object.keys(rest).length
            ? `${message} ${JSON.stringify(rest)}`
            : message;
          return `${timestamp} [${level.toUpperCase()}]: ${logData}`;
        })
      ),
    }),
    // 保存所有日志到日志文件
    new transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 单独保存错误日志
    new transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 单独保存用户信息不匹配错误日志
    new transports.File({ 
      filename: path.join(logDir, 'user-mismatch.log'), 
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.json(),
        format.printf(info => {
          // 只记录与用户信息不匹配相关的日志
          if (info.message && (
              info.message.includes('用户信息不匹配') || 
              info.message.includes('user mismatch') ||
              info.message.includes('用户不存在') ||
              info.message.includes('通过邮箱找到用户')
            )) {
            const { timestamp, level, message, ...rest } = info;
            const logData = Object.keys(rest).length
              ? `${message} ${JSON.stringify(rest)}`
              : message;
            return `${timestamp} [${level.toUpperCase()}]: ${logData}`;
          }
          return null;
        })
      ),
    }),
  ],
  // 处理未捕获的异常
  exceptionHandlers: [
    new transports.File({ 
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// 创建请求日志记录中间件
const requestLogger = (req, res, next) => {
  // 记录请求信息
  const start = Date.now();
  const { method, originalUrl, ip, headers, body, params, query } = req;
  
  // 脱敏处理请求体中的敏感信息
  const sanitizedBody = { ...body };
  if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
  if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
  
  // 记录请求开始
  const requestData = {
    method,
    url: originalUrl,
    ip,
    userAgent: headers['user-agent'],
    body: sanitizedBody,
    params,
    query
  };
  
  // 记录用户ID，如果用户已登录
  if (req.user) {
    requestData.userId = req.user._id;
    requestData.userRole = req.user.role;
  }
  
  logger.info(`请求开始: ${method} ${originalUrl}`, requestData);
  
  // 拦截响应
  const originalSend = res.send;
  res.send = function(body) {
    const responseTime = Date.now() - start;
    
    // 记录响应信息
    const responseData = {
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
    };
    
    // 检测用户信息不匹配错误
    if (res.statusCode === 404 && 
        typeof body === 'string' && 
        body.includes('用户不存在')) {
      logger.warn(`用户信息不匹配: ${method} ${originalUrl}`, {
        ...requestData,
        ...responseData,
        error: '用户信息不匹配错误'
      });
    } else if (res.statusCode >= 400) {
      logger.warn(`请求失败: ${method} ${originalUrl}`, {
        ...requestData,
        ...responseData,
        responseBody: typeof body === 'string' ? body : '[Object]'
      });
    } else {
      logger.info(`请求完成: ${method} ${originalUrl}`, responseData);
    }
    
    originalSend.call(this, body);
    return res;
  };
  
  // 将logger对象添加到应用程序，使其在控制器中可用
  req.app.set('logger', logger);
  
  next();
};

// 创建错误日志记录中间件
const errorLogger = (err, req, res, next) => {
  const { method, originalUrl, ip, headers, body, params, query } = req;
  
  // 记录错误信息
  const errorData = {
    method,
    url: originalUrl,
    ip,
    userAgent: headers['user-agent'],
    params,
    query,
    error: {
      message: err.message,
      stack: err.stack
    }
  };
  
  // 记录用户ID，如果用户已登录
  if (req.user) {
    errorData.userId = req.user._id;
    errorData.userRole = req.user.role;
  }
  
  // 检测用户信息不匹配错误
  if (err.message && (
      err.message.includes('用户不存在') || 
      err.message.includes('用户信息不匹配'))) {
    logger.warn(`用户信息不匹配错误: ${method} ${originalUrl}`, errorData);
  } else {
    logger.error(`请求错误: ${method} ${originalUrl}`, errorData);
  }
  
  next(err);
};

module.exports = { 
  logger, 
  requestLogger, 
  errorLogger 
}; 