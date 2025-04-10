// استيراد مكتبة mongoose للتفاعل مع قاعدة بيانات MongoDB.
const mongoose = require('mongoose');

// تعريف مخطط الميزانية باستخدام mongoose.Schema.
const budgetSchema = new mongoose.Schema({
    // معرف المستخدم، يجب أن يكون موجودًا ويشير إلى المستخدم الذي يمتلك هذه الميزانية.
    userId: { type: String, required: true },

    // الشهر الذي تتعلق به الميزانية، يجب أن يكون موجودًا.
    month: { type: String, required: true },

    // السنة التي تتعلق بها الميزانية، يجب أن تكون رقمًا ويجب أن تكون موجودة.
    year: { type: Number, required: true },

    // إجمالي الدخل المخطط له، يجب أن يكون رقمًا ويجب أن يكون موجودًا.
    totalIncome: { type: Number, required: true },

    // إجمالي المصروفات المخطط لها، يجب أن يكون رقمًا ويجب أن يكون موجودًا.
    totalExpenses: { type: Number, required: true },

    // قائمة بالعناصر المخصصة في الميزانية.
    items: [{
        // اسم العنصر، يجب أن يكون موجودًا ويشير إلى ما تم تخصيصه.
        itemName: { type: String, required: true },

        // المبلغ المخصص لهذا العنصر، يجب أن يكون رقمًا ويجب أن يكون موجودًا.
        allocatedAmount: { type: Number, required: true },

        // المبلغ الذي تم إنفاقه من هذا العنصر، القيمة الافتراضية هي 0.
        spentAmount: { type: Number, default: 0 }
    }],

    // تاريخ إنشاء الميزانية، القيمة الافتراضية هي الوقت الحالي.
    createdAt: { type: Date, default: Date.now }
});

// تصدير نموذج الميزانية لاستخدامه في أجزاء أخرى من التطبيق.
module.exports = mongoose.model('Budget', budgetSchema);


