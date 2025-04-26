// models/EducationalNotification.js
const mongoose = require('mongoose');

const EducationalNotificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['توفير', 'استثمار', 'ديون', 'عام'],
        required: true
    },
    priority: {
        type: Number,
        default: 1
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    usersApplied: [{ 
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        appliedAt: { type: Date, default: Date.now }
    }]
});

module.exports = mongoose.model('EducationalNotification', EducationalNotificationSchema);