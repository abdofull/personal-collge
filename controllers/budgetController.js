// controllers/budgetController.js
const Budget = require('../models/Budget');
const Notification = require('../models/Notification');

exports.createBudget = async (req, res) => {
    try {
        const budget = new Budget(req.body);
        await budget.save();
        res.status(201).json({ message: 'تم إضافة الميزانية بنجاح', budget });
    } catch (error) {
        res.status(400).json({ message: 'فشل إضافة الميزانية', error });
    }
};

exports.getBudgets = async (req, res) => {
    try {
        const budgets = await Budget.find({ userId: req.query.userId });
        res.status(200).json({ budgets });
    } catch (error) {
        res.status(400).json({ message: 'فشل جلب الميزانيات', error });
    }
};

exports.deleteBudget = async (req, res) => {
    try {
        await Budget.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'تم حذف الميزانية بنجاح' });
    } catch (error) {
        res.status(400).json({ message: 'فشل حذف الميزانية', error });
    }
};
exports.getBudgetSummary = async (req, res) => {
    try {
        const budgets = await Budget.find({ userId: req.query.userId });
        const budgetCount = budgets.length; // عدد الميزانيات
        const lastBudget = budgetCount > 0 ? budgets[budgetCount - 1] : null; // تحقق من وجود الميزانيات

        res.status(200).json({
            lastBudget: lastBudget ? lastBudget.totalIncome : 0, // إذا لم توجد ميزانيات
            budgetCount: budgetCount
        });
    } catch (error) {
        res.status(400).json({ message: 'فشل جلب ملخص الميزانية', error });
    }
};

//لحذف جميع الميزانيات
// controllers/budgetController.js

exports.deleteUserBudgets = async (req, res) => {
    const { userId } = req.params; // الحصول على userId من المعلمات

    try {
        await Budget.deleteMany({ userId }); // حذف جميع الميزانيات المرتبطة بالمستخدم
        res.status(200).json({ message: 'تم حذف جميع الميزانيات بنجاح' });
    } catch (error) {
        res.status(400).json({ message: 'فشل حذف الميزانيات', error });
    }
};

// عند تجاوز الميزانية
exports.checkBudgetExceeded = async (userId, category, amount, budget) => {
    if (amount > budget) {
        await Notification.create({
            userId,
            title: 'تجاوز الميزانية',
            message: `لقد تجاوزت الميزانية المحددة لفئة ${category}`,
            type: 'warning',
            relatedEntity: 'budget',
            entityId: budget._id
        });
    }
};


