const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
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
    description: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
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
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator: function(v) {
                return v > this.startDate;
            },
            message: 'End date must be after start date!'
        }
    },
    type: {
        type: String,
        enum: ['saving', 'debt', 'investment', 'purchase', 'other'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'failed', 'paused'],
        default: 'active'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    linkedAccount: {
        type: String,
        trim: true,
        default: '' // يمكن ربطه بحساب بنكي أو فئة محددة
    },
    monthlyContribution: {
        type: Number,
        required: true,
        min: 1
    },
    transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }],
    notificationsEnabled: {
        type: Boolean,
        default: true
    },
    progressPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    autoUpdate: {
        type: Boolean,
        default: true // لتحديث التلقائي للمبلغ الحالي من المعاملات المرتبطة
    }
}, { timestamps: true });

// Middleware لحساب النسبة المئوية للتقدم قبل الحفظ
goalSchema.pre('save', function(next) {
    if (this.isModified('currentAmount') || this.isModified('targetAmount')) {
        this.progressPercentage = Math.min(Math.round((this.currentAmount / this.targetAmount) * 100), 100);
    }
    next();
});

// دالة لتحديث المبلغ الحالي تلقائيًا من المعاملات المرتبطة
goalSchema.methods.updateCurrentAmount = async function() {
    const transactions = await mongoose.model('Transaction').find({
        goalId: this._id,
        type: 'income' // أو 'expense' حسب نوع الهدف
    });
    this.currentAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    await this.save();
};

// إنشاء فهرس لتحسين أداء الاستعلامات
goalSchema.index({ userId: 1, status: 1, endDate: 1 });

const Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal;
