const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// تعريف هيكل البيانات للمستخدم
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        // unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30,
        
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(v);
            },
            message: props => `${props.value} هو بريد إلكتروني غير صالح!`
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    initialBalance: { // الرصيد الأولي
        type: Number,
        default: 0 // القيمة الافتراضية هي 0
    },
    
    profileImage: { // رابط الصورة
        type: String,
        default: '' // القيمة الافتراضية فارغة

    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    notificationPreferences: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        budgetAlerts: { type: Boolean, default: true },
        balanceAlerts: { type: Boolean, default: true }
    },


});

// دالة لتشفير كلمة المرور قبل حفظ المستخدم
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// دالة للتحقق من صحة كلمة المرور
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


// إنشاء النموذج
const User = mongoose.model('User', userSchema);

module.exports = User;

