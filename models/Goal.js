const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    targetAmount: {
        type: Number,
        required: true,
        min: 1
    },
    currentAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    targetDate: {
        type: Date,
        validate: {
            validator: function(date) {
                return date > Date.now();
            },
            message: 'يجب أن يكون تاريخ الهدف في المستقبل'
        }
    },
    category: {
        type: String,
        enum: ['travel', 'car', 'house', 'education', 'other'],
        default: 'other'
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'archived'],
        default: 'active'
    },
    transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// تحديث التاريخ عند التعديل
goalSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Goal', goalSchema);

