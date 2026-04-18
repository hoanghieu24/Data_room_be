const express = require('express');
const router = express.Router();
const CategoryController = require("../../controllers/Category/CategoryController");

// ========== CATEGORY TYPE ROUTES ==========

// Search phải để TRƯỚC :id
router.get('/types/search', CategoryController.searchCategoryTypes);

// Lấy tất cả loại danh mục
router.get('/types', CategoryController.getAllCategoryTypes);

// Lấy loại danh mục theo ID
router.get('/types/:id', CategoryController.getCategoryTypeById);

// Tạo loại danh mục mới
router.post('/types', CategoryController.createCategoryType);

// Cập nhật loại danh mục
router.put('/types/:id', CategoryController.updateCategoryType);

// Xóa loại danh mục
router.delete('/types/:id', CategoryController.deleteCategoryType);


// ========== CATEGORY ROUTES ==========

// Các route đặc biệt PHẢI ĐỂ TRƯỚC
router.get('/search', CategoryController.searchCategories);
router.get('/type/:typeId', CategoryController.getCategoriesByType);
router.get('/type-code/:typeCode', CategoryController.getCategoriesByTypeCode);
router.get('/grouped/by-type', CategoryController.getCategoriesGroupedByType);
router.get('/system/categories', CategoryController.getSystemCategories);

// Lấy tất cả danh mục (phân trang)
router.get('/', CategoryController.getAllCategories);

// ⚠️ LUÔN ĐỂ CUỐI
router.get('/:id', CategoryController.getCategoryById);

// Tạo danh mục mới
router.post('/', CategoryController.createCategory);

// Cập nhật danh mục
router.put('/:id', CategoryController.updateCategory);

// Xóa danh mục
router.delete('/:id', CategoryController.deleteCategory);

module.exports = router;
