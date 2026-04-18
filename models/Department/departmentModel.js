const db = require("../../db");

const DepartmentModel = {
    getAll: async (page = 1, limit = 20) => {
        try {
            const offset = (page - 1) * limit;
            const [rows] = await db.query(
                'SELECT * FROM departments WHERE is_active = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?',
                [limit, offset]
            );

            const [countRows] = await db.query(
                'SELECT COUNT(*) as total FROM departments WHERE is_active = 1'
            );

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

    getById: async (id) => {
        try {
            const [rows] = await db.query(
                'SELECT * FROM departments WHERE id = ? AND is_active = 1',
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    },

    getByCode: async (code) => {
        try {
            const [rows] = await db.query(
                'SELECT * FROM departments WHERE code = ? AND is_active = 1',
                [code]
            );
            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    },

    create: async (departmentData) => {
        try {
            const { code, name, description, is_active = 1 } = departmentData;
            const [result] = await db.query(
                'INSERT INTO departments (code, name, description, is_active) VALUES (?, ?, ?, ?)',
                [code, name, description, is_active]
            );
            return { id: result.insertId, ...departmentData };
        } catch (error) {
            throw error;
        }
    },

    update: async (id, departmentData) => {
        try {
            const fields = [];
            const values = [];

            if (departmentData.code !== undefined) {
                fields.push('code = ?');
                values.push(departmentData.code);
            }
            if (departmentData.name !== undefined) {
                fields.push('name = ?');
                values.push(departmentData.name);
            }
            if (departmentData.description !== undefined) {
                fields.push('description = ?');
                values.push(departmentData.description);
            }
            if (departmentData.is_active !== undefined) {
                fields.push('is_active = ?');
                values.push(departmentData.is_active);
            }

            if (fields.length === 0) {
                return false;
            }

            const query = `UPDATE departments SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            values.push(id);

            const [result] = await db.query(query, values);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    },

    softDelete: async (id) => {
        try {
            const [result] = await db.query(
                'UPDATE departments SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    },

    search: async (searchTerm) => {
        try {
            const term = `%${searchTerm}%`;
            const [rows] = await db.query(
                'SELECT * FROM departments WHERE (code LIKE ? OR name LIKE ? OR description LIKE ?) AND is_active = 1 ORDER BY created_at DESC',
                [term, term, term]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = DepartmentModel;
