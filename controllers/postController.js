const Post = require('../models/Post');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// دالة إنشاء بوست جديد
exports.createPost = async (req, res) => {
    console.log('=== بداية الطلب ===');
    console.log('Request Body:', req.body);
    console.log('Request File:', req.file);
    
    try {
        const { title, content, user } = req.body;
        
        // استخراج userId من التوكن
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token required' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        
        // جلب بيانات المستخدم من قاعدة البيانات
        const userData = await User.findById(userId);
        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        let imagePath = req.file ? `../public/uploads/posts/${req.file.filename}` : '';

        const newPost = new Post({
            title,
            content,
            image: imagePath,
            userId: userId, // إضافة userId
            user: {
                username: userData.username,
                profileImage: userData.profileImage
            }
        });

        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        console.error('!!! خطأ في createPost:', error);
        res.status(500).json({ 
            message: 'Error details',
            error: error.message,
        });
    }
};

// دالة الحصول على جميع البوستات مع دعم التقسيم والترتيب والبحث
exports.getAllPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        let sort = {};
        if (req.query.sort === 'createdAt') {
            sort = { createdAt: 1 };
        } else if (req.query.sort === '-createdAt') {
            sort = { createdAt: -1 };
        } else if (req.query.sort === '-reactions') {
            sort = { reactions: -1 };
        } else {
            sort = { createdAt: -1 };
        }
        
        let query = {};
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            query = {
                $or: [
                    { title: searchRegex },
                    { content: searchRegex },
                    { 'user.username': searchRegex }
                ]
            };
        }
        
        const [posts, total] = await Promise.all([
            Post.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            
            Post.countDocuments(query)
        ]);
        
        const processedPosts = posts.map(post => {
            if (post.image && !post.image.startsWith("http")) {
                post.image = `/uploads/posts/${path.basename(post.image)}`;
            }
            if (post.user && post.user.profileImage && !post.user.profileImage.startsWith("http")) {
                post.user.profileImage = `/uploads/profileImages/${path.basename(post.user.profileImage)}`;
            }
            return post;
        });
        
        res.status(200).json({
            success: true,
            data: processedPosts,
            total: total,
            page: page,
            pages: Math.ceil(total / limit),
            limit: limit
        });
        
    } catch (error) {
        console.error('Error in getAllPosts:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch posts',
            error: error.message
        });
    }
};

// دالة الحصول على بوست بواسطة ID
exports.getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// دالة تحديث بوست
exports.updatePost = async (req, res) => {
    try {
        const { title, content } = req.body;
        
        // التحقق من الملكية
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token required' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        
        // التحقق من أن المستخدم هو صاحب المنشور
        if (post.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to edit this post' });
        }
        
        let updateData = { title, content };

        if (req.file) {
            updateData.image = `/uploads/posts/${req.file.filename}`;
            
            // حذف الصورة القديمة إذا كانت موجودة
            if (post.image) {
                const oldImagePath = path.join(__dirname, '..', 'public', post.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.status(200).json(updatedPost);
    } catch (error) {
        console.error('Error in updatePost:', error);
        res.status(500).json({ message: error.message });
    }
};

// دالة حذف بوست
exports.deletePost = async (req, res) => {
    try {
        // التحقق من الملكية
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token required' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        
        // التحقق من أن المستخدم هو صاحب المنشور
        if (post.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }
        
        // حذف الصورة المرتبطة إذا كانت موجودة
        if (post.image) {
            const imagePath = path.join(__dirname, '..', 'public', post.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        await Post.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error in deletePost:', error);
        res.status(500).json({ message: error.message });
    }
};

// دالة إضافة تعليق
exports.addComment = async (req, res) => {
    try {
        const { user, content } = req.body;
        
        // التحقق من التوكن
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token required' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        
        // جلب بيانات المستخدم
        const userData = await User.findById(userId);
        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            { 
                $push: { 
                    comments: { 
                        user: userData.username, 
                        content,
                        createdAt: new Date()
                    } 
                } 
            },
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json(updatedPost);
    } catch (error) {
        console.error('Error in addComment:', error);
        res.status(500).json({ message: error.message });
    }
};

// دالة إضافة رد فعل (Like)
exports.addReaction = async (req, res) => {
    try {
        // التحقق من التوكن
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token required' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            { $inc: { reactions: 1 } },
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json(updatedPost);
    } catch (error) {
        console.error('Error in addReaction:', error);
        res.status(500).json({ message: error.message });
    }
};

