const User = require('../models/User'); // استبدل هذا بالمسار الصحيح

exports.subscribe = async (req, res) => {
    const { userId, token } = req.body;

    try {
        // ابحث عن المستخدم في قاعدة البيانات
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود.' });
        }

        // أضف الرمز إلى قائمة رموز المستخدم
        user.fcmTokens = user.fcmTokens || [];
        if (!user.fcmTokens.includes(token)) {
            user.fcmTokens.push(token);
            await user.save();
        }

        res.status(200).json({ message: 'تم الاشتراك في الإشعارات بنجاح.' });
    } catch (error) {
        console.error('خطأ في الاشتراك في الإشعارات:', error);
        res.status(500).json({ message: 'فشل الاشتراك في الإشعارات.' });
    }
};