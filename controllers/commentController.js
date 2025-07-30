// controllers/commentController.js
const Comment = require('../models/Comment');
const Post = require('../models/Post');

// إنشاء تعليق جديد
exports.createComment = async (req, res) => {
    try {
        const { content } = req.body;
        const postId = req.params.id;
        const userId = req.userId;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const comment = new Comment({
            content,
            user: userId,
            post: postId
        });

        await comment.save();

        // إضافة التعليق إلى البوست
        post.comments.push(comment._id);
        await post.save();

        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// حذف تعليق
exports.deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // التحقق من أن المستخدم هو صاحب التعليق
        if (comment.user.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // إزالة التعليق من البوست
        const post = await Post.findById(comment.post);
        post.comments = post.comments.filter(c => c.toString() !== comment._id.toString());
        await post.save();

        // حذف التعليق
        await comment.remove();

        res.json({ message: 'Comment deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};