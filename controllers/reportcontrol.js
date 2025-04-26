// controllers/reportController.js
const Report = require('../models/ReportModel');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/apierror');

// إنشاء تقرير جديد
exports.createReport = async (req, res, next) => {
    const { userId, reportType, startDate, endDate } = req.body;

    try {
        // جلب جميع المعاملات في النطاق الزمني
        const transactions = await Transaction.find({
            userId,
            date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        });

        if (transactions.length === 0) {
            return next(new ApiError(404, 'لا توجد معاملات في هذا النطاق الزمني!'));
        }

        // حساب الإجماليات
        let totalIncome = 0;
        let totalExpenses = 0;
        const categories = {};

        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                totalIncome += transaction.amount;
            } else {
                totalExpenses += transaction.amount;
                categories[transaction.category] = (categories[transaction.category] || 0) + transaction.amount;
            }
        });

        const netSavings = totalIncome - totalExpenses;

        // تحضير بيانات التقرير
        const reportData = {
            userId,
            reportType,
            startDate,
            endDate,
            totalIncome,
            totalExpenses,
            netSavings,
            categories: Object.keys(categories).map(category => ({
                category,
                totalAmount: categories[category]
            }))
        };

        // حفظ التقرير في قاعدة البيانات
        const report = await Report.create(reportData);

        res.status(201).json({
            message: 'تم إنشاء التقرير بنجاح!',
            report
        });
    } catch (error) {
        next(new ApiError(500, 'حدث خطأ أثناء إنشاء التقرير!'));
    }
};

// جلب جميع التقارير للمستخدم
exports.getUserReports = async (req, res, next) => {
    const { userId } = req.query;

    try {
        const reports = await Report.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json({
            message: 'تم جلب التقارير بنجاح!',
            reports
        });
    } catch (error) {
        next(new ApiError(500, 'حدث خطأ أثناء جلب التقارير!'));
    }
};

// جلب تقرير محدد
exports.getReportById = async (req, res, next) => {
    const { reportId } = req.params;

    try {
        const report = await Report.findById(reportId);
        if (!report) {
            return next(new ApiError(404, 'التقرير غير موجود!'));
        }

        res.status(200).json({
            message: 'تم جلب التقرير بنجاح!',
            report
        });
    } catch (error) {
        next(new ApiError(500, 'حدث خطأ أثناء جلب التقرير!'));
    }
};

// حذف تقرير
exports.deleteReport = async (req, res, next) => {
    const { reportId } = req.params;

    try {
        await Report.findByIdAndDelete(reportId);
        res.status(200).json({
            message: 'تم حذف التقرير بنجاح!'
        });
    } catch (error) {
        next(new ApiError(500, 'حدث خطأ أثناء حذف التقرير!'));
    }
};

//لحذف جميع التقارير
// controllers/reportController.js

exports.deleteUserReports = async (req, res) => {
    const { userId } = req.params; // الحصول على userId من المعلمات

    try {
        await Report.deleteMany({ userId }); // حذف جميع التقارير المرتبطة بالمستخدم
        res.status(200).json({ message: 'تم حذف جميع التقارير بنجاح' });
    } catch (error) {
        res.status(400).json({ message: 'فشل حذف التقارير', error });
    }
};

exports.generateGoalReport = async (req, res) => {
    try {
        const goals = await Goal.aggregate([
            { $match: { userId: req.user._id } },
            { $group: {
                _id: '$category',
                totalGoals: { $sum: 1 },
                completed: { $sum: { $cond: ['$isCompleted', 1, 0] } },
                totalAmount: { $sum: '$targetAmount' }
            }}
        ]);
        
        res.json(goals);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};






