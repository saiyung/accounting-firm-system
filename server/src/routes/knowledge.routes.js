const express = require('express');
const router = express.Router();
const {
  createKnowledge,
  getKnowledge,
  getKnowledgeById,
  updateKnowledge,
  deleteKnowledge,
  likeKnowledge,
  commentKnowledge,
  replyToComment,
  reviewKnowledge,
  getRecommendedKnowledge,
  getKnowledgeStats,
} = require('../controllers/knowledge.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// 所有路由都需要认证
router.use(protect);

// 获取统计数据
router.get('/stats', getKnowledgeStats);

// 获取推荐知识
router.get('/recommended', getRecommendedKnowledge);

// 获取和创建知识
router.route('/')
  .get(getKnowledge)
  .post(createKnowledge);

// 特定知识的操作
router.route('/:id')
  .get(getKnowledgeById)
  .put(updateKnowledge)
  .delete(deleteKnowledge);

// 点赞知识
router.post('/:id/like', likeKnowledge);

// 评论知识
router.post('/:id/comment', commentKnowledge);

// 回复评论
router.post('/:id/comment/:commentId/reply', replyToComment);

// 审核知识 - 只允许管理员和合伙人
router.post(
  '/:id/review',
  authorize('admin', 'partner'),
  reviewKnowledge
);

module.exports = router; 