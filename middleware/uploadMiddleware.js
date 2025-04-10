const multer = require('multer');
const path = require('path');

// إعداد multer لتخزين الصور
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/profileImages/'); // مجلد تخزين الصور
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // اسم الملف
    }
});

const upload = multer({ storage: storage });

module.exports = upload; // تصدير upload لاستخدامه في الراوتر