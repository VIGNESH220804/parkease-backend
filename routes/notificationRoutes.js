const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Protect test notification route (optional, can be public for testing)
router.post('/test', authenticateToken, notificationController.sendTestNotification);

module.exports = router;
