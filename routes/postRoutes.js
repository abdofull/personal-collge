const express = require('express');
const router = express.Router();
const {
    getAllPosts,
    createPost,
    getPost,
    updatePost,
    deletePost,
    likePost,
    addComment,
    deleteComment,
    getUserPosts
} = require('../controllers/postController');
const { body, param } = require('express-validator');
const { uploadPostImage } = require('../middleware/uploadMiddleware');
const validationMiddleware = require('../middleware/vallidatorMiddlware');
// const { protect } = require('../middleware/authMiddleware');

// الحصول على جميع المنشورات (متاح للجميع)
router.get('/', getAllPosts);

// إنشاء منشور جديد (للمستخدمين المسجلين فقط)
router.post('/', uploadPostImage.single('image'), [
    body('title').notEmpty().withMessage('العنوان مطلوب')
        .isLength({ max: 200 }).withMessage('العنوان يجب أن يكون أقل من 200 حرف'),
    body('content').notEmpty().withMessage('المحتوى مطلوب')
        .isLength({ max: 2000 }).withMessage('المحتوى يجب أن يكون أقل من 2000 حرف'),
    validationMiddleware
], createPost);

// الحصول على منشور واحد
router.get('/:id', [
    param('id').isMongoId().withMessage('معرف المنشور غير صالح'),
    validationMiddleware
], getPost);

// تحديث منشور (للمؤلف فقط)
router.put('/:id', uploadPostImage.single('image'), [
    param('id').isMongoId().withMessage('معرف المنشور غير صالح'),
    body('title').optional().isLength({ max: 200 }).withMessage('العنوان يجب أن يكون أقل من 200 حرف'),
    body('content').optional().isLength({ max: 2000 }).withMessage('المحتوى يجب أن يكون أقل من 2000 حرف'),
    validationMiddleware
], updatePost);

// حذف منشور (للمؤلف فقط)
router.delete('/:id', [
    param('id').isMongoId().withMessage('معرف المنشور غير صالح'),
    validationMiddleware
], deletePost);

// إضافة/إزالة إعجاب (للمستخدمين المسجلين فقط)
router.post('/:id/like', [
    param('id').isMongoId().withMessage('معرف المنشور غير صالح'),
    validationMiddleware
], likePost);

// إضافة تعليق (للمستخدمين المسجلين فقط)
router.post('/:id/comments', [
    param('id').isMongoId().withMessage('معرف المنشور غير صالح'),
    body('content').notEmpty().withMessage('محتوى التعليق مطلوب')
        .isLength({ max: 500 }).withMessage('التعليق يجب أن يكون أقل من 500 حرف'),
    validationMiddleware
], addComment);

// حذف تعليق (لصاحب التعليق فقط)
router.delete('/:postId/comments/:commentId', [
    param('postId').isMongoId().withMessage('معرف المنشور غير صالح'),
    param('commentId').isMongoId().withMessage('معرف التعليق غير صالح'),
    validationMiddleware
], deleteComment);

// الحصول على منشورات مستخدم معين
router.get('/user/:userId', [
    param('userId').isMongoId().withMessage('معرف المستخدم غير صالح'),
    validationMiddleware
], getUserPosts);

// الحصول على منشورات المستخدم الحالي (للمستخدمين المسجلين فقط)
router.get('/my/posts', getUserPosts);

module.exports = router;

