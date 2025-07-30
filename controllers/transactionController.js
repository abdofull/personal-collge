const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');

// إضافة معاملة جديدة
exports.addTransaction = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { userId, category, amount, type, budgetId, budgetItemName , description , goalId} = req.body;

    try {
        //const { goalId, ...transactionData } = req.body;
        const transaction = new Transaction({ 
            userId, 
            category, 
            amount, 
            type,
            description,
            ...(budgetId && { budgetId }),
            ...(budgetItemName && { budgetItemName })
        });

        // إذا كانت معاملة مصروف ومرتبطة بميزانية
        if (type === 'expense' && budgetId && budgetItemName) {
            // التأكد من وجود الميزانية وعدم تجميدها
            const budget = await Budget.findOne({
                _id: budgetId,
                userId: userId,
                isFrozen: { $ne: true } // التأكد من أن الميزانية غير مجمدة
            });

            if (!budget) {
                return res.status(400).json({ 
                    message: 'الميزانية غير موجودة أو غير نشطة' 
                });
            }

            // التأكد من وجود البند في الميزانية
            const itemExists = budget.items.some(item => 
                item.itemName === budgetItemName
            );

            if (!itemExists) {
                return res.status(400).json({ 
                    message: 'بند الميزانية غير موجود' 
                });
            }

            // يأخذ قيمة المصروف الحالي للبند itemExists.spentAmount ويضيف إليها amount المبلغ الجديد الذي يريد المستخدم صرفه
            // الناتج من العملية هو اجمالي المصروفات بعد إضافة معاملة جديدة
        const newSpentAmount = itemExists.spentAmount + amount;
        if (newSpentAmount > itemExists.allocatedAmount) {// إذا كان المبلغ المصروف الجديد يتجاوز المبلغ المخصص للبند
        // إنشاء إشعار تجاوز الميزانية
        await Notification.create({
            userId,
            title: 'تنبيه تجاوز الميزانية',
            message: `تم تجاوز الميزانية المخصصة لبند ${budgetItemName}. المبلغ المخصص: ${itemExists.allocatedAmount}, المبلغ المصروف: ${newSpentAmount}`,
            type: 'warning',
            relatedEntity: 'budget',
            entityId: budgetId
        });
    }




            // تحديث الميزانية
            const updateResult = await Budget.updateOne(
                { 
                    _id: budgetId,
                    "items.itemName": budgetItemName //يتم البحث بداخل البنود عن البند المحدد
                },
                { 
                    $inc: { 
                        "items.$.spentAmount": amount,//علامة $ تشير للبند الذي تم ايجاده في الإستعلام , يتم زيادة قيمة البند بالقيمة المصروفات التي تم إدخالها 
                        // "totalExpenses": amount 
                    } 
                }
  
            );

            if (updateResult.modifiedCount === 0) {
                console.error('فشل تحديث الميزانية:', {
                    budgetId,
                    budgetItemName,
                    amount
                });
                return res.status(400).json({ 
                    message: 'فشل تحديث الميزانية' 
                });
            }
        };

        if (goalId) {
            transaction.goalId = goalId;
            // تحديث الخطة المرتبطة
            const goal = await Goal.findById(goalId);
            if (goal && type === 'income') {
                goal.currentAmount += amount;
                await goal.save();
            }
        }

        await transaction.save();
        
        // إرسال إشعار
        await Notification.create({
            userId,
            title: 'معاملة جديدة',
            message: `تم تسجيل معاملة جديدة بقيمة ${amount} دينار`,
            type: 'info',
            relatedEntity: 'transaction',
            entityId: transaction._id
        });

        res.status(201).json({ 
            success: true,
            message: 'معاملة تم إضافتها بنجاح', 
            transaction 
        });

    } catch (error) {
        console.error('حدث خطأ أثناء إضافة المعاملة:', {
            error: error.message,
            body: req.body,
            stack: error.stack
        });
        res.status(400).json({ 
            message: 'حدث خطأ أثناء إضافة المعاملة',
            error: error.message
        });
    }
};



// الحصول على جميع المعاملات
exports.getTransactions = async (req, res) => {
    const userId = req.query.userId;

    try {
        const transactions = await Transaction.find({ userId });
        res.status(200).json(transactions);
    } catch (error) {
        res.status(400).json({ message: 'حدث خطأ أثناء استرجاع المعاملات', error: error.message });
    }
};



// جلب معاملة واحدة بواسطة ID
exports.getTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        
        if (!transaction) {
            return res.status(404).json({ 
                success: false,
                message: 'لم يتم العثور على المعاملة' 
            });
        }

        res.status(200).json({
            success: true,
            message: 'تم جلب المعاملة بنجاح',
            transaction
        });
    } catch (error) {
        console.error('حدث خطأ أثناء جلب المعاملة:', {
            error: error.message,
            params: req.params,
            stack: error.stack
        });
        
        res.status(400).json({ 
            success: false,
            message: 'حدث خطأ أثناء جلب المعاملة',
            error: error.message
        });
    }
};



// تحديث معاملة
exports.updateTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );
        
        if (!transaction) {
            return res.status(404).json({ message: 'لم يتم العثور على المعاملة' });
        }

        res.status(200).json({ message: 'تم تحديث المعاملة بنجاح', transaction });
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(400).json({ 
            message: 'حدث خطأ أثناء تحديث المعاملة',
            error: error.message,
            ...(error.errors && { details: error.errors })
        });
    }
};

// حذف معاملة
exports.deleteTransaction = async (req, res) => {
    try {
        await Transaction.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'تم حذف المعاملة بنجاح' });
    } catch (error) {
        res.status(400).json({ message: 'حدث خطأ أثناء حذف المعاملة', error: error.message });
    }
};
// جلب إجمالي الدخل والمصروفات
exports.getTotals = async (req, res, next) => {
    const { userId } = req.query;

    if (!userId) {
        return next(new ApiError(400, 'معرف المستخدم مطلوب'));
    }

    const transactions = await Transaction.find({ userId });

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(transaction => {
        if (transaction.type === 'income') {
            totalIncome += transaction.amount;
        } else if (transaction.type === 'expense') {
            totalExpenses += transaction.amount;
        }
    });

    res.status(200).json({
        message: 'تم جلب الإجماليات بنجاح!',
        totalIncome,
        totalExpenses
    });
};

//لحذف حميع الميزانيات
// controllers/transactionController.js

exports.deleteUserTransactions = async (req, res) => {
    const { userId } = req.params; // الحصول على userId من المعلمات

    try {
        await Transaction.deleteMany({ userId }); // حذف جميع المعاملات المرتبطة بالمستخدم
        res.status(200).json({ message: 'تم حذف جميع المعاملات بنجاح' });
    } catch (error) {
        res.status(400).json({ message: 'فشل حذف المعاملات', error });
    }
};