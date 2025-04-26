const express = require('express');
const router = express.Router();
const { createGoal, getGoals, updateGoal, deleteGoal } = require('../controllers/goalController'); // تأكد من تعديل المسار حسب هيكل مشروعك
//const { protect } = require('../middleware/authMiddleware'); // تأكد من وجود middleware للتحقق من المستخدم

// حماية جميع المسارات باستخدام middleware
//router.use(protect);

// إنشاء هدف جديد
router.post('/', createGoal);

// الحصول على جميع الأهداف
router.get('/', getGoals);

// تحديث هدف
router.put('/:goalId', updateGoal);

// حذف هدف
router.delete('/:goalId', deleteGoal);

module.exports = router;