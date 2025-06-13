const express = require('express'); // استيراد مكتبة Express لإنشاء التطبيق
const mongoose = require('mongoose'); // استيراد Mongoose للتعامل مع قاعدة البيانات MongoDB
const cors = require('cors'); // استيراد مكتبة CORS للسماح بالوصول من مواقع مختلفة

const dotenv = require('dotenv'); // استيراد مكتبة dotenv لتحميل متغيرات البيئة
const path = require('path'); // استيراد مكتبة path للتعامل مع مسارات الملفات
const bodyParser = require('body-parser'); // استيراد body-parser لتحليل بيانات الطلبات

// استيراد النماذج Routes
const User = require('./models/User'); // استيراد نموذج المستخدم
const Transaction = require('./routes/transactionRoutes'); // استيراد مسارات المعاملات
const budgetRoutes = require('./routes/budgetRoutes'); // استيراد مسارات الميزانية
const reportRoutes = require('./routes/Reports'); // استيراد مسارات التقارير
const goalRoutes = require('./routes/goalRoutes'); // استيراد مسارات الأهداف
const notificationRoutes = require('./routes/notificationRoutes'); // استيراد مسارات الإشعارات
const postRoutes = require('./routes/postRoutes'); // استيراد مسارات المنشورات
const { checkGoalProgress } = require('./controllers/notificationController'); // استيراد دالة للتحقق من تقدم الأهداف
const { seed } = require('./middleware/seedEducationalNotifications'); // استيراد دالة لتهيئة الإشعارات التعليمية
const Notification = require('./models/Notification'); // استيراد نموذج الإشعارات
const schedule = require('node-schedule'); // استيراد مكتبة جدولة المهام
const EducationalNotification = require('./models/EducationalNotification'); // استيراد نموذج الإشعارات التعليمية
const ApiError = require("./utils/apierror"); // استيراد نموذج للأخطاء
const Users = require("./routes/userRoutes"); // استيراد مسارات المستخدمين
const { globleError } = require("./middleware/errormiddleware"); // استيراد معالج الأخطاء العالمية

const app = express(); // إنشاء تطبيق Express

// تفعيل CORS للسماح بالوصول من جميع المصادر
app.use(cors({
    origin: '*', // السماح بجميع المصادر
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // السماح بالطرق المطلوبة
}));

// تقديم الملفات الثابتة من مجلد public
app.use(express.static(path.join(__dirname, 'public'))); // تقديم ملفات من مجلد public
// جعل مجلد uploads متاحًا للوصول العام من داخل public
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'))); // تقديم ملفات المرفقات من مجلد public/uploads
dotenv.config(); // تحميل متغيرات البيئة من ملف .env

const db = require('./config/db'); // استيراد ملف الاتصال بقاعدة البيانات
db(); // الاتصال بقاعدة البيانات

// Middleware لتحليل بيانات JSON
app.use(bodyParser.urlencoded({ extended: true })); // يسمح بتحليل البيانات من نماذج HTML
app.use(bodyParser.json()); // يسمح بتحليل بيانات JSON

// دالة لتهيئة البيانات الأولية
async function initializeData() {
    try {
        await seed(); // استدعاء دالة seed لتهيئة البيانات
        console.log('✅ تمت إضافة النصائح التوعوية بنجاح'); // طباعة رسالة نجاح
    } catch (error) {
        console.error('❌ فشل إضافة النصائح:', error); // طباعة رسالة خطأ
    }
}

// استدعاء الدالة لتهيئة البيانات عند بدء التطبيق
initializeData();

// التحقق من تقدم الأهداف
checkGoalProgress(); // استدعاء دالة تحقق تقدم الأهداف

// جعل مجلد uploads متاحًا للوصول العام
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // تقديم ملفات المرفقات من مجلد uploads

// إعداد المسارات
app.use('/', Users); // إعداد مسار المستخدمين
app.use('/api/transactions', Transaction); // إعداد مسار المعاملات
app.use('/api/budgets', budgetRoutes); // إعداد مسار الميزانية
app.use('/api/reports', reportRoutes); // إعداد مسار التقارير
app.use('/api/notifications', notificationRoutes); // إعداد مسار الإشعارات
app.use('/api/goals', goalRoutes); // إعداد مسار الأهداف
app.use('/api/educational-notifications', require('./routes/educationalNotifications')); // إعداد مسار الإشعارات التعليمية
app.use('/api/posts', postRoutes); // إعداد مسار المنشورات

// في حال ذهب المستخدم إلى رابط غير موجود
app.all("*", (req, res, next) => {
    next(new ApiError(404, `المسار ${req.originalUrl} غير موجود`)); // إرجاع خطأ 404 إذا كان المسار غير موجود
});

// هنا يتم استدعاء الخطأ في حال حدوث خطأ في الطلب
app.use(globleError); // استخدام معالج الأخطاء العالمية

// جدولة إرسال نصائح يومية
function scheduleDailyTips() {
    // تشغيل كل يوم في الساعة 8 صباحًا
    const job = schedule.scheduleJob('0 8 * * *', async () => {
        try {
            // 1. جلب نصيحة عشوائية
            const tips = await EducationalNotification.aggregate([{ $sample: { size: 1 } }]); // جلب نصيحة عشوائية
            const randomTip = tips[0]; // اختيار النصيحة العشوائية
            
            if (!randomTip) return; // إذا لم توجد نصيحة، اخرج من الدالة

            // 2. جلب جميع المستخدمين
            const users = await User.find({}); // جلب جميع المستخدمين
            
            // 3. إرسال الإشعار لكل مستخدم
            users.forEach(async (user) => {
                const notification = await Notification.create({
                    userId: user._id, // معرف المستخدم
                    title: randomTip.title, // عنوان النصيحة
                    message: randomTip.message, // محتوى النصيحة
                    type: 'info', // نوع الإشعار
                    relatedEntity: 'educational-tip', // الكيان المرتبط
                    entityId: randomTip._id // معرف الكيان
                });

                // إرسال إشعار FCM
                await sendFcmNotification(user._id, notification.title, notification.message); // إرسال إشعار عبر FCM
            });
            
            console.log(`✅ تم إرسال النصيحة اليومية لـ ${users.length} مستخدم`); // طباعة عدد المستخدمين الذين تم إرسال النصيحة لهم
        } catch (error) {
            console.error('❌ فشل إرسال النصائح اليومية:', error); // طباعة رسالة خطأ
        }
    });
}

// بدء التطبيق على المنفذ المحدد
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`); // طباعة رسالة عند بدء السيرفر
    scheduleDailyTips(); // استدعاء دالة جدولة النصائح اليومية
});