// routes/budgetRoutes.js
const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const { param  } = require("express-validator");
const validationMiddleware = require('../middleware/vallidatorMiddlware');


router.post('/', budgetController.createBudget);
router.get('/', budgetController.getBudgets);
router.delete('/:id', [
    param('id').isMongoId().withMessage('معرف الميزانية غير صالح'),
    validationMiddleware,
] , budgetController.deleteBudget);
// routes/budgetRoutes.js
router.get('/summary', budgetController.getBudgetSummary);
// مسارات الميزانية
router.delete('/budgets/:userId', [
    param('userId').isMongoId().withMessage('معرف المستخدم غير صالح'),
    validationMiddleware
] , budgetController.deleteUserBudgets);

module.exports = router;