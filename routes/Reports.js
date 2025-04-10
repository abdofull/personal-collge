// routes/reportRoutes.js
const express = require('express');
const reportController = require('../controllers/reportcontrol');
//const { protect } = require('../middleware/authMiddleware'); // إذا كنت تستخدم middleware للحماية

const router = express.Router();

// إنشاء تقرير جديد
router.post('/', reportController.createReport);

// جلب جميع التقارير للمستخدم
router.get('/', reportController.getUserReports);

// جلب تقرير محدد
router.get('/:reportId', reportController.getReportById);

// حذف تقرير
router.delete('/:reportId', reportController.deleteReport);

// حذف كل التقارير
router.delete('/reports/:userId', reportController.deleteUserReports);

module.exports = router;