const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const templateController = require('../controllers/template.controller');

// 模板基本CRUD操作
router.route('/')
  .get(protect, templateController.getAllTemplates)
  .post(protect, templateController.createTemplate);

router.route('/:id')
  .get(protect, templateController.getTemplateById)
  .put(protect, templateController.updateTemplate)
  .delete(protect, templateController.deleteTemplate);

// 模板状态管理
router.route('/:id/status')
  .patch(protect, templateController.updateTemplateStatus);

// 模板版本历史
router.route('/:id/versions')
  .get(protect, templateController.getTemplateVersions);

// 复制模板
router.route('/:id/duplicate')
  .post(protect, templateController.duplicateTemplate);

// 模板统计信息
router.route('/stats')
  .get(protect, templateController.getTemplateStats);

module.exports = router; 