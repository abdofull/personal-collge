const User = require('../models/User');
const Budget = require('../models/Budget');
const Report = require('../models/ReportModel');
const Transaction = require('../models/Transaction');
const asyncHandler = require('express-async-handler');
const Goal = require('../models/Goal');
const ApiError = require('../utils/apierror');
const jwt = require('jsonwebtoken');
const multer = require('multer');




const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// إنشاء مستخدم جديد
exports.registerUser = async (req, res, next) => {

    const { username, email, password } = req.body;

    // تحقق من وجود البريد الإلكتروني
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
        return next(new ApiError(400, 'البريد الإلكتروني مستخدم بالفعل!'));
    }

    // // تحقق من وجود اسم المستخدم
    // const existingUsername = await User.findOne({ username });
    // if (existingUsername) {
    //     return next(new ApiError(400, 'اسم المستخدم مستخدم بالفعل!'));
    // }

    const profileImage = req.file ? `../public/uploads/profileImages/${req.file.filename}` : ""; // إذا تم تحميل صورة

    try {
        const user = await User.create({ username, email, password, profileImage });
        const token = generateToken(user._id);

        res.status(201).json({
            message: 'تم إنشاء المستخدم بنجاح!',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage
            },
            token,
        });
    } catch (error) {
        // التعامل مع الأخطاء الأخرى
        return next(new ApiError(500, 'حدث خطأ أثناء إنشاء المستخدم. يرجى المحاولة لاحقًا.'));
    }
};

// دالة لتحديث صورة المستخدم
exports.updateProfileImage = async (req, res, next) => {
    const { userId } = req.params;

    if (!req.file) {
        return next(new ApiError(400, 'لم يتم تحميل أي صورة!'));
    }

    const user = await User.findById(userId);
    if (!user) {
        return next(new ApiError(404, 'المستخدم غير موجود!'));
    }

    user.profileImage = `../public/uploads/profileImages/${req.file.filename}`; // تحديث رابط الصورة
    await user.save();

    res.status(200).json({
        message: 'تم تحديث صورة المستخدم بنجاح!',
        user: {
            id: user._id,
            profileImage: user.profileImage
        }
    });
};


// تسجيل الدخول
exports.loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return next(new ApiError(401, 'البريد الإلكتروني أو كلمة المرور غير صحيحة!'));
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        return next(new ApiError(401, 'البريد الإلكتروني أو كلمة المرور غير صحيحة!'));
    }

    const token = generateToken(user._id);

    res.status(200).json({
        message: 'تم تسجيل الدخول بنجاح!',
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
        },
        token,
    });
};

// تحديث الرصيد الأولي
exports.updateInitialBalance = async (req, res, next) => {
    const { userId, initialBalance } = req.body;

    const user = await User.findById(userId);
    if (!user) {
        return next(new ApiError(404, 'المستخدم غير موجود!'));
    }

    user.initialBalance = initialBalance;
    await user.save();

    res.status(200).json({
        message: 'تم تحديث الرصيد الأولي بنجاح!',
        user: {
            id: user._id,
            initialBalance: user.initialBalance,
        },
    });
};

// جلب الرصيد الأولي للمستخدم
exports.getInitialBalance = async (req, res, next) => {
    const { userId } = req.query; // نأخذ userId من query parameters

    // تحقق من وجود userId
    if (!userId) {
        return next(new ApiError(400, 'معرف المستخدم (userId) مفقود!'));
    }

    // البحث عن المستخدم
    const user = await User.findById(userId);
    if (!user) {
        return next(new ApiError(404, 'المستخدم غير موجود!'));
    }

    // إرسال الرصيد الأولي
    res.status(200).json({
        initialBalance: user.initialBalance || 0, // إذا لم يكن هناك رصيد أولي، سيتم إرجاع 0
    });
};

// تحديث إعدادات الحساب (الاسم والبريد الإلكتروني)
exports.updateUserSettings = async (req, res, next) => {
    const { userId } = req.params; // نأخذ userId من params
    const { username, email } = req.body;

    // تحقق من وجود البيانات المطلوبة
    if (!username || !email) {
        return next(new ApiError(400, 'يرجى إدخال جميع الحقول المطلوبة: username, email'));
    }

    // تحقق من صحة البريد الإلكتروني
    const validateEmail = (email) => {
        const regex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
        return regex.test(email);
    };

    if (!validateEmail(email)) {
        return next(new ApiError(400, 'البريد الإلكتروني غير صالح!'));
    }

    // البحث عن المستخدم
    const user = await User.findById(userId);
    if (!user) {
        return next(new ApiError(404, 'المستخدم غير موجود!'));
    }

    // التحقق من عدم تكرار البريد الإلكتروني
    const existingEmail = await User.findOne({ email });
    if (existingEmail && existingEmail._id.toString() !== userId) {
        return next(new ApiError(400, 'البريد الإلكتروني مستخدم بالفعل!'));
    }

    // تحديث البيانات
    user.username = username;
    user.email = email;

    // حفظ التغييرات
    await user.save();

    res.status(200).json({
        message: 'تم تحديث إعدادات الحساب بنجاح!',
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
        },
    });
};

// تغيير كلمة المرور
exports.changePassword = async (req, res, next) => {
    const { userId } = req.params; // نأخذ userId من params
    const { currentPassword, newPassword } = req.body;

    // تحقق من وجود البيانات المطلوبة
    if (!currentPassword || !newPassword) {
        return next(new ApiError(400, 'يرجى إدخال جميع الحقول المطلوبة: currentPassword, newPassword'));
    }

    // البحث عن المستخدم
    const user = await User.findById(userId);
    if (!user) {
        return next(new ApiError(404, 'المستخدم غير موجود!'));
    }

    // التحقق من صحة كلمة المرور الحالية
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
        return next(new ApiError(401, 'كلمة المرور الحالية غير صحيحة!'));
    }

    // تحديث كلمة المرور
    user.password = newPassword;
    await user.save();

    res.status(200).json({
        message: 'تم تغيير كلمة المرور بنجاح!',
    });
};

// حذف حساب المستخدم بكامل التقارير والميزانيات والمعاملات
// حذف حساب المستخدم
exports.deleteUserAccount = async (req, res, next) => {
    const { userId } = req.params; // الحصول على userId من المعلمات

    try {
        // حذف جميع الميزانيات والتقارير والمعاملات
        await Goal.deleteMany({ userId });
        await Budget.deleteMany({ userId });
        await Report.deleteMany({ userId });
        await Transaction.deleteMany({ userId });

        // حذف المستخدم
        await User.findByIdAndDelete(userId);

        res.status(200).json({ message: 'تم حذف الحساب وجميع البيانات بنجاح' });
    } catch (error) {
        res.status(400).json({ message: 'فشل حذف الحساب', error });
    }
};

// جلب بيانات المستخدم
exports.getUserProfile = async (req, res, next) => {
    const { userId } = req.params; // نأخذ userId من params

    // تحقق من وجود المستخدم
    const user = await User.findById(userId);
    if (!user) {
        return next(new ApiError(404, 'المستخدم غير موجود!'));
    }

    // إرسال بيانات المستخدم
    res.status(200).json({
        message: 'تم جلب بيانات المستخدم بنجاح!',
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            initialBalance: user.initialBalance,
            profileImage: user.profileImage,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            notificationPreferences: user.notificationPreferences
        }
    });
};



