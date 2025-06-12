const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');


const admin = require('firebase-admin');

//const serviceAccount = require("./config/contennt-app-firebase-adminsdk-fbsvc-5edc1d42ea.json");

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// });



const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');
const User = require('./models/User');
const Transaction = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const reportRoutes = require('./routes/Reports');
const goalRoutes = require('./routes/goalRoutes');
//const postRoutes = require('./routes/postRoutes'); // استيراد الرواتر للمنشورات
const notificationRoutes = require('./routes/notificationRoutes');
const Goal = require('./routes/goalRoutes');
const postRoutes = require('./routes/postRoutes');
const { checkGoalProgress } = require('./controllers/notificationController');
const { seed } = require('./middleware/seedEducationalNotifications');
const Notification = require('./models/Notification');
const schedule = require('node-schedule');
const EducationalNotification = require('./models/EducationalNotification');
const ApiError = require("./utils/apierror");
const Users = require("./routes/userRoutes");
const {globleError} = require("./middleware/errormiddleware");
app.use(cors());

// تقديم الملفات الثابتة من مجلد public
app.use(express.static(path.join(__dirname, 'public')));
dotenv.config();
const db = require('./config/db');

// Middleware
app.use(bodyParser.json());

db();



async function initializeData() {
    try {
      await seed();
      console.log('✅ تمت إضافة النصائح التوعوية بنجاح');
    } catch (error) {
      console.error('❌ فشل إضافة النصائح:', error);
    }
  }
  
  // استدعاء الدالة
  initializeData();


checkGoalProgress();
// جعل مجلد uploads متاحًا للوصول العام
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/', Users);
app.use('/api/transactions', Transaction);
app.use('/api/budgets', budgetRoutes);
app.use('/api/reports', reportRoutes);// إعداد مسار الفئات
app.use('/api/notifications', notificationRoutes);// إعداد مسار الإشعارات
app.use('/api/goals', goalRoutes);// إعداد مسار الأهداف
app.use('/api/educational-notifications' , require('./routes/educationalNotifications'));// إعداد مسار الإشعارات التعليمية
//app.use('/api/posts', postRoutes); // ربط الرواتر
app.use('/api/posts', postRoutes);// إعداد مسار المنشورات


//app.use('/api/goals', Goal);

//في حال قام امستخدم بالذهاب رابط غير موجود هنا
//
app.all("*", (req, res , next) => {
    next(new ApiError(404, `المسار ${req.originalUrl} غير موجود`));
});

//هنا يتم استدعاء الخطأ الذي يحدث في حالة حدوث خطأ في الطلب الذي يتم ارساله من العميل الى السيرفر
app.use(globleError);


// جدولة إرسال نصائح يومية
function scheduleDailyTips() {
  // تشغيل كل يوم في الساعة 8 صباحًا
  const job = schedule.scheduleJob('0 8 * * *', async () => {
      try {
          // 1. جلب نصيحة عشوائية
          const tips = await EducationalNotification.aggregate([{ $sample: { size: 1 } }]);
          const randomTip = tips[0];
          
          if (!randomTip) return;

          // 2. جلب جميع المستخدمين
          const users = await User.find({});
          
          // 3. إرسال الإشعار لكل مستخدم
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
};


app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
    scheduleDailyTips();
});
