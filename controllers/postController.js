const Post = require('../models/Post');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apierror');

// الحصول على جميع المنشورات
exports.getAllPosts = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
        .populate('author', 'username profileImage')
        .populate('likes.user', 'username')
        .populate('comments.user', 'username profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalPosts = await Post.countDocuments();
    const totalPages = Math.ceil(totalPosts / limit);

    res.status(200).json({
        success: true,
        data: posts,
        pagination: {
            currentPage: page,
            totalPages,
            totalPosts,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    });
});

// إنشاء منشور جديد
exports.createPost = asyncHandler(async (req, res, next) => {
    const { title, content } = req.body;
    const userId = req.user.id;

    if (!title || !content) {
        return next(new ApiError(400, 'العنوان والمحتوى مطلوبان'));
    }

    const image = req.file ? `/uploads/posts/${req.file.filename}` : '';

    const post = await Post.create({
        title,
        content,
        image,
        author: userId
    });

    const populatedPost = await Post.findById(post._id)
        .populate('author', 'username profileImage');

    res.status(201).json({
        success: true,
        message: 'تم إنشاء المنشور بنجاح',
        data: populatedPost
    });
});

// الحصول على منشور واحد
exports.getPost = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id)
        .populate('author', 'username profileImage')
        .populate('likes.user', 'username')
        .populate('comments.user', 'username profileImage');

    if (!post) {
        return next(new ApiError(404, 'المنشور غير موجود'));
    }

    res.status(200).json({
        success: true,
        data: post
    });
});

// تحديث منشور
exports.updatePost = asyncHandler(async (req, res, next) => {
    const { title, content } = req.body;
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await Post.findById(postId);

    if (!post) {
        return next(new ApiError(404, 'المنشور غير موجود'));
    }

    // التحقق من أن المستخدم هو صاحب المنشور
    if (post.author.toString() !== userId) {
        return next(new ApiError(403, 'غير مسموح لك بتعديل هذا المنشور'));
    }

    const updateData = { title, content };
    if (req.file) {
        updateData.image = `/uploads/posts/${req.file.filename}`;
    }

    const updatedPost = await Post.findByIdAndUpdate(
        postId,
        updateData,
        { new: true, runValidators: true }
    ).populate('author', 'username profileImage');

    res.status(200).json({
        success: true,
        message: 'تم تحديث المنشور بنجاح',
        data: updatedPost
    });
});

// حذف منشور
exports.deletePost = asyncHandler(async (req, res, next) => {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await Post.findById(postId);

    if (!post) {
        return next(new ApiError(404, 'المنشور غير موجود'));
    }

    // التحقق من أن المستخدم هو صاحب المنشور
    if (post.author.toString() !== userId) {
        return next(new ApiError(403, 'غير مسموح لك بحذف هذا المنشور'));
    }

    await Post.findByIdAndDelete(postId);

    res.status(200).json({
        success: true,
        message: 'تم حذف المنشور بنجاح'
    });
});

// إضافة إعجاب
exports.likePost = asyncHandler(async (req, res, next) => {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await Post.findById(postId);

    if (!post) {
        return next(new ApiError(404, 'المنشور غير موجود'));
    }

    // التحقق من وجود الإعجاب مسبقاً
    const existingLike = post.likes.find(like => like.user.toString() === userId);

    if (existingLike) {
        // إزالة الإعجاب
        post.likes = post.likes.filter(like => like.user.toString() !== userId);
    } else {
        // إضافة الإعجاب
        post.likes.push({ user: userId });
    }

    await post.save();

    const updatedPost = await Post.findById(postId)
        .populate('author', 'username profileImage')
        .populate('likes.user', 'username');

    res.status(200).json({
        success: true,
        message: existingLike ? 'تم إزالة الإعجاب' : 'تم إضافة الإعجاب',
        data: updatedPost
    });
});

// إضافة تعليق
exports.addComment = asyncHandler(async (req, res, next) => {
    const { content } = req.body;
    const postId = req.params.id;
    const userId = req.user.id;

    if (!content) {
        return next(new ApiError(400, 'محتوى التعليق مطلوب'));
    }

    const post = await Post.findById(postId);

    if (!post) {
        return next(new ApiError(404, 'المنشور غير موجود'));
    }

    post.comments.push({
        user: userId,
        content
    });

    await post.save();

    const updatedPost = await Post.findById(postId)
        .populate('author', 'username profileImage')
        .populate('comments.user', 'username profileImage');

    res.status(201).json({
        success: true,
        message: 'تم إضافة التعليق بنجاح',
        data: updatedPost
    });
});

// حذف تعليق
exports.deleteComment = asyncHandler(async (req, res, next) => {
    const { postId, commentId } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(postId);

    if (!post) {
        return next(new ApiError(404, 'المنشور غير موجود'));
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
        return next(new ApiError(404, 'التعليق غير موجود'));
    }

    // التحقق من أن المستخدم هو صاحب التعليق
    if (comment.user.toString() !== userId) {
        return next(new ApiError(403, 'غير مسموح لك بحذف هذا التعليق'));
    }

    post.comments.pull(commentId);
    await post.save();

    const updatedPost = await Post.findById(postId)
        .populate('author', 'username profileImage')
        .populate('comments.user', 'username profileImage');

    res.status(200).json({
        success: true,
        message: 'تم حذف التعليق بنجاح',
        data: updatedPost
    });
});

// الحصول على منشورات المستخدم
exports.getUserPosts = asyncHandler(async (req, res, next) => {
    const userId = req.params.userId || req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: userId })
        .populate('author', 'username profileImage')
        .populate('likes.user', 'username')
        .populate('comments.user', 'username profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalPosts = await Post.countDocuments({ author: userId });
    const totalPages = Math.ceil(totalPosts / limit);

    res.status(200).json({
        success: true,
        data: posts,
        pagination: {
            currentPage: page,
            totalPages,
            totalPosts,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    });
});

