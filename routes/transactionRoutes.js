const express = require('express');
const router = express.Router();
const { body  } = require('express-validator');
const {
    addTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction,
    getTotals,
    deleteUserTransactions
} = require('../controllers/transactionController');
const validationMiddleware = require('../middleware/vallidatorMiddlware');


// إضافة معاملة جديدة
router.post('/', [
    body('userId').isMongoId().withMessage('الرجاء توفير معرف مستخدم صحيح'),
    body('category').notEmpty().withMessage('الرجاء توفير الفئة'),
    body('amount').isNumeric().withMessage('الرجاء توفير مبلغ صحيح'),
    body('type').isIn(['income', 'expense']).withMessage('الرجاء تحديد نوع صحيح'),
    validationMiddleware
], addTransaction);

// الحصول على جميع المعاملات
router.get('/', getTransactions);

// تحديث معاملة
router.put('/:id', updateTransaction);

// حذف معاملة
router.delete('/:id', deleteTransaction);

// جلب إجمالي الدخل والمصروفات
router.get('/totals', getTotals);


// حذف كل المعاملات
router.delete('/transactions/:userId', deleteUserTransactions);

module.exports = router;