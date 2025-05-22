const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const reportController = require('../controllers/report.controller');

// 报告基本CRUD操作
router.route('/')
  .get(protect, reportController.getAllReports)
  .post(protect, reportController.createReport);

router.route('/:id')
  .get(protect, reportController.getReportById)
  .put(protect, reportController.updateReport)
  .delete(protect, reportController.deleteReport);

// 报告审核管理
router.route('/:id/review')
  .post(protect, reportController.reviewReport);

// 报告人员分配
router.route('/:id/assign')
  .post(protect, reportController.assignReportUsers);

// 报告合规检查
router.route('/:id/compliance')
  .post(protect, reportController.updateComplianceStatus);

// 报告附件管理
router.route('/:id/attachments')
  .post(protect, reportController.addReportAttachment);

// 报告版本历史
router.route('/:id/versions')
  .get(protect, reportController.getReportVersions)
  .post(protect, reportController.createReportVersion);

router.get('/:id/versions/:versionId', protect, reportController.getReportVersionById);

// 报告统计信息
router.get('/stats', protect, reportController.getReportStats);

// AI报告生成相关路由
router.post('/generate', protect, reportController.generateAIReport);
router.post('/check-compliance', protect, reportController.checkReportCompliance);
router.post('/regulation-recommendations', protect, reportController.getRegulationRecommendations);

module.exports = router; 