const Goal = require('../models/Goal');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

// إنشاء هدف جديد
exports.createGoal = async (req, res) => {
    try {
        const goal = await Goal.create({
            ...req.body,
            userId: req.user.id
        });
        
        // إرسال إشعار
        await Notification.create({
            userId: req.user.id,
            title: 'هدف جديد',
            message: `تم إنشاء هدف جديد: ${goal.title}`,
            type: 'info',
            relatedEntity: 'goal',
            entityId: goal._id
        });
        
        res.status(201).json(goal);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// الحصول على أهداف المستخدم
exports.getUserGoals = async (req, res) => {
    try {
        const goals = await Goal.find({ userId: req.user.id });
        res.json(goals);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في جلب الأهداف' });
    }
};

// تحديث الهدف
exports.updateGoal = async (req, res) => {
    try {
        const goal = await Goal.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            req.body,
            { new: true }
        );
        
        if (!goal) {
            return res.status(404).json({ message: 'الهدف غير موجود' });
        }
        
        res.json(goal);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// حذف الهدف
exports.deleteGoal = async (req, res) => {
    try {
        const goal = await Goal.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });
        
        if (!goal) {
            return res.status(404).json({ message: 'الهدف غير موجود' });
        }
        
        // إلغاء ربط المعاملات بالهدف المحذوف
        await Transaction.updateMany(
            { goalId: goal._id },
            { $unset: { goalId: 1 } }
        );
        
        res.json({ message: 'تم حذف الهدف بنجاح' });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في حذف الهدف' });
    }
};

// ربط معاملة بالهدف
exports.linkTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.transactionId,
            userId: req.user.id
        });
        
        if (!transaction) {
            return res.status(404).json({ message: 'المعاملة غير موجودة' });
        }
        
        const goal = await Goal.findOne({
            _id: req.params.goalId,
            userId: req.user.id
        });
        
        if (!goal) {
            return res.status(404).json({ message: 'الهدف غير موجود' });
        }
        
        // تحديث الهدف والمعاملة
        const updatedGoal = await Goal.findByIdAndUpdate(
            goal._id,
            {
                $inc: { currentAmount: transaction.amount },
                $addToSet: { transactions: transaction._id }
            },
            { new: true }
        );
        
        await Transaction.findByIdAndUpdate(
            transaction._id,
            { goalId: goal._id }
        );
        
        // التحقق من إكمال الهدف
        if (updatedGoal.currentAmount >= updatedGoal.targetAmount) {
            await Goal.findByIdAndUpdate(goal._id, { status: 'completed' });
            
            await Notification.create({
                userId: req.user.id,
                title: 'تهانينا!',
                message: `لقد حققت هدفك: ${goal.title}`,
                type: 'success',
                relatedEntity: 'goal',
                entityId: goal._id
            });
        }
        
        res.json(updatedGoal);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


