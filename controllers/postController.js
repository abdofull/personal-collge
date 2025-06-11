const Post = require('../models/Post'); // تأكد من المسار الصحيح للنموذج
const fs = require('fs');
const path = require('path');

// دالة إنشاء بوست جديد
exports.createPost = async (req, res) => {

    console.log('=== بداية الطلب ===');
    console.log('Request Body:', req.body);
    console.log('Request File:', req.file);
    console.log('Request Headers:', req.headers);
    
    try {
        const { title, content, user } = req.body;
        
        let imagePath = '';
        if (req.file) {
            imagePath = req.file.path; // مسار الصورة المحفوظة
        }

        const newPost = new Post({
            title,
            content,
            image: imagePath,
            user: {
                username: user.username,
                profileImage: user.profileImage
            }
        });

        await newPost.save();
        res.status(201).json(newPost);
    }catch (error) {
        console.error('!!! خطأ في createPost:', error);
        res.status(500).json({ 
          message: 'Error details',
          error: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        })
    }
};

// دالة الحصول على جميع البوستات
// دالة الحصول على جميع البوستات مع دعم التقسيم والترتيب والبحث
exports.getAllPosts = async (req, res) => {
    try {
        // استخراج معلمات الطلب
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; // القيمة الافتراضية 10
        const skip = (page - 1) * limit;
        
        // بناء كائن الترتيب
        let sort = {};
        if (req.query.sort === 'createdAt') {
            sort = { createdAt: 1 }; // من الأقدم للأحدث
        } else if (req.query.sort === '-createdAt') {
            sort = { createdAt: -1 }; // من الأحدث للأقدم
        } else if (req.query.sort === '-reactions') {
            sort = { reactions: -1 }; // الأكثر تفاعلاً
        } else {
            sort = { createdAt: -1 }; // الافتراضي: الأحدث أولاً
        }
        
        // بناء استعلام البحث
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
        
        // تنفيذ الاستعلام مع التقسيم والترتيب
        const [posts, total] = await Promise.all([
            Post.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(), // استخدام lean() للحصول على كائنات JavaScript عادية
            
            Post.countDocuments(query) // حساب العدد الكلي للمنشورات
        ]);
        
        // تحسين مسارات الصور إذا كانت محلية
        const processedPosts = posts.map(post => {
            if (post.image && !post.image.startsWith('http')) {
                post.image = post.image.replace(/\\/g, '/').replace('public/', '');
            }
            if (post.user.profileImage && !post.user.profileImage.startsWith('http')) {
                post.user.profileImage = post.user.profileImage.replace(/\\/g, '/').replace('public/', '');
            }
            return post;
        });
        
        // إرسال الاستجابة مع البيانات المطلوبة للواجهة الأمامية
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
        let updateData = { title, content };

        if (req.file) {
            updateData.image = req.file.path;
            
            // حذف الصورة القديمة إذا كانت موجودة
            const oldPost = await Post.findById(req.params.id);
            if (oldPost.image && fs.existsSync(oldPost.image)) {
                fs.unlinkSync(oldPost.image);
            }
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// دالة حذف بوست
exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findByIdAndDelete(req.params.id);
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // حذف الصورة المرتبطة إذا كانت موجودة
        if (post.image && fs.existsSync(post.image)) {
            fs.unlinkSync(post.image);
        }

        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// دالة إضافة تعليق
exports.addComment = async (req, res) => {
    try {
        const { user, content } = req.body;
        
        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            { $push: { comments: { user, content } } },
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// دالة إضافة رد فعل (Like)
exports.addReaction = async (req, res) => {
    try {
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
        res.status(500).json({ message: error.message });
    }
};
