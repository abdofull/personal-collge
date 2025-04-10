const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    updateInitialBalance,
    updateUserSettings,
    changePassword,
    updateProfileImage,
    getInitialBalance,
    deleteUserAccount
} = require('../controllers/userController');
const { body, param , validationResult } = require('express-validator');
const upload = require('../middleware/uploadMiddleware'); // استيراد multer
const validationMiddleware = require('../middleware/vallidatorMiddlware');

// 1. إنشاء مستخدم جديد (مع تحميل الصورة)
router.post('/register', upload.single('profileImage'), [
    body('username').notEmpty().withMessage('اسم المستخدم مطلوب'),
    body('email').isEmail().withMessage('البريد الإلكتروني غير صالح'),
    body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون على الأقل 6 أحرف'),
    validationMiddleware
], registerUser);

// 2. تسجيل الدخول
router.post('/login', [
    body('email').isEmail().withMessage('البريد الإلكتروني غير صالح'),
    body('password').notEmpty().withMessage('كلمة المرور مطلوبة'),
    validationMiddleware
], loginUser);

// 3. تحديث الرصيد الأولي
router.put('/updateBalance', [
    body('userId').isMongoId().withMessage('معرف المستخدم غير صالح'),
    body('initialBalance').isNumeric().withMessage('الرصيد يجب أن يكون رقمًا'),
    validationMiddleware
], updateInitialBalance);

// 4. تحديث إعدادات الحساب
router.put('/settings/:userId', [
    param('userId').isMongoId().withMessage('معرف المستخدم غير صالح'),
    body('username').notEmpty().withMessage('اسم المستخدم مطلوب'),
    body('email').isEmail().withMessage('البريد الإلكتروني غير صالح'),
    validationMiddleware
], updateUserSettings);

// 5. تغيير كلمة المرور
router.put('/changePassword/:userId', [
    param('userId').isMongoId().withMessage('معرف المستخدم غير صالح'),
    body('currentPassword').notEmpty().withMessage('كلمة المرور الحالية مطلوبة'),
    body('newPassword').isLength({ min: 6 }).withMessage('كلمة المرور الجديدة يجب أن تكون على الأقل 6 أحرف')
    ,
    validationMiddleware
], changePassword);

// 6. تحديث صورة المستخدم
router.put('/updateProfileImage/:userId', upload.single('profileImage'), [
    param('userId').isMongoId().withMessage('معرف المستخدم غير صالح'),
    validationMiddleware
], updateProfileImage);


// جلب الرصيد الأولي
router.get('/getInitialBalance', getInitialBalance);

// مسار تسجيل الخروج
router.post('/logout/:userId', deleteUserAccount);

module.exports = router;