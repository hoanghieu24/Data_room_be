const CategoryService = require('../../services/categoryService/categoryService');
// Helper function để parse ID an toàn
const parseId = (id) => {
    const parsed = parseInt(id);
    if (isNaN(parsed)) {
        throw new Error('Invalid ID format');
    }
    return parsed;
};

const CategoryController = {
    // ========== CATEGORY TYPE CONTROLLERS ==========
    
    getAllCategoryTypes: async (req, res) => {
  try {
    const categoryTypes = await CategoryService.getAllCategoryTypes();

    res.set('Cache-Control', 'no-store');
    res.json({
      success: true,
      message: 'Category types retrieved successfully',
      data: categoryTypes
    });
  } catch (error) {
    console.error('Error in getAllCategoryTypes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve category types'
    });
  }
},

    getCategoryTypeById: async (req, res) => {
        try {
            const id = parseId(req.params.id);
            const categoryType = await CategoryService.getCategoryTypeById(id);
            res.json({
                success: true,
                message: 'Category type retrieved successfully',
                data: categoryType
            });
        } catch (error) {
            console.error('Error in getCategoryTypeById:', error);
            const status = error.message.includes('Invalid ID') ? 400 : 
                          error.message.includes('not found') ? 404 : 500;
            res.status(status).json({
                success: false,
                message: error.message.includes('Invalid ID') ? 'Invalid ID format' : error.message
            });
        }
    },

    createCategoryType: async (req, res) => {
        try {
            const categoryTypeData = {
                code: req.body.code?.trim(),
                name: req.body.name?.trim(),
                description: req.body.description?.trim(),
                is_active: req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : 1
            };

            // Validate required fields
            if (!categoryTypeData.code || !categoryTypeData.name) {
                return res.status(400).json({
                    success: false,
                    message: 'Code and name are required'
                });
            }

            const newCategoryType = await CategoryService.createCategoryType(categoryTypeData);
            res.status(201).json({
                success: true,
                message: 'Category type created successfully',
                data: newCategoryType
            });
        } catch (error) {
            console.error('Error in createCategoryType:', error);
            const status = error.message.includes('already exists') ? 409 : 500;
            res.status(status).json({
                success: false,
                message: error.message
            });
        }
    },

    updateCategoryType: async (req, res) => {
        try {
            const id = parseId(req.params.id);
            const updateData = {
                name: req.body.name?.trim(),
                description: req.body.description?.trim(),
                is_active: req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : undefined
            };

            // Remove undefined values
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No data to update'
                });
            }

            const updatedCategoryType = await CategoryService.updateCategoryType(id, updateData);
            res.json({
                success: true,
                message: 'Category type updated successfully',
                data: updatedCategoryType
            });
        } catch (error) {
            console.error('Error in updateCategoryType:', error);
            const status = error.message.includes('Invalid ID') ? 400 : 
                          error.message.includes('not found') ? 404 : 500;
            res.status(status).json({
                success: false,
                message: error.message.includes('Invalid ID') ? 'Invalid ID format' : error.message
            });
        }
    },

    deleteCategoryType: async (req, res) => {
        try {
            const id = parseId(req.params.id);
            await CategoryService.deleteCategoryType(id);
            res.json({
                success: true,
                message: 'Category type deleted successfully'
            });
        } catch (error) {
            console.error('Error in deleteCategoryType:', error);
            const status = error.message.includes('Invalid ID') ? 400 : 
                          error.message.includes('not found') ? 404 : 
                          error.message.includes('has categories') ? 400 : 500;
            res.status(status).json({
                success: false,
                message: error.message.includes('Invalid ID') ? 'Invalid ID format' : error.message
            });
        }
    },

    // ========== CATEGORY CONTROLLERS ==========

    getAllCategories: async (req, res) => {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
            
            let categoryTypeId = null;
            if (req.query.category_type_id) {
                const parsed = parseInt(req.query.category_type_id);
                if (!isNaN(parsed)) {
                    categoryTypeId = parsed;
                }
            }
            
            const result = await CategoryService.getAllCategories(page, limit, categoryTypeId);
            res.json({
                success: true,
                message: 'Categories retrieved successfully',
                data: result
            });
        } catch (error) {
            console.error('Error in getAllCategories:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve categories'
            });
        }
    },

    getCategoryById: async (req, res) => {
        try {
            const id = parseId(req.params.id);
            const category = await CategoryService.getCategoryById(id);
            res.json({
                success: true,
                message: 'Category retrieved successfully',
                data: category
            });
        } catch (error) {
            console.error('Error in getCategoryById:', error);
            const status = error.message.includes('Invalid ID') ? 400 : 
                          error.message.includes('not found') ? 404 : 500;
            res.status(status).json({
                success: false,
                message: error.message.includes('Invalid ID') ? 'Invalid ID format' : error.message
            });
        }
    },

    getCategoriesByType: async (req, res) => {
        try {
            const typeId = parseId(req.params.typeId);
            const categories = await CategoryService.getCategoriesByType(typeId);
            res.json({
                success: true,
                message: 'Categories retrieved successfully',
                data: categories
            });
        } catch (error) {
            console.error('Error in getCategoriesByType:', error);
            const status = error.message.includes('Invalid ID') ? 400 : 500;
            res.status(status).json({
                success: false,
                message: error.message.includes('Invalid ID') ? 'Invalid ID format' : error.message
            });
        }
    },

    getCategoriesByTypeCode: async (req, res) => {
        try {
            const { typeCode } = req.params;
            if (!typeCode || typeof typeCode !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Type code is required'
                });
            }
            
            const categories = await CategoryService.getCategoriesByTypeCode(typeCode);
            res.json({
                success: true,
                message: 'Categories retrieved successfully',
                data: categories
            });
        } catch (error) {
            console.error('Error in getCategoriesByTypeCode:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    createCategory: async (req, res) => {
        try {
            const categoryData = {
                code: req.body.code?.trim(),
                name: req.body.name?.trim(),
                category_type_id: parseInt(req.body.category_type_id),
                is_active: req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : 1
            };

            // Validate required fields
            if (!categoryData.code || !categoryData.name || isNaN(categoryData.category_type_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Code, name, and valid category_type_id are required'
                });
            }

            const newCategory = await CategoryService.createCategory(categoryData);
            res.status(201).json({
                success: true,
                message: 'Category created successfully',
                data: newCategory
            });
        } catch (error) {
            console.error('Error in createCategory:', error);
            const status = error.message.includes('not found') ? 404 : 
                          error.message.includes('already exists') ? 409 : 500;
            res.status(status).json({
                success: false,
                message: error.message
            });
        }
    },

    updateCategory: async (req, res) => {
        try {
            const id = parseId(req.params.id);
            const updateData = {
                name: req.body.name?.trim(),
                is_active: req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : undefined
            };

            // Remove undefined values
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No data to update'
                });
            }

            const updatedCategory = await CategoryService.updateCategory(id, updateData);
            res.json({
                success: true,
                message: 'Category updated successfully',
                data: updatedCategory
            });
        } catch (error) {
            console.error('Error in updateCategory:', error);
            const status = error.message.includes('Invalid ID') ? 400 : 
                          error.message.includes('not found') ? 404 : 500;
            res.status(status).json({
                success: false,
                message: error.message.includes('Invalid ID') ? 'Invalid ID format' : error.message
            });
        }
    },

    deleteCategory: async (req, res) => {
        try {
            const id = parseId(req.params.id);
            await CategoryService.deleteCategory(id);
            res.json({
                success: true,
                message: 'Category deleted successfully'
            });
        } catch (error) {
            console.error('Error in deleteCategory:', error);
            const status = error.message.includes('Invalid ID') ? 400 : 
                          error.message.includes('not found') ? 404 : 
                          error.message.includes('in use') ? 400 : 500;
            res.status(status).json({
                success: false,
                message: error.message.includes('Invalid ID') ? 'Invalid ID format' : error.message
            });
        }
    },

    searchCategories: async (req, res) => {
        try {
            const { q } = req.query;
            if (!q || q.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
            }

            let categoryTypeId = null;
            if (req.query.category_type_id) {
                const parsed = parseInt(req.query.category_type_id);
                if (!isNaN(parsed)) {
                    categoryTypeId = parsed;
                }
            }

            const categories = await CategoryService.searchCategories(q.trim(), categoryTypeId);
            res.json({
                success: true,
                message: 'Search completed successfully',
                data: categories
            });
        } catch (error) {
            console.error('Error in searchCategories:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search categories'
            });
        }
    },

    searchCategoryTypes: async (req, res) => {
        try {
            const { q } = req.query;
            if (!q || q.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
            }

            const categoryTypes = await CategoryService.searchCategoryTypes(q.trim());
            res.json({
                success: true,
                message: 'Search completed successfully',
                data: categoryTypes
            });
        } catch (error) {
            console.error('Error in searchCategoryTypes:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search category types'
            });
        }
    },

    getCategoriesGroupedByType: async (req, res) => {
        try {
            const groupedCategories = await CategoryService.getCategoriesGroupedByType();
            res.json({
                success: true,
                message: 'Categories grouped by type retrieved successfully',
                data: groupedCategories
            });
        } catch (error) {
            console.error('Error in getCategoriesGroupedByType:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve grouped categories'
            });
        }
    },

    getSystemCategories: async (req, res) => {
        try {
            const result = await CategoryService.getSystemCategories();
            res.json({
                success: true,
                message: 'System categories retrieved successfully',
                data: result
            });
        } catch (error) {
            console.error('Error in getSystemCategories:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve system categories'
            });
        }
    }
};

module.exports = CategoryController;