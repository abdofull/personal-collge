const express = require('express');
const notificationController = require('../controllers/notificationController');
const authController = require('../controllers/userController');
const router = express.Router();

// حماية جميع المسارات بعد هذا السطر
//router.use(authController.protect);

router.post('/', notificationController.createNotification);
router.get('/user/:userId', notificationController.getUserNotifications);
router.patch('/:notificationId/read', notificationController.markAsRead);
router.patch('/user/:userId/read-all', notificationController.markAllAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);
router.delete('/user/:userId/all', notificationController.deleteAllUserNotifications);

module.exports = router;