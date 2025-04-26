const mongoose = require('mongoose');

// تعريف مخطط الأهداف باستخدام mongoose.Schema.
const goalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User '
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    targetAmount: {
        type: Number,
        required: true
    },
    currentAmount: {
        type: Number,
        default: 0
    },
    dueDate: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// تصدير نموذج الأهداف لاستخدامه في أجزاء أخرى من التطبيق.
module.exports = mongoose.model('Goal', goalSchema);