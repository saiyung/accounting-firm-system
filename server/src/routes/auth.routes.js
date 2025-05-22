/**
 * 认证路由
 */

const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

// 注册和登录路由
router.post('/register', register);
router.post('/login', login);

// 获取当前用户信息路由 (需要认证)
router.get('/me', protect, getMe);

module.exports = router; 