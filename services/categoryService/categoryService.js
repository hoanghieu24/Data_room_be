const CategoryTypeModel = require('../../models/categoryTypeModel/categoryTypeModel');
const CategoryModel = require('../../models/categoryTypeModel/categoryModel');
const { CategoryTypeDTO, CategoryDTO } = require('../../dto/categoryDTO/categoryDTO');

const CategoryService = {
    // ========== CATEGORY TYPE SERVICES ==========
    
    getAllCategoryTypes: async () => {
        try {
            const categoryTypes = await CategoryTypeModel.getAll();
            return categoryTypes.map(ct => CategoryTypeDTO.fromDatabase(ct));
        } catch (error) {
            console.error('Service Error in getAllCategoryTypes:', error);
            throw new Error('Failed to get category types');
        }
    },

    getCategoryTypeById: async (id) => {
        try {
            if (isNaN(id)) {
                throw new Error('Invalid category type ID');
            }
            
            const categoryType = await CategoryTypeModel.getById(id);
            if (!categoryType) {
                throw new Error('Category type not found');
            }
            return CategoryTypeDTO.fromDatabase(categoryType);
        } catch (error) {
            console.error('Service Error in getCategoryTypeById:', error);
            throw error;
        }
    },

    createCategoryType: async (categoryTypeData) => {
        try {
            // Validate
            if (!categoryTypeData.code || !categoryTypeData.name) {
                throw new Error('Code and name are required');
            }

            // Kiểm tra mã đã tồn tại
            const existing = await CategoryTypeModel.getByCode(categoryTypeData.code);
            if (existing) {
                throw new Error('Category type code already exists');
            }

            const newCategoryType = await CategoryTypeModel.create(categoryTypeData);
            return CategoryTypeDTO.fromDatabase(newCategoryType);
        } catch (error) {
            console.error('Service Error in createCategoryType:', error);
            throw error;
        }
    },

    updateCategoryType: async (id, categoryTypeData) => {
        try {
            if (isNaN(id)) {
                throw new Error('Invalid category type ID');
            }

            const categoryType = await CategoryTypeModel.getById(id);
            if (!categoryType) {
                throw new Error('Category type not found');
            }

            const updated = await CategoryTypeModel.update(id, categoryTypeData);
            if (!updated) {
                throw new Error('Failed to update category type');
            }

            return await CategoryTypeModel.getById(id);
        } catch (error) {
            console.error('Service Error in updateCategoryType:', error);
            throw error;
        }
    },

    deleteCategoryType: async (id) => {
        try {
            if (isNaN(id)) {
                throw new Error('Invalid category type ID');
            }

            const categoryType = await CategoryTypeModel.getById(id);
            if (!categoryType) {
                throw new Error('Category type not found');
            }

            // Kiểm tra có danh mục nào thuộc loại này không
            const categories = await CategoryModel.getByType(id);
            if (categories.length > 0) {
                throw new Error('Cannot delete category type that has categories');
            }

            const deleted = await CategoryTypeModel.softDelete(id);
            if (!deleted) {
                throw new Error('Failed to delete category type');
            }

            return true;
        } catch (error) {
            console.error('Service Error in deleteCategoryType:', error);
            throw error;
        }
    },

    // ========== CATEGORY SERVICES ==========

    getAllCategories: async (page = 1, limit = 10, categoryTypeId = null) => {
        try {
            if (isNaN(page) || page < 1) page = 1;
            if (isNaN(limit) || limit < 1) limit = 10;
            
            const result = await CategoryModel.getAll(page, limit, categoryTypeId);
            
            return {
                ...result,
                data: result.data.map(cat => CategoryDTO.fromDatabase(cat))
            };
        } catch (error) {
            console.error('Service Error in getAllCategories:', error);
            throw new Error('Failed to get categories');
        }
    },

    getCategoryById: async (id) => {
        try {
            if (isNaN(id)) {
                throw new Error('Invalid category ID');
            }
            
            const category = await CategoryModel.getById(id);
            if (!category) {
                throw new Error('Category not found');
            }
            return CategoryDTO.fromDatabase(category);
        } catch (error) {
            console.error('Service Error in getCategoryById:', error);
            throw error;
        }
    },

    getCategoriesByType: async (categoryTypeId) => {
        try {
            if (isNaN(categoryTypeId)) {
                throw new Error('Invalid category type ID');
            }
            
            const categories = await CategoryModel.getByType(categoryTypeId);
            return categories.map(cat => CategoryDTO.fromDatabase(cat));
        } catch (error) {
            console.error('Service Error in getCategoriesByType:', error);
            throw new Error('Failed to get categories by type');
        }
    },

    getCategoriesByTypeCode: async (categoryTypeCode) => {
        try {
            if (!categoryTypeCode || typeof categoryTypeCode !== 'string') {
                throw new Error('Valid category type code is required');
            }
            
            const categories = await CategoryModel.getByTypeCode(categoryTypeCode);
            return categories.map(cat => CategoryDTO.fromDatabase(cat));
        } catch (error) {
            console.error('Service Error in getCategoriesByTypeCode:', error);
            throw new Error('Failed to get categories by type code');
        }
    },

    createCategory: async (categoryData) => {
        try {
            // Validate
            if (!categoryData.code || !categoryData.name || !categoryData.category_type_id) {
                throw new Error('Code, name, and category_type_id are required');
            }

            if (isNaN(categoryData.category_type_id)) {
                throw new Error('Invalid category_type_id');
            }

            // Kiểm tra loại danh mục tồn tại
            const categoryType = await CategoryTypeModel.getById(categoryData.category_type_id);
            if (!categoryType) {
                throw new Error('Category type not found');
            }

            // Kiểm tra mã đã tồn tại trong cùng loại
            const existing = await CategoryModel.getByCodeAndType(
                categoryData.code, 
                categoryData.category_type_id
            );
            if (existing) {
                throw new Error('Category code already exists for this type');
            }

            const newCategory = await CategoryModel.create(categoryData);
            return CategoryDTO.fromDatabase(newCategory);
        } catch (error) {
            console.error('Service Error in createCategory:', error);
            throw error;
        }
    },

    updateCategory: async (id, categoryData) => {
        try {
            if (isNaN(id)) {
                throw new Error('Invalid category ID');
            }

            const category = await CategoryModel.getById(id);
            if (!category) {
                throw new Error('Category not found');
            }

            const updated = await CategoryModel.update(id, categoryData);
            if (!updated) {
                throw new Error('Failed to update category');
            }

            return await CategoryModel.getById(id);
        } catch (error) {
            console.error('Service Error in updateCategory:', error);
            throw error;
        }
    },

    deleteCategory: async (id) => {
        try {
            if (isNaN(id)) {
                throw new Error('Invalid category ID');
            }

            const category = await CategoryModel.getById(id);
            if (!category) {
                throw new Error('Category not found');
            }

            // Kiểm tra danh mục có đang được sử dụng không
            const isUsed = await CategoryModel.isUsed(id);
            if (isUsed) {
                throw new Error('Cannot delete category that is in use');
            }

            const deleted = await CategoryModel.softDelete(id);
            if (!deleted) {
                throw new Error('Failed to delete category');
            }

            return true;
        } catch (error) {
            console.error('Service Error in deleteCategory:', error);
            throw error;
        }
    },

    searchCategories: async (searchTerm, categoryTypeId = null) => {
        try {
            if (!searchTerm || searchTerm.trim() === '') {
                throw new Error('Search term is required');
            }

            if (categoryTypeId !== null && isNaN(categoryTypeId)) {
                throw new Error('Invalid category type ID');
            }

            const categories = await CategoryModel.search(searchTerm, categoryTypeId);
            return categories.map(cat => CategoryDTO.fromDatabase(cat));
        } catch (error) {
            console.error('Service Error in searchCategories:', error);
            throw new Error('Failed to search categories');
        }
    },

    searchCategoryTypes: async (searchTerm) => {
        try {
            if (!searchTerm || searchTerm.trim() === '') {
                throw new Error('Search term is required');
            }

            const categoryTypes = await CategoryTypeModel.search(searchTerm);
            return categoryTypes.map(ct => CategoryTypeDTO.fromDatabase(ct));
        } catch (error) {
            console.error('Service Error in searchCategoryTypes:', error);
            throw new Error('Failed to search category types');
        }
    },

    getCategoriesGroupedByType: async () => {
        try {
            const categoryTypes = await CategoryTypeModel.getAll();
            const result = [];
            
            for (const type of categoryTypes) {
                const categories = await CategoryModel.getByType(type.id);
                result.push({
                    type: CategoryTypeDTO.fromDatabase(type),
                    categories: categories.map(cat => CategoryDTO.fromDatabase(cat))
                });
            }
            
            return result;
        } catch (error) {
            console.error('Service Error in getCategoriesGroupedByType:', error);
            throw new Error('Failed to get grouped categories');
        }
    },

    getSystemCategories: async () => {
        try {
            const importantTypes = [
                'customer_type',
                'pipeline_stage',
                'customer_status',
                'lead_source',
                'opportunity_priority'
            ];
            
            const result = [];
            
            for (const typeCode of importantTypes) {
                try {
                    const categories = await CategoryModel.getByTypeCode(typeCode);
                    result.push({
                        type_code: typeCode,
                        type_name: typeCode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        categories: categories.map(cat => CategoryDTO.fromDatabase(cat))
                    });
                } catch (typeError) {
                    console.warn(`Failed to get categories for type ${typeCode}:`, typeError);
                    // Continue with other types
                }
            }
            
            return result;
        } catch (error) {
            console.error('Service Error in getSystemCategories:', error);
            throw new Error('Failed to retrieve system categories');
        }
    }
};

module.exports = CategoryService;