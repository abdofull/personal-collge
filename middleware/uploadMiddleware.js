const multer = require('multer');
const path = require('path');

// إعداد multer لرفع صور المستخدمين
const userStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '../public/uploads/profileImages/'); // تحديث المسار
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-user-' + path.extname(file.originalname)); // اسم الملف
    }
});

const upload = multer({ storage: userStorage });

// إعداد multer لرفع صور البوستات
const postStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '../public/uploads/posts/'); // تحديث المسار
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-post-' + path.extname(file.originalname)); // اسم الملف
    }
});

const uploadPostImage = multer({ storage: postStorage });

module.exports = {
     upload,
     uploadPostImage
};