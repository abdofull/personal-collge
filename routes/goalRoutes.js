const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const { body, param } = require('express-validator');
const validationMiddleware = require('../middleware/vallidatorMiddlware');

// إنشاء خطة جديدة
router.post('/', [
    body('userId').isMongoId().withMessage('معرف المستخدم غير صالح'),
    body('title').notEmpty().withMessage('عنوان الخطة مطلوب'),
    body('targetAmount').isNumeric().withMessage('المبلغ المستهدف يجب أن يكون رقمًا'),
    body('endDate').isISO8601().withMessage('التاريخ النهائي غير صالح'),
    body('type').isIn(['saving', 'debt', 'investment', 'purchase', 'other']).withMessage('نوع الخطة غير صالح'),
    validationMiddleware
], goalController.createGoal);

// جلب جميع خطط المستخدم
router.get('/user/:userId', [
    param('userId').isMongoId().withMessage('معرف المستخدم غير صالح'),
    validationMiddleware
], goalController.getUserGoals);

// جلب خطة محددة
router.get('/:id', [
    param('id').isMongoId().withMessage('معرف الخطة غير صالح'),
    validationMiddleware
], goalController.getGoalById);

// تحديث خطة
router.put('/:id', [
    param('id').isMongoId().withMessage('معرف الخطة غير صالح'),
    body('title').optional().notEmpty().withMessage('العنوان لا يمكن أن يكون فارغًا'),
    body('targetAmount').optional().isNumeric().withMessage('المبلغ المستهدف يجب أن يكون رقمًا'),
    body('endDate').optional().isISO8601().withMessage('التاريخ النهائي غير صالح'),
    body('status').optional().isIn(['active', 'completed', 'failed', 'paused']).withMessage('حالة غير صالحة'),
    validationMiddleware
], goalController.updateGoal);

// حذف خطة
router.delete('/:id', [
    param('id').isMongoId().withMessage('معرف الخطة غير صالح'),
    validationMiddleware
], goalController.deleteGoal);

// إضافة مبلغ إلى الخطة يدويًا
router.post('/:id/add', [
    param('id').isMongoId().withMessage('معرف الخطة غير صالح'),
    body('amount').isNumeric().withMessage('المبلغ يجب أن يكون رقمًا'),
    validationMiddleware
], goalController.addToGoal);

// جلب إحصائيات الخطط
router.get('/stats/:userId', [
    param('userId').isMongoId().withMessage('معرف المستخدم غير صالح'),
    validationMiddleware
], goalController.getGoalsStats);

// تحديث تقدم الخطة تلقائيًا
router.patch('/:id/update-progress', [
    param('id').isMongoId().withMessage('معرف الخطة غير صالح'),
    validationMiddleware
], goalController.updateGoalProgress);

module.exports = router;