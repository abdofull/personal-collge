// categoryController.js

const Category = require('../models/Category'); // تأكد من المسار الصحيح

// دالة لاسترجاع جميع الفئات
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// دالة لإضافة فئة جديدة
const createCategory = async (req, res) => {
    const { name, type } = req.body;
    const category = new Category({ name, type });

    try {
        await category.save();
        res.status(201).json(category);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// دالة لتحديث فئة
const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, type } = req.body;

    try {
        const updatedCategory = await Category.findByIdAndUpdate(id, { name, type }, { new: true });
        res.json(updatedCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// دالة لحذف فئة
const deleteCategory = async (req, res) => {
    const { id } = req.params;

    try {
        await Category.findByIdAndDelete(id);
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
};