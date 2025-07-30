const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const {uploadPostImage} = require('../middleware/uploadMiddleware'); // استيراد multer
const path = require('path');
const multer = require('multer');


// إعداد multer للتعامل مع رفع الملفات
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, '/uploads/posts/'); // مجلد حفظ الصور
//     },
//     filename: (req, file, cb) => {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         cb(null, uniqueSuffix + path.extname(file.originalname));
//     }
// });

// const upload = multer({ storage: storage });

// تعريف routes
router.post('/', uploadPostImage.single('image'), postController.createPost);
router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);
router.put('/:id', uploadPostImage.single('image'), postController.updatePost);
router.delete('/:id', postController.deletePost);
router.post('/:id/comments', postController.addComment);
router.post('/:id/reactions', postController.addReaction);

module.exports = router;
