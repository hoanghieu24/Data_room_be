const db = require("../../db");

const CategoryType = {
    // Lấy tất cả loại danh mục
    getAll: async () => {
        try {
            const [rows] = await db.query('SELECT * FROM category_types WHERE is_active = 1 ORDER BY created_at DESC');
            return rows;
        } catch (error) {
            throw error;
        }
    },

    // Lấy loại danh mục theo ID
    getById: async (id) => {
        try {
            const [rows] = await db.query('SELECT * FROM category_types WHERE id = ? AND is_active = 1', [id]);
            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    },

    // Lấy loại danh mục theo mã
    getByCode: async (code) => {
        try {
            const [rows] = await db.query('SELECT * FROM category_types WHERE code = ? AND is_active = 1', [code]);
            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    },

    // Tạo loại danh mục mới
    create: async (categoryTypeData) => {
        try {
            const { code, name, description, is_active = 1 } = categoryTypeData;
            const [result] = await db.query(
                'INSERT INTO category_types (code, name, description, is_active) VALUES (?, ?, ?, ?)',
                [code, name, description, is_active]
            );
            return { id: result.insertId, ...categoryTypeData };
        } catch (error) {
            throw error;
        }
    },

    // Cập nhật loại danh mục
    update: async (id, categoryTypeData) => {
        try {
            const { name, description, is_active } = categoryTypeData;
            const [result] = await db.query(
                'UPDATE category_types SET name = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [name, description, is_active, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    },

    // Xóa mềm loại danh mục
    softDelete: async (id) => {
        try {
            const [result] = await db.query(
                'UPDATE category_types SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    },

    // Tìm kiếm loại danh mục
    search: async (searchTerm) => {
        try {
            const [rows] = await db.query(
                'SELECT * FROM category_types WHERE (code LIKE ? OR name LIKE ? OR description LIKE ?) AND is_active = 1 ORDER BY created_at DESC',
                [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = CategoryType;