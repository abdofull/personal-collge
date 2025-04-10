// categoryRoutes.js

const express = require('express');
const {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categorycontrolr'); // تأكد من المسار الصحيح

const router = express.Router();

// تعريف مسارات الفئات
router.get('/', getCategories); // استرجاع جميع الفئات
router.post('/', createCategory); // إضافة فئة جديدة
router.put('/:id', updateCategory); // تحديث فئة
router.delete('/:id', deleteCategory); // حذف فئة

module.exports = router;