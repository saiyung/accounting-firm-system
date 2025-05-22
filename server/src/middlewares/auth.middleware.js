const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const config = require('../config/config');

/**
 * 保护路由中间件 - 确认用户已登录
 * 此中间件用于需要认证的路由
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // 从请求头或cookie中获取token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // 从Bearer token中提取
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // 或从cookie中获取
      token = req.cookies.token;
    }

    // 检查token是否存在
    if (!token) {
      res.status(401);
      throw new Error('未授权，无法访问此路由');
    }

    try {
      // 验证token
      const decoded = jwt.verify(token, config.jwt.secret);

      // 将用户信息添加到请求对象
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('找不到用户，可能已被删除');
      }

      next();
    } catch (error) {
      res.status(401);
      throw new Error('未授权，token无效');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * 角色授权中间件
 * 此中间件用于限制特定角色访问某些路由
 * @param {...String} roles - 允许访问的角色列表
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // 确保用户有角色且该角色在允许的列表中
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(`角色 ${req.user.role} 无权访问此路由`));
    }
    next();
  };
};

/**
 * 部门授权中间件
 * 此中间件用于限制特定部门访问某些路由
 * @param {...String} departments - 允许访问的部门列表
 */
const departmentAccess = (...departments) => {
  return (req, res, next) => {
    // 确保用户有部门且该部门在允许的列表中
    if (!req.user || !departments.includes(req.user.department)) {
      res.status(403);
      return next(new Error(`部门 ${req.user.department} 无权访问此路由`));
    }
    next();
  };
};

/**
 * 日志中间件
 * 记录请求用户和访问路径
 */
const logAccess = (req, res, next) => {
  if (req.user) {
    console.log(`用户 ${req.user.name} (${req.user._id}) 访问 ${req.originalUrl}`);
  }
  next();
};

module.exports = {
  protect,
  authorize,
  departmentAccess,
  logAccess,
}; 