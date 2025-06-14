const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');

// استيراد النماذج Routes
const User = require('./models/User');
const Transaction = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const reportRoutes = require('./routes/Reports');
const goalRoutes = require('./routes/goalRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const postRoutes = require('./routes/postRoutes');
const { checkGoalProgress } = require('./controllers/notificationController');
const { seed } = require('./middleware/seedEducationalNotifications');
const Notification = require('./models/Notification');
const schedule = require('node-schedule');
const EducationalNotification = require('./models/EducationalNotification');
const ApiError = require("./utils/apierror");
const Users = require("./routes/userRoutes");
const { globleError } = require("./middleware/errormiddleware");

const app = express();

// تفعيل CORS للسماح بالوصول من جميع المصادر
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE' , 'PATCH'],
    credentials: true
}));

// تقديم الملفات الثابتة من مجلد public
app.use(express.static(path.join(__dirname, 'public')));
// جعل مجلد uploads متاحًا للوصول العام من داخل public
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

dotenv.config();

const db = require('./config/db');
db();

// Middleware لتحليل بيانات JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// دالة لتهيئة البيانات الأولية
async function initializeData() {
    try {
        await seed();
        console.log('✅ تمت إضافة النصائح التوعوية بنجاح');
    } catch (error) {
        console.error('❌ فشل إضافة النصائح:', error);
    }
}

// استدعاء الدالة لتهيئة البيانات عند بدء التطبيق
initializeData();

// التحقق من تقدم الأهداف
checkGoalProgress();

// إعداد المسارات
app.use('/', Users);
app.use('/api/transactions', Transaction);
app.use('/api/budgets', budgetRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/educational-notifications', require('./routes/educationalNotifications'));
app.use('/api/posts', postRoutes);

// في حال ذهب المستخدم إلى رابط غير موجود
app.all("*", (req, res, next) => {
    next(new ApiError(404, `المسار ${req.originalUrl} غير موجود`));
});

// هنا يتم استدعاء الخطأ في حال حدوث خطأ في الطلب
app.use(globleError);

// جدولة إرسال نصائح يومية
function scheduleDailyTips() {
    const job = schedule.scheduleJob('0 8 * * *', async () => {
        try {
            const tips = await EducationalNotification.aggregate([{ $sample: { size: 1 } }]);
            const randomTip = tips[0];
            
            if (!randomTip) return;

            const users = await User.find({});
            
            users.forEach(async (user) => {
                const notification = await Notification.create({
                    userId: user._id,
                    title: randomTip.title,
                    message: randomTip.message,
                    type: 'info',
                    relatedEntity: 'educational-tip',
                    entityId: randomTip._id
                });

                // إرسال إشعار FCM
                await sendFcmNotification(user._id, notification.title, notification.message);
            });
            
            console.log(`✅ تم إرسال النصيحة اليومية لـ ${users.length} مستخدم`);
        } catch (error) {
            console.error('❌ فشل إرسال النصائح اليومية:', error);
        }
    });
}

// بدء التطبيق على المنفذ المحدد
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    scheduleDailyTips();
});

