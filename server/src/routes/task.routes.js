const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  createTask,
  getMyTasks,
  getTaskById,
  updateTask,
  deleteTask,
  completeTask
} = require('../controllers/task.controller');

// 获取当前用户的所有任务和创建新任务
router.route('/')
  .get(protect, getMyTasks)
  .post(protect, createTask);

// 完成任务的快捷路由
router.put('/:id/complete', protect, completeTask);

// 获取、更新和删除单个任务
router.route('/:id')
  .get(protect, getTaskById)
  .put(protect, updateTask)
  .delete(protect, deleteTask);

module.exports = router; 