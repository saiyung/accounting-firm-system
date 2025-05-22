const express = require('express');
const router = express.Router();
const {
  createTimesheet,
  getMyTimesheets,
  getTimesheetById,
  updateTimesheet,
  deleteTimesheet,
  approveTimesheet,
  getProjectTimesheetStats,
  getUserMonthlyStats,
  addComment,
} = require('../controllers/timesheet.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// 所有路由都需要认证
router.use(protect);

// 获取和创建工作量记录
router.route('/')
  .get(getMyTimesheets)
  .post(createTimesheet);

// 按项目获取工时统计
router.get('/projects/:id/stats', getProjectTimesheetStats);

// 获取用户月度工时统计
router.get('/users/:id/monthly', getUserMonthlyStats);

// 特定工作量记录的操作
router.route('/:id')
  .get(getTimesheetById)
  .put(updateTimesheet)
  .delete(deleteTimesheet);

// 审核工作量记录 - 只允许经理、合伙人和管理员
router.put(
  '/:id/approve',
  authorize('manager', 'partner', 'admin'),
  approveTimesheet
);

// 添加评论到工作量记录
router.post('/:id/comments', addComment);

module.exports = router; 