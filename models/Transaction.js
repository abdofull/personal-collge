// استيراد مكتبة mongoose للتفاعل مع قاعدة بيانات MongoDB.
const mongoose = require('mongoose');

// تعريف مخطط المعاملة باستخدام mongoose.Schema.
const transactionSchema = new mongoose.Schema({
    // معرف المستخدم، يجب أن يكون موجودًا ويشير إلى المستخدم الذي يمتلك هذه المعاملة.
    userId: {
        type: mongoose.Schema.Types.ObjectId, // نوع المعرف هو ObjectId للإشارة إلى سجل مستخدم في قاعدة البيانات.
        required: true, // يجب أن يكون هذا الحقل موجودًا.
        ref: 'User' // يشير إلى نموذج المستخدم المرتبط بهذه المعاملة.
    },
    
    // فئة المعاملة، يجب أن يكون موجودًا ويشير إلى نوع المعاملة (مثل الطعام، الإيجار، إلخ).
    category: {
        type: String, // نوع البيانات هو نص.
        required: true // يجب أن يكون هذا الحقل موجودًا.
    },
    
    // المبلغ الذي تم إنفاقه أو دخله، يجب أن يكون رقمًا ويجب أن يكون موجودًا.
    amount: {
        type: Number, // نوع البيانات هو رقم.
        required: true // يجب أن يكون هذا الحقل موجودًا.
    },
    
    // نوع المعاملة، يجب أن يكون واحدًا من القيم المحددة في enum.
    type: {
        type: String, // نوع البيانات هو نص.
        enum: ['income', 'expense'], // القيم المسموح بها هي "دخل" أو "مصروفات".
        required: true // يجب أن يكون هذا الحقل موجودًا.
    },
    
    // تاريخ المعاملة، القيمة الافتراضية هي الوقت الحالي.
    date: {
        type: Date, // نوع البيانات هو تاريخ.
        default: Date.now // إذا لم يتم تحديده، ستكون القيمة هي الوقت الحالي.
    },
    
    // وصف المعاملة، القيمة الافتراضية هي سلسلة فارغة.
    description: {
        type: String, // نوع البيانات هو نص.
        default: '' // إذا لم يتم تحديده، ستكون القيمة سلسلة فارغة.
    },
     budgetId:
         { 
            type: mongoose.Schema.Types.ObjectId,
             ref: 'Budget' 
        },
        
        budgetItemName: {
            type : String
        }, // إضافة هذا الحقل لربط المعاملة ببند الميزانية
        goalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Goal',
            default: null // ← هذا الحقل الجديد الوحيد
        }
},{timestamps: true}); // إضافة timestamps لتسجيل تاريخ الإنشاء والتحديث تلقائيًا

// تصدير نموذج المعاملة لاستخدامه في أجزاء أخرى من التطبيق.
module.exports = mongoose.model('Transaction', transactionSchema);

