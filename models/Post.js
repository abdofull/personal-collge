const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    title: { type: String, required: false },
    content: { type: String, required: true },
    image: 
    { 
        type: String, 
        required: false 

    },
    
    user: {
        username: { type: String, required: true },
        profileImage: { type: String },
    },
    comments: [
        {
            user: { type: String, required: true },
            content: { type: String, required: true },
            date: { type: Date, default: Date.now },
        },
    ],
    reactions: { type: Number, default: 0 },
}, { 
    timestamps: true,
    toJSON: { getters: true } // لتفعيل الـ getters عند تحويل النموذج لـ JSON
});

module.exports = mongoose.model('Post', PostSchema);
