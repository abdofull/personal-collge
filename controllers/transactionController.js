const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');
const Notification = require('../models/Notification');

// إضافة معاملة جديدة
exports.addTransaction = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { userId, category, amount, type } = req.body;

    try {
        const transaction = new Transaction({ userId, category, amount, type });
                // إرسال إشعار
                await Notification.create({
                    userId: req.body.userId,
                    title: 'معاملة جديدة',
                    message: `تم تسجيل معاملة جديدة بقيمة ${req.body.amount} دينار`,
                    type: 'info',
                    relatedEntity: 'transaction',
                    entityId: transaction._id
                });
        await transaction.save();
        res.status(201).json({ message: 'معاملة تم إضافتها بنجاح', transaction });
    } catch (error) {
        res.status(400).json({ message: 'حدث خطأ أثناء إضافة المعاملة', error: error.message });
    }
};

// الحصول على جميع المعاملات
exports.getTransactions = async (req, res) => {
    const userId = req.query.userId;

    try {
        const transactions = await Transaction.find({ userId });
        res.status(200).json(transactions);
    } catch (error) {
        res.status(400).json({ message: 'حدث خطأ أثناء استرجاع المعاملات', error: error.message });
    }
};

// تحديث معاملة
exports.updateTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ message: 'تم تحديث المعاملة بنجاح', transaction });
    } catch (error) {
        res.status(400).json({ message: 'حدث خطأ أثناء تحديث المعاملة', error: error.message });
    }
};

// حذف معاملة
exports.deleteTransaction = async (req, res) => {
    try {
        await Transaction.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'تم حذف المعاملة بنجاح' });
    } catch (error) {
        res.status(400).json({ message: 'حدث خطأ أثناء حذف المعاملة', error: error.message });
    }
};
// جلب إجمالي الدخل والمصروفات
exports.getTotals = async (req, res, next) => {
    const { userId } = req.query;

    if (!userId) {
        return next(new ApiError(400, 'معرف المستخدم مطلوب'));
    }

    const transactions = await Transaction.find({ userId });

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(transaction => {
        if (transaction.type === 'income') {
            totalIncome += transaction.amount;
        } else if (transaction.type === 'expense') {
            totalExpenses += transaction.amount;
        }
    });

    res.status(200).json({
        message: 'تم جلب الإجماليات بنجاح!',
        totalIncome,
        totalExpenses
    });
};

//لحذف حميع الميزانيات
// controllers/transactionController.js

exports.deleteUserTransactions = async (req, res) => {
    const { userId } = req.params; // الحصول على userId من المعلمات

    try {
        await Transaction.deleteMany({ userId }); // حذف جميع المعاملات المرتبطة بالمستخدم
        res.status(200).json({ message: 'تم حذف جميع المعاملات بنجاح' });
    } catch (error) {
        res.status(400).json({ message: 'فشل حذف المعاملات', error });
    }
};