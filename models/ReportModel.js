// استيراد مكتبة mongoose للتفاعل مع قاعدة بيانات MongoDB.
const mongoose = require('mongoose');

// تعريف مخطط التقرير باستخدام mongoose.Schema.
const reportSchema = new mongoose.Schema({
    // معرف المستخدم، يجب أن يكون موجودًا ويشير إلى المستخدم الذي يمتلك هذا التقرير.
    userId: {
        type: mongoose.Schema.Types.ObjectId, // نوع المعرف هو ObjectId للإشارة إلى سجل مستخدم في قاعدة البيانات.
        required: true, // يجب أن يكون هذا الحقل موجودًا.
        ref: 'User' // يشير إلى نموذج المستخدم المرتبط بهذا التقرير.
    },
    
    // نوع التقرير، يجب أن يكون واحدًا من القيم المحددة في enum.
    reportType: {
        type: String, // نوع البيانات هو نص.
        enum: ['monthly', 'yearly', 'custom'], // القيم المسموح بها هي "شهري"، "سنوي"، أو "مخصص".
        required: true // يجب أن يكون هذا الحقل موجودًا.
    },
    
    // تاريخ البدء للتقرير، يجب أن يكون موجودًا.
    startDate: {
        type: Date, // نوع البيانات هو تاريخ.
        required: true // يجب أن يكون هذا الحقل موجودًا.
    },
    
    // تاريخ الانتهاء للتقرير، يجب أن يكون موجودًا.
    endDate: {
        type: Date, // نوع البيانات هو تاريخ.
        required: true // يجب أن يكون هذا الحقل موجودًا.
    },
    
    // إجمالي الدخل، القيمة الافتراضية هي 0.
    totalIncome: {
        type: Number, // نوع البيانات هو رقم.
        default: 0 // إذا لم يتم تحديده، ستكون القيمة 0.
    },
    
    // إجمالي المصروفات، القيمة الافتراضية هي 0.
    totalExpenses: {
        type: Number, // نوع البيانات هو رقم.
        default: 0 // إذا لم يتم تحديده، ستكون القيمة 0.
    },
    
    // إجمالي المدخرات، القيمة الافتراضية هي 0.
    netSavings: {
        type: Number, // نوع البيانات هو رقم.
        default: 0 // إذا لم يتم تحديده، ستكون القيمة 0.
    },
    
    // قائمة بالفئات في التقرير، تحتوي على تفاصيل كل فئة.
    categories: [{
        // اسم الفئة، يجب أن يكون موجودًا.
        category: {
            type: String, // نوع البيانات هو نص.
            required: true // يجب أن يكون هذا الحقل موجودًا.
        },
        
        // المبلغ الإجمالي المخصص لهذه الفئة، القيمة الافتراضية هي 0.
        totalAmount: {
            type: Number, // نوع البيانات هو رقم.
            default: 0 // إذا لم يتم تحديده، ستكون القيمة 0.
        }
    }],
    
    // تاريخ إنشاء التقرير، القيمة الافتراضية هي الوقت الحالي.
    createdAt: {
        type: Date, // نوع البيانات هو تاريخ.
        default: Date.now // إذا لم يتم تحديده، ستكون القيمة هي الوقت الحالي.
    }
});

// تصدير نموذج التقرير لاستخدامه في أجزاء أخرى من التطبيق.
module.exports = mongoose.model('Report', reportSchema);

