const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    type: {
        type: String,
        enum: ['info', 'warning', 'danger', 'success'],
        default: 'info'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    relatedEntity: {
        type: String,
        enum: ['transaction', 'budget', 'report', 'user', 'system'],
        required: false
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// فهرسة للحصول على إشعارات أسرع
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

