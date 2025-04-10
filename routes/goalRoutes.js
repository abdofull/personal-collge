const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const authController = require('../controllers/userController');

// تأمين جميع المسارات
//router.use(authController.protect);

router.route('/')
    .post(goalController.createGoal)
    .get(goalController.getUserGoals);

router.route('/:id')
    .patch(goalController.updateGoal)
    .delete(goalController.deleteGoal);

router.post('/:goalId/link-transaction/:transactionId', goalController.linkTransaction);

module.exports = router;

