const Goal = require('../models/Goal'); // تأكد من تعديل المسار حسب هيكل مشروعك

// إنشاء هدف جديد
exports.createGoal = async (req, res) => {
    try {
        const { title, targetAmount, dueDate, description } = req.body;
        const goal = new Goal({
            userId: req.user._id, // تأكد من أن المستخدم مسجل الدخول
            title,
            targetAmount,
            dueDate,
            description
        });
        await goal.save();
        res.status(201).json(goal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// الحصول على جميع الأهداف للمستخدم
exports.getGoals = async (req, res) => {
    try {
        const goals = await Goal.find({ userId: req.user._id });
        res.status(200).json(goals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// تحديث هدف
exports.updateGoal = async (req, res) => {
    try {
        const { goalId } = req.params;
        const updatedGoal = await Goal.findByIdAndUpdate(goalId, req.body, { new: true });
        if (!updatedGoal) return res.status(404).json({ message: 'Goal not found' });
        res.status(200).json(updatedGoal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// حذف هدف
exports.deleteGoal = async (req, res) => {
    try {
        const { goalId } = req.params;
        const deletedGoal = await Goal.findByIdAndDelete(goalId);
        if (!deletedGoal) return res.status(404).json({ message: 'Goal not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};