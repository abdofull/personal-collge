const Notification = require('../models/Notification');
const ApiError = require('../utils/apierror');
const asyncHandler = require('express-async-handler');
const Goal = require('../models/Goal');
const admin = require('firebase-admin');
const User = require('../models/User');



async function sendFcmNotification(userId, title, message) {
    try {
        // ابحث عن المستخدم في قاعدة البيانات
        const user = await User.findById(userId);

        if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
            console.log('المستخدم غير موجود أو ليس لديه رموز تسجيل.');
            return;
        }

        const notificationMessage = {
            notification: {
                title: title,
                body: message
            },
            tokens: user.fcmTokens
        };

        const response = await admin.messaging().sendMulticast(notificationMessage);
        console.log(response.successCount + ' تم إرسال الإشعارات بنجاح.');
        if (response.failureCount > 0) {
            console.log(response.errors);
        }
    } catch (error) {
        console.error('خطأ في إرسال إشعار FCM:', error);
    }
};


// إنشاء إشعار جديد
exports.createNotification = asyncHandler(async (req, res, next) => {
    const { userId, title, message, type, relatedEntity, entityId } = req.body;

    const notification = await Notification.create({
        userId,
        title,
        message,
        type,
        relatedEntity,
        entityId
    });

        // إرسال إشعار FCM
        await sendFcmNotification(userId, title, message);

    res.status(201).json({
        success: true,
        data: notification
    });
});

// جلب جميع إشعارات المستخدم
exports.getUserNotifications = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const { limit = 10, page = 1, unreadOnly } = req.query;

    const query = { userId };
    if (unreadOnly === 'true') {
        query.isRead = false;
    }

    const options = {
        sort: { createdAt: -1 },
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit)
    };

    const notifications = await Notification.find(query, null, options);
    const total = await Notification.countDocuments(query);

    res.status(200).json({
        success: true,
        count: notifications.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        data: notifications
    });
});

// تمييز إشعار كمقروء
exports.markAsRead = asyncHandler(async (req, res, next) => {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        return next(new ApiError(404, 'الإشعار غير موجود'));
    }

    res.status(200).json({
        success: true,
        data: notification
    });
});

// تمييز جميع الإشعارات كمقروءة
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;

    await Notification.updateMany(
        { userId, isRead: false },
        { $set: { isRead: true } }
    );

    res.status(200).json({
        success: true,
        message: 'تم تمييز جميع الإشعارات كمقروءة'
    });
});

// حذف إشعار
exports.deleteNotification = asyncHandler(async (req, res, next) => {
    const { notificationId } = req.params;

    await Notification.findByIdAndDelete(notificationId);

    res.status(200).json({
        success: true,
        message: 'تم حذف الإشعار بنجاح'
    });
});

// حذف جميع إشعارات المستخدم
exports.deleteAllUserNotifications = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;

    await Notification.deleteMany({ userId });

    res.status(200).json({
        success: true,
        message: 'تم حذف جميع إشعارات المستخدم'
    });
});

// وظيفة مساعدة لإنشاء إشعارات تلقائية
exports.createSystemNotification = async (userId, title, message, type = 'info', relatedEntity = null, entityId = null) => {
    try {
        await Notification.create({
            userId,
            title,
            message,
            type,
            relatedEntity,
            entityId
        });

                // إرسال إشعار FCM
                await sendFcmNotification(userId, title, message);

    } catch (error) {
        console.error('فشل إنشاء إشعار النظام:', error);
    }
};

exports.checkGoalProgress = async () => {
    try {
        // أهداف اقترب موعدها
        const nearingGoals = await Goal.find({
            isCompleted: false,
            deadline: { 
                $lte: new Date(Date.now() + 3*24*60*60*1000), // 3 أيام
                $gte: new Date() 
            }
        });

        for (const goal of nearingGoals) {
            await Notification.create({
                userId: goal.userId,
                title: 'موعد الهدف يقترب',
                message: `هدفك "${goal.title}" ينتهي في ${goal.deadline.toLocaleDateString()}`,
                type: 'goal',
                relatedEntity: 'goal',
                entityId: goal._id
            });

             // إرسال إشعار FCM
             await sendFcmNotification(goal.userId, notification.title, notification.message);
        }

        // أهداف اكتملت تلقائياً
        const completedGoals = await Goal.find({
            isCompleted: true,
            notifiedCompleted: { $ne: true }
        });

        for (const goal of completedGoals) {
            await Notification.create({
                userId: goal.userId,
                title: 'تهانينا! لقد حققت هدفك',
                message: `لقد حققت هدفك "${goal.title}" بنجاح`,
                type: 'goal',
                relatedEntity: 'goal',
                entityId: goal._id
            });

            // إرسال إشعار FCM
            await sendFcmNotification(goal.userId, notification.title, notification.message);
            
            await Goal.findByIdAndUpdate(goal._id, { notifiedCompleted: true });
        }
    } catch (error) {
        console.error('فشل في إرسال إشعارات الأهداف:', error);
    }
};

// تشغيل الدالة يومياً (يمكن استخدام Agenda.js أو node-cron)
