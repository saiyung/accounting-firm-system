const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  getMyActivities,
  getTeamActivities,
  getProjectActivities,
  getAllActivities
} = require('../controllers/activity.controller');

// 获取所有活动（管理员）
router.get('/', protect, getAllActivities);

// 获取当前用户的活动
router.get('/me', protect, getMyActivities);

// 获取团队活动
router.get('/team', protect, getTeamActivities);

// 获取项目活动
router.get('/projects/:id', protect, getProjectActivities);

module.exports = router; 