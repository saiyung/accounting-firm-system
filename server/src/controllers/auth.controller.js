const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const MockDbService = require('../services/MockDbService');
const logger = require('../utils/logger');

// 创建用户服务实例
const userService = new MockDbService('users');

/**
 * 生成JWT令牌
 * @param {String} id - 用户ID
 * @returns {String} - JWT令牌
 */
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

/**
 * @desc    用户注册
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, department, role } = req.body;
    
    // 验证必要字段
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message: '请提供所有必要信息'
        }
      });
    }
    
    // 检查邮箱是否已被使用
    const existingUser = await userService.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          message: '该邮箱已被注册'
        }
      });
    }
    
    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 创建用户
    const user = await userService.create({
      name,
      email,
      password: hashedPassword,
      department: department || '未分配',
      role: role || 'employee'
    });
    
    // 生成令牌
    const token = generateToken(user.id);
    
    logger.info(`用户注册成功: ${user.email}`);
    
    // 返回用户信息和令牌
    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
        token
      }
    });
  } catch (error) {
    logger.error(`用户注册失败: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    用户登录
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // 验证必要字段
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message: '请提供邮箱和密码'
        }
      });
    }
    
    // 查找用户
    const user = await userService.findOne({ email });
    
    // 如果用户不存在
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: '邮箱或密码不正确'
        }
      });
    }
    
    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          message: '邮箱或密码不正确'
        }
      });
    }
    
    // 生成令牌
    const token = generateToken(user.id);
    
    logger.info(`用户登录成功: ${user.email}`);
    
    // 返回用户信息和令牌
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
        token
      }
    });
  } catch (error) {
    logger.error(`用户登录失败: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    获取当前用户信息
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    // 用户信息已在auth中间件中添加到req
    const user = req.user;
    
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role
      }
    });
  } catch (error) {
    logger.error(`获取用户信息失败: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    修改密码
 * @route   PUT /api/auth/password
 * @access  Private
 */
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 获取用户信息（包含密码）
    const user = await userService.findOne({ email: req.user.email }).select('+password');

    // 验证当前密码
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      res.status(401);
      throw new Error('当前密码不正确');
    }

    // 更新密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: '密码修改成功',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    忘记密码（发送重置密码链接）
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // 查找用户
    const user = await userService.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error('未找到使用该邮箱的用户');
    }

    // 在实际应用中，这里应该生成重置令牌并发送邮件
    // 此处仅作示例
    logger.info(`应向${email}发送密码重置链接`);

    res.json({
      success: true,
      message: '如果该邮箱存在，我们已向其发送密码重置链接',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    退出登录
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    // 在基于JWT的认证中，客户端只需要删除存储的token
    // 服务端无需额外操作
    res.json({
      success: true,
      message: '退出登录成功',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updatePassword,
  forgotPassword,
  logout,
}; 