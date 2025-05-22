const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const clientController = require('../controllers/client.controller');

// 客户基本CRUD操作
router.route('/')
  .get(protect, clientController.getAllClients)
  .post(protect, clientController.createClient);

router.route('/:id')
  .get(protect, clientController.getClientById)
  .put(protect, clientController.updateClient)
  .delete(protect, clientController.deleteClient);

// 客户状态管理
router.route('/:id/status')
  .patch(protect, clientController.updateClientStatus);

// 客户备注管理
router.route('/:id/notes')
  .post(protect, clientController.addClientNote);

// 客户附件管理
router.route('/:id/attachments')
  .post(protect, clientController.addClientAttachment);

// 客户统计信息
router.route('/stats')
  .get(protect, clientController.getClientStats);

module.exports = router; 