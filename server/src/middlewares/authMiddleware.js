const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * 验证用户是否已认证
 */
const protect = async (req, res, next) => {
  let token;

  // 检查请求头中是否包含token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 获取token
      token = req.headers.authorization.split(' ')[1];

      // 验证token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 查找用户信息并添加到请求对象中（不包含密码）
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      res.status(401);
      throw new Error('未授权，token无效');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('未授权，没有token');
  }
};

/**
 * 验证用户是否具有管理员权限
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('没有足够的权限，仅限管理员');
  }
};

/**
 * 验证用户角色是否有权限访问
 * @param {Array} roles - 允许访问的角色数组
 * @returns {Function} - 中间件函数
 */
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('未授权，请先登录');
    }

    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403);
      throw new Error('没有足够的权限');
    }
  };
};

module.exports = { protect, admin, checkRole }; 