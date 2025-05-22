/**
 * 认证中间件
 * 验证请求中的JWT令牌，保护需要认证的路由
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const MockDbService = require('../services/MockDbService');

// 创建用户服务实例
const userService = new MockDbService('users');

/**
 * 保护路由中间件
 * 验证用户是否已登录
 */
exports.protect = async (req, res, next) => {
  let token;
  
  // 从请求头获取令牌
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // 如果没有令牌，返回未授权错误
  if (!token) {
    logger.warn(`未授权访问: ${req.originalUrl}`);
    return res.status(401).json({
      success: false,
      error: {
        message: '需要登录才能访问此资源'
      }
    });
  }
  
  try {
    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    
    // 查找用户
    const user = await userService.findById(decoded.id);
    
    // 如果找不到用户
    if (!user) {
      logger.warn(`未找到令牌对应的用户: ${decoded.id}`);
      return res.status(401).json({
        success: false,
        error: {
          message: '找不到用户'
        }
      });
    }
    
    // 将用户添加到请求对象
    req.user = user;
    next();
  } catch (error) {
    logger.error(`JWT验证失败: ${error.message}`);
    return res.status(401).json({
      success: false,
      error: {
        message: '未授权，令牌无效'
      }
    });
  }
};

/**
 * 角色授权中间件
 * 检查用户是否具有所需角色
 * @param {...String} roles - 允许访问的角色
 * @returns {Function} - Express中间件函数
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // 检查用户是否存在且角色是否允许
    if (!req.user || !roles.includes(req.user.role)) {
      logger.warn(`权限不足: 用户 ${req.user?.id || 'unknown'} 尝试访问 ${req.originalUrl}`);
      return res.status(403).json({
        success: false,
        error: {
          message: `角色 ${req.user?.role || 'unknown'} 没有权限访问此资源`
        }
      });
    }
    
    next();
  };
}; 