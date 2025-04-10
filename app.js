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
const categoryRoutes = require('./routes/categoryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const Goal = require('./routes/goalRoutes');
const ApiError = require("./utils/apierror");
const Users = require("./routes/userRoutes");
//const globalError = require("./middleware/errormiddleware");

dotenv.config();
const db = require('./config/db');

// Middleware
app.use(cors());
app.use(bodyParser.json());

db();




app.use('/', Users);
app.use('/api/transactions', Transaction);
app.use('/api/budgets', budgetRoutes);
app.use('/api/reports', reportRoutes);// إعداد مسار الفئات
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);// إعداد مسار الإشعارات
app.use('/api/goals', Goal);

//في حال قام امستخدم بالذهاب رابط غير موجود هنا
//
app.all("*", (req, res , next) => {
    next(new ApiError(404, `المسار ${req.originalUrl} غير موجود`));
});

//هنا يتم استدعاء الخطأ الذي يحدث في حالة حدوث خطأ في الطلب الذي يتم ارساله من العميل الى السيرفر
//app.use(globalError);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});