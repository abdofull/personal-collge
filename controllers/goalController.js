const mongoose = require('mongoose');
const Goal = require('../models/Goal');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const ApiError = require('../utils/apierror');
const asyncHandler = require('express-async-handler');

// إنشاء خطة جديدة
exports.createGoal = asyncHandler(async (req, res, next) => {
    const { userId, title, targetAmount, endDate, type } = req.body;

    // التحقق من البيانات المطلوبة
    if (!title || !targetAmount || !endDate || !type) {
        return next(new ApiError(400, 'الرجاء إدخال جميع الحقول المطلوبة: العنوان، المبلغ المستهدف، التاريخ النهائي، النوع'));
    }

    // حساب المساهمة الشهرية التلقائية
    const startDate = new Date();
    const monthsRemaining = (new Date(endDate) - startDate) / (1000 * 60 * 60 * 24 * 30);
    const monthlyContribution = Math.ceil(targetAmount / monthsRemaining);

    const goal = await Goal.create({
        userId,
        title,
        description: req.body.description || '',
        targetAmount,
        currentAmount: req.body.currentAmount || 0,
        startDate,
        endDate,
        type,
        monthlyContribution,
        priority: req.body.priority || 'medium',
        linkedAccount: req.body.linkedAccount || ''
    });

    // إرسال إشعار
    await Notification.create({
        userId,
        title: 'خطة جديدة',
        message: `تم إنشاء خطة "${title}" بمبلغ مستهدف ${targetAmount} ريال`,
        type: 'info',
        relatedEntity: 'goal',
        entityId: goal._id
    });

    res.status(201).json({
        success: true,
        message: 'تم إنشاء الخطة بنجاح',
        data: goal
    });
});

// جلب جميع خطط المستخدم
exports.getUserGoals = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const { status, type } = req.query;

    const filter = { userId };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const goals = await Goal.find(filter).sort({ endDate: 1 });

    res.status(200).json({
        success: true,
        count: goals.length,
        data: goals
    });
});

// جلب خطة محددة
exports.getGoalById = asyncHandler(async (req, res, next) => {
    const goal = await Goal.findById(req.params.id);
    if (!goal) {
        return next(new ApiError(404, 'الخطة غير موجودة'));
    }

    // جلب المعاملات المرتبطة
    const transactions = await Transaction.find({ 
        goalId: goal._id 
    }).sort({ date: -1 });

    res.status(200).json({
        success: true,
        data: {
            ...goal.toObject(),
            transactions
        }
    });
});

// تحديث خطة
exports.updateGoal = asyncHandler(async (req, res, next) => {
    const { title, description, targetAmount, endDate, status } = req.body;
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
        return next(new ApiError(404, 'الخطة غير موجودة'));
    }

    // تحديث الحقول الأساسية
    if (title) goal.title = title;
    if (description) goal.description = description;
    if (targetAmount) goal.targetAmount = targetAmount;
    if (endDate) goal.endDate = endDate;
    if (status) goal.status = status;

    // إعادة حساب المساهمة الشهرية إذا تغير المبلغ أو التاريخ
    if (targetAmount || endDate) {
        const monthsRemaining = (new Date(goal.endDate) - new Date()) / (1000 * 60 * 60 * 24 * 30);
        goal.monthlyContribution = Math.ceil(goal.targetAmount / monthsRemaining);
    }

    await goal.save();

    // إرسال إشعار بالتحديث
    if (req.body.notifyUser !== false) {
        await Notification.create({
            userId: goal.userId,
            title: 'تم تحديث الخطة',
            message: `تم تحديث خطة "${goal.title}"`,
            type: 'info',
            relatedEntity: 'goal',
            entityId: goal._id
        });
    }

    res.status(200).json({
        success: true,
        message: 'تم تحديث الخطة بنجاح',
        data: goal
    });
});

// حذف خطة
exports.deleteGoal = asyncHandler(async (req, res, next) => {
    const goal = await Goal.findById(req.params.id);
    if (!goal) {
        return next(new ApiError(404, 'الخطة غير موجودة'));
    }

    // فصل المعاملات المرتبطة أولاً
    await Transaction.updateMany(
        { goalId: goal._id },
        { $unset: { goalId: 1 } }
    );

    await goal.deleteOne();

    res.status(200).json({
        success: true,
        message: 'تم حذف الخطة بنجاح'
    });
});

// إضافة مبلغ إلى الخطة يدويًا
exports.addToGoal = asyncHandler(async (req, res, next) => {
    const { amount } = req.body;
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
        return next(new ApiError(404, 'الخطة غير موجودة'));
    }

    if (!amount || amount <= 0) {
        return next(new ApiError(400, 'المبلغ يجب أن يكون رقمًا موجبًا'));
    }

    goal.currentAmount += amount;
    await goal.save();

    // إنشاء معاملة مرتبطة (اختياري)
    const transaction = await Transaction.create({
        userId: goal.userId,
        amount,
        type: 'income',
        category: 'ادخار',
        description: `إضافة إلى الخطة: ${goal.title}`,
        goalId: goal._id
    });

    res.status(200).json({
        success: true,
        message: 'تمت إضافة المبلغ إلى الخطة',
        data: goal,
        transaction
    });
});

// جلب إحصائيات الخطط
exports.getGoalsStats = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;

    if (!userId) {
        return next(new ApiError(400, 'معرف المستخدم مطلوب'));
    }
    const goalsCount = await Goal.countDocuments({ userId });
    if (goalsCount === 0) {
        return next(new ApiError(404, 'لا توجد أهداف لهذا المستخدم'));
    };

    try {
        const stats = await Goal.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $group: {
                _id: '$type',
                totalGoals: { $sum: 1 },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                totalTarget: { $sum: '$targetAmount' },
                totalSaved: { $sum: '$currentAmount' }
            }},
            { $project: {
                type: '$_id',
                totalGoals: 1,
                completed: 1,
                completionRate: { $divide: ['$completed', '$totalGoals'] },
                totalTarget: 1,
                totalSaved: 1,
                remaining: { $subtract: ['$totalTarget', '$totalSaved'] }
            }}
        ]);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('خطأ في استعلام إحصائيات الأهداف:', error);
        return next(new ApiError(500, 'حدث خطأ أثناء جلب الإحصائيات'));
    }
});

// تحديث تقدم الخطة تلقائيًا من المعاملات
exports.updateGoalProgress = asyncHandler(async (req, res, next) => {
    const goal = await Goal.findById(req.params.id);
    if (!goal) {
        return next(new ApiError(404, 'الخطة غير موجودة'));
    }

    await goal.updateCurrentAmount();

    // التحقق من إكمال الهدف
    if (goal.currentAmount >= goal.targetAmount && goal.status !== 'completed') {
        goal.status = 'completed';
        await goal.save();

        await Notification.create({
            userId: goal.userId,
            title: 'تهانينا!',
            message: `لقد حققت هدفك "${goal.title}" بنجاح`,
            type: 'success',
            relatedEntity: 'goal',
            entityId: goal._id
        });
    }

    res.status(200).json({
        success: true,
        message: 'تم تحديث تقدم الخطة',
        data: goal
    });
});