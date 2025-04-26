const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    title: { type: String, required: false },
    content: { type: String, required: true },
    image: { type: String, required: false }, // رابط الصورة
    user: {
        username: { type: String, required: true },
        avatar: { type: String, required: true },
    },
    comments: [
        {
            user: { type: String, required: true },
            content: { type: String, required: true },
            date: { type: Date, default: Date.now },
        },
    ],
    reactions: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);