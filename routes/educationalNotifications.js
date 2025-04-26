// routes/educationalNotifications.js
const express = require('express');
const router = express.Router();
const EducationalNotification = require('../models/EducationalNotification');

// جلب الإشعارات التوعوية
router.get('/', async (req, res) => {
    try {
        const notifications = await EducationalNotification.find()
            .sort({ priority: -1, createdAt: -1 })
            .limit(5);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// الحصول على نصيحة عشوائية
router.get('/random', async (req, res) => {
    try {
      const tip = await EducationalNotification.aggregate([{ $sample: { size: 1 } }]);
      res.json(tip[0] || null);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  const UserPoints = require('../models/UserPoints');

// تقييم النصيحة
router.post('/:id/rate', async (req, res) => {
    try {
        const { action } = req.body;
        const update = action === 'like' 
            ? { $inc: { likes: 1 } } 
            : { $inc: { dislikes: 1 } };

        await EducationalNotification.findByIdAndUpdate(req.params.id, update);
        res.sendStatus(200);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// تطبيق النصيحة
router.post('/:id/apply', async (req, res) => {
    try {
        const userId = req.user._id; // افترضنا وجود نظام مصادقة
        const tip = await EducationalNotification.findById(req.params.id);

        // التحقق إذا كان المستخدم قد طبق النصيحة مسبقاً
        const alreadyApplied = tip.usersApplied.some(u => u.userId.equals(userId));
        if (alreadyApplied) {
            return res.status(400).json({ message: 'لقد طبقت هذه النصيحة مسبقاً' });
        }

        // إضافة المستخدم لقائمة المطبقين
        tip.usersApplied.push({ userId });
        await tip.save();

        // منح النقاط
        const pointsEarned = 10; // نقاط لكل نصيحة
        await UserPoints.findOneAndUpdate(
            { userId },
            { 
                $inc: { points: pointsEarned },
                $push: { 
                    earnedHistory: {
                        source: 'tip-application',
                        points: pointsEarned,
                        details: `تطبيق النصيحة: ${tip.title}`
                    }
                }
            },
            { upsert: true, new: true }
        );

        res.json({ points: pointsEarned });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

