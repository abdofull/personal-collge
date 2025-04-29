const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const User = require('./models/User');
const Transaction = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const reportRoutes = require('./routes/Reports');
const goalRoutes = require('./routes/goalRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
//const postRoutes = require('./routes/postRoutes'); // استيراد الرواتر للمنشورات
const notificationRoutes = require('./routes/notificationRoutes');
const Goal = require('./routes/goalRoutes');
const { checkGoalProgress } = require('./controllers/notificationController');
const { seed } = require('./public/js/seedEducationalNotifications');
const schedule = require('node-schedule');
const EducationalNotification = require('./models/EducationalNotification');
const ApiError = require("./utils/apierror");
const Users = require("./routes/userRoutes");
//const globalError = require("./middleware/errormiddleware");
app.use('/uploads', express.static('uploads')); // خدمة ملفات الصور

dotenv.config();
const db = require('./config/db');

// Middleware
app.use(cors());
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

app.use('/', Users);
app.use('/api/transactions', Transaction);
app.use('/api/budgets', budgetRoutes);
app.use('/api/reports', reportRoutes);// إعداد مسار الفئات
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);// إعداد مسار الإشعارات
app.use('/api/goals', goalRoutes);// إعداد مسار الأهداف
app.use('/api/educational-notifications' , require('./routes/educationalNotifications'));// إعداد مسار الإشعارات التعليمية
//app.use('/api/posts', postRoutes); // ربط الرواتر
app.use('/api/goals', goalRoutes);// إعداد مسار الأهداف

//app.use('/api/goals', Goal);

//في حال قام امستخدم بالذهاب رابط غير موجود هنا
//
app.all("*", (req, res , next) => {
    next(new ApiError(404, `المسار ${req.originalUrl} غير موجود`));
});

//هنا يتم استدعاء الخطأ الذي يحدث في حالة حدوث خطأ في الطلب الذي يتم ارساله من العميل الى السيرفر
//app.use(globalError);


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
          await Notification.create({
            userId: user._id,
            title: randomTip.title,
            message: randomTip.message,
            type: 'info',
            relatedEntity: 'educational-tip',
            entityId: randomTip._id
          });
          
          // هنا يمكنك إضافة إرسال إيميل أو رسالة SMS إذا أردت
        });
        
        console.log(`✅ تم إرسال النصيحة اليومية لـ ${users.length} مستخدم`);
      } catch (error) {
        console.error('❌ فشل إرسال النصائح اليومية:', error);
      }
    });
  }


app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
    scheduleDailyTips();
});
