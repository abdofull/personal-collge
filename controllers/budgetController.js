// controllers/budgetController.js
const Budget = require('../models/Budget');
const Notification = require('../models/Notification');

exports.createBudget = async (req, res) => {
    try {
        const { userId, month, year } = req.body;
        
        // التحقق من عدم وجود ميزانية لنفس الشهر والسنة
        const existingBudget = await Budget.findOne({ userId, month, year });
        if (existingBudget) {
            return res.status(400).json({ 
                message: 'يوجد ميزانية مسجلة لهذا الشهر والسنة بالفعل' 
            });
        }
        
        // حساب إجمالي المصروفات المخططة
        req.body.totalExpenses = req.body.items.reduce(
            (sum, item) => sum + item.allocatedAmount, 0
        );
        
        const budget = new Budget(req.body);
        await budget.save();
        
        res.status(201).json({ message: 'تم إنشاء الميزانية بنجاح', budget });
    } catch (error) {
        res.status(400).json({ message: 'فشل إنشاء الميزانية', error });
    }
};

exports.getBudgets = async (req, res) => {
    try {
        const budgets = await Budget.find({ userId: req.query.userId });
        res.status(200).json({ budgets });
    } catch (error) {
        res.status(400).json({ message: 'فشل جلب الميزانيات', error });
    }
};

exports.deleteBudget = async (req, res) => {
    try {
        await Budget.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'تم حذف الميزانية بنجاح' });
    } catch (error) {
        res.status(400).json({ message: 'فشل حذف الميزانية', error });
    }
};
exports.getBudgetSummary = async (req, res) => {
    try {
        const budgets = await Budget.find({ userId: req.query.userId });
        const budgetCount = budgets.length; // عدد الميزانيات
        const lastBudget = budgetCount > 0 ? budgets[budgetCount - 1] : null; // تحقق من وجود الميزانيات

        res.status(200).json({
            lastBudget: lastBudget ? lastBudget.totalIncome : 0, // إذا لم توجد ميزانيات
            budgetCount: budgetCount
        });
    } catch (error) {
        res.status(400).json({ message: 'فشل جلب ملخص الميزانية', error });
    }
};

//لحذف جميع الميزانيات
// controllers/budgetController.js

exports.deleteUserBudgets = async (req, res) => {
    const { userId } = req.params; // الحصول على userId من المعلمات

    try {
        await Budget.deleteMany({ userId }); // حذف جميع الميزانيات المرتبطة بالمستخدم
        res.status(200).json({ message: 'تم حذف جميع الميزانيات بنجاح' });
    } catch (error) {
        res.status(400).json({ message: 'فشل حذف الميزانيات', error });
    }
};

// عند تجاوز الميزانية
exports.checkBudgetExceeded = async (userId, category, amount, budget) => {
    if (amount > budget) {
        await Notification.create({
            userId,
            title: 'تجاوز الميزانية',
            message: `لقد تجاوزت الميزانية المحددة لفئة ${category}`,
            type: 'warning',
            relatedEntity: 'budget',
            entityId: budget._id
        });
    }
};


exports.getBudgetDetails = async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.id).lean();
        if (!budget) {
            return res.status(404).json({ 
                success: false,
                message: 'لم يتم العثور على الميزانية' 
            });
        }

        // جلب جميع المعاملات المرتبطة بهذه الميزانية
        const transactions = await Transaction.find({ 
            budgetId: budget._id,
            type: 'expense'
        }).lean();

        // تحديث spentAmount لكل بند
        budget.items.forEach(item => {
            item.spentAmount = transactions
                .filter(t => t.budgetItemName === item.itemName)
                .reduce((sum, t) => sum + t.amount, 0);
            
            item.remainingAmount = item.allocatedAmount - item.spentAmount;
        });

        // حساب إجمالي المصروفات الفعلي
        const actualTotalExpenses = budget.items.reduce(
            (sum, item) => sum + item.spentAmount, 0
        );

        res.status(200).json({ 
            success: true,
            message: 'تم جلب تفاصيل الميزانية بنجاح',
            budget,
            transactions,
            stats: {
                plannedTotalExpenses: budget.totalExpenses,
                actualTotalExpenses,
                difference: budget.totalExpenses - actualTotalExpenses
            }
        });

    } catch (error) {
        console.error('حدث خطأ أثناء جلب تفاصيل الميزانية:', {
            error: error.message,
            params: req.params,
            stack: error.stack
        });
        res.status(400).json({ 
            success: false,
            message: 'حدث خطأ أثناء جلب تفاصيل الميزانية',
            error: error.message
        });
    }
};

// دالة مساعدة لتحويل اسم الشهر إلى رقم
function getMonthNumber(monthName) {
    const months = {
        'يناير': 0, 'فبراير': 1, 'مارس': 2, 'أبريل': 3,
        'مايو': 4, 'يونيو': 5, 'يوليو': 6, 'أغسطس': 7,
        'سبتمبر': 8, 'أكتوبر': 9, 'نوفمبر': 10, 'ديسمبر': 11
    };
    return months[monthName] + 1; // +1 لأن الأشهر في JavaScript تبدأ من 0
}