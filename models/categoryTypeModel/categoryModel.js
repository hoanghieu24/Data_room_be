const db = require("../../db");

const Category = {
    // Lấy tất cả danh mục (có phân trang)
    getAll: async (page = 1, limit = 20, categoryTypeId = null) => {
        try {
            const offset = (page - 1) * limit;
            let query = 'SELECT c.*, ct.name as category_type_name FROM categories c LEFT JOIN category_types ct ON c.category_type_id = ct.id WHERE c.is_active = 1';
            let params = [];
            
            if (categoryTypeId) {
                query += ' AND c.category_type_id = ?';
                params.push(categoryTypeId);
            }
            
            query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);
            
            const [rows] = await db.query(query, params);
            
            // Lấy tổng số bản ghi
            let countQuery = 'SELECT COUNT(*) as total FROM categories c WHERE c.is_active = 1';
            if (categoryTypeId) {
                countQuery += ' AND c.category_type_id = ?';
            }
            const [countRows] = await db.query(countQuery, categoryTypeId ? [categoryTypeId] : []);
            
            return {
                data: rows,
                total: countRows[0].total,
                page,
                limit,
                totalPages: Math.ceil(countRows[0].total / limit)
            };
        } catch (error) {
            throw error;
        }
    },

    // Lấy danh mục theo ID
    getById: async (id) => {
        try {
            const [rows] = await db.query(
                'SELECT c.*, ct.name as category_type_name FROM categories c LEFT JOIN category_types ct ON c.category_type_id = ct.id WHERE c.id = ? AND c.is_active = 1',
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    },

    // Lấy danh mục theo mã và loại
    getByCodeAndType: async (code, categoryTypeId) => {
        try {
            const [rows] = await db.query(
                'SELECT * FROM categories WHERE code = ? AND category_type_id = ? AND is_active = 1',
                [code, categoryTypeId]
            );
            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    },

    // Lấy danh mục theo loại
    getByType: async (categoryTypeId) => {
        try {
            const [rows] = await db.query(
                'SELECT * FROM categories WHERE category_type_id = ? AND is_active = 1 ORDER BY created_at DESC',
                [categoryTypeId]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    },

    // Lấy danh mục theo mã loại
    getByTypeCode: async (categoryTypeCode) => {
        try {
            const [rows] = await db.query(
                `SELECT c.* FROM categories c 
                JOIN category_types ct ON c.category_type_id = ct.id 
                WHERE ct.code = ? AND c.is_active = 1 AND ct.is_active = 1 
                ORDER BY c.created_at DESC`,
                [categoryTypeCode]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    },

    // Tạo danh mục mới
    create: async (categoryData) => {
        try {
            const { code, name, category_type_id, is_active = 1 } = categoryData;
            const [result] = await db.query(
                'INSERT INTO categories (code, name, category_type_id, is_active) VALUES (?, ?, ?, ?)',
                [code, name, category_type_id, is_active]
            );
            return { id: result.insertId, ...categoryData };
        } catch (error) {
            throw error;
        }
    },

    // Cập nhật danh mục
    update: async (id, categoryData) => {
    try {
        let fields = [];
        let values = [];

        if (categoryData.code !== undefined) {
            fields.push("code = ?");
            values.push(categoryData.code);
        }

        if (categoryData.name !== undefined) {
            fields.push("name = ?");
            values.push(categoryData.name);
        }

        if (categoryData.category_type_id !== undefined) {
            fields.push("category_type_id = ?");
            values.push(categoryData.category_type_id);
        }

        if (categoryData.is_active !== undefined) {
            fields.push("is_active = ?");
            values.push(categoryData.is_active);
        }

        if (fields.length === 0) return false;

        const query = `
            UPDATE categories 
            SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        values.push(id);

        const [result] = await db.query(query, values);

        return result.affectedRows > 0;
    } catch (error) {
        throw error;
    }
},

    // Xóa mềm danh mục
    softDelete: async (id) => {
        try {
            const [result] = await db.query(
                'UPDATE categories SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    },

    // Tìm kiếm danh mục
    search: async (searchTerm, categoryTypeId = null) => {
        try {
            let query = 'SELECT c.*, ct.name as category_type_name FROM categories c LEFT JOIN category_types ct ON c.category_type_id = ct.id WHERE (c.code LIKE ? OR c.name LIKE ?) AND c.is_active = 1';
            let params = [`%${searchTerm}%`, `%${searchTerm}%`];
            
            if (categoryTypeId) {
                query += ' AND c.category_type_id = ?';
                params.push(categoryTypeId);
            }
            
            query += ' ORDER BY c.created_at DESC';
            
            const [rows] = await db.query(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    },

    // Kiểm tra danh mục có đang được sử dụng không
    isUsed: async (id) => {
        try {
            // Kiểm tra trong customers
            const [customerRows] = await db.query('SELECT COUNT(*) as count FROM customers WHERE customer_type_id = ? OR status_id = ? OR source_id = ?', [id, id, id]);
            
            // Kiểm tra trong opportunities
            const [opportunityRows] = await db.query('SELECT COUNT(*) as count FROM opportunities WHERE stage_id = ?', [id]);
            
            // Kiểm tra trong tasks
            const [taskRows] = await db.query('SELECT COUNT(*) as count FROM tasks WHERE task_type_id = ? OR priority_id = ? OR status_id = ?', [id, id, id]);
            
            // Kiểm tra trong contracts
            const [contractRows] = await db.query('SELECT COUNT(*) as count FROM contracts WHERE status_id = ?', [id]);
            
            const total = 
                parseInt(customerRows[0].count) + 
                parseInt(opportunityRows[0].count) + 
                parseInt(taskRows[0].count) + 
                parseInt(contractRows[0].count);
            
            return total > 0;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Category;