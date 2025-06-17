const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    title: { type: String, required: false },
    content: { type: String, required: true },
    image: { 
        type: String, 
        required: false 
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // إضافة userId للتحقق من الملكية
    user: {
        username: { type: String, required: true },
        profileImage: { type: String },
    },
    comments: [
        {
            user: { type: String, required: true },
            content: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }, // تغيير date إلى createdAt للتوحيد
        },
    ],
    reactions: { type: Number, default: 0 },
}, { 
    timestamps: true,
    toJSON: { getters: true }
});

module.exports = mongoose.model('Post', PostSchema);

