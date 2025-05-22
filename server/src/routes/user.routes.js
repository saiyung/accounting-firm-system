const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');

// ... existing routes ...

// 搜索用户
router.get('/search', protect, userController.searchUsers);

// ... existing routes ...

module.exports = router; 