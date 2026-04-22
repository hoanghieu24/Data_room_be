const db = require("../../db");
const dto = require("../../dto/User/userUpdateDto");
const dtocreate = require("../../dto/User/userCreateDto");

class UserModel {

    static async findAuthByUsername(username) {
        const [rows] = await db.query(
            `
            SELECT 
                u.id, u.username, u.password_hash, u.email,
                u.status, r.code AS role_code
            FROM users u
            JOIN user_role ur ON ur.user_id = u.id
            JOIN roles r ON r.id = ur.role_id
            WHERE u.username = ? AND u.status = 'ACTIVE'
            `,
            [username]
        );
        return rows[0];
    }

    static async findByEmailOrPhone(email, phone) {
        const [rows] = await db.query(
            `
            SELECT 
                u.id, u.username, u.password_hash, u.email,
                u.status, r.code AS role_code
            FROM users u
            JOIN user_role ur ON ur.user_id = u.id
            JOIN roles r ON r.id = ur.role_id
            WHERE (u.email = ? OR u.phone = ?) AND u.status = 'ACTIVE'
            `,
            [email, phone]
        );
        return rows[0];
    }

    static async create(conn,dtocreate) {
        const [result] = await conn.query(
            `
            INSERT INTO users 
            (username, password_hash, email, full_name, phone, avatar_url, department_id, created_by, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                dtocreate.username,
                dtocreate.password_hash,
                dtocreate.email,
                dtocreate.full_name,
                dtocreate.phone || null,
                dtocreate.avatar_url || null,
                dtocreate.department_id || null,
                dtocreate.created_by || null,
                dtocreate.status
            ]
        );
        return result.insertId;
    }



    static async existsByUsername(username) {
        const [rows] = await db.query(
            "SELECT 1 FROM users WHERE username = ? LIMIT 1",
            [username]
        );
        return rows.length > 0;
    }

    static async existsByEmail(email) {
        const [rows] = await db.query(
            "SELECT 1 FROM users WHERE email = ? LIMIT 1",
            [email]
        );
        return rows.length > 0;
    }

    static async existsByPhone(phone) {
        const [rows] = await db.query(
            "SELECT 1 FROM users WHERE phone = ? LIMIT 1",
            [phone]
        );
        return rows.length > 0;
    }


    static async findPublicById(id) {
        const [rows] = await db.query(
            `
            SELECT 
                u.id, u.username, u.email, u.full_name,
                r.code AS role_code, r.name AS role_name
            FROM users u
            JOIN user_role ur ON ur.user_id = u.id
            JOIN roles r ON r.id = ur.role_id
            WHERE u.id = ?
            `,
            [id]
        );
        return rows[0];
    }

    static async findAdminById(id) {
        const [rows] = await db.query(
            `
            SELECT 
                id, username, email, full_name, phone,
                avatar_url, department_id,
                status, last_login,
                created_at, updated_at
            FROM users
            WHERE id = ?
            `,
            [id]
        );
        return rows[0];
    }


    static async updatePassword(userId, passwordHash) {
        const [result] = await db.query(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            [passwordHash, userId]
        );
        return result.affectedRows > 0;
    }

    static async updateStatus(userId, status) {
        const [result] = await db.query(
            "UPDATE users SET status = ? WHERE id = ?",
            [status, userId]
        );
        return result.affectedRows > 0;
    }

    static async deleteById(id) {
        const [result] = await db.query(
            "UPDATE users SET is_active = ? WHERE id = ?",
            [0, id]
        );
        return result.affectedRows > 0;
    }



    static async deleteByIds(ids = []) {
        if (!Array.isArray(ids) || ids.length === 0) return 0;

        const [result] = await db.query(
            "UPDATE users SET is_active = ? WHERE id IN (?)",
            [0, ids]
        );

        return result.affectedRows;
    }

    static async findById(id) {
        const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
        return rows[0];
    }



   static async updateUser(id, dto) {
    const [result] = await db.query(
        `
        UPDATE users
        SET
            full_name = ?,
            phone = ?,
            avatar_url = ?,
            department_id = ?,
            is_active = ?
        WHERE id = ?
        `,
        [
            dto.full_name,
            dto.phone,
            dto.avatar_url,
            dto.department_id,
            dto.is_active,
            id
        ]
    );

    return result.affectedRows > 0;
}

        return result.affectedRows > 0;
    }

    static async findAll() {
        const [rows] = await db.query(
            `
        SELECT 
            u.id,
            u.username,
            u.email,
            u.full_name,
            u.phone,
            u.is_active,
            u.status,
            r.code AS role_code,
            r.name AS role_name,
            u.last_login,
            u.created_by,
            u.created_at
        FROM users u
        JOIN user_role ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        ORDER BY u.created_at DESC
        `
        );
        return rows;
    }
    static async updateProfile(id, { full_name, phone, avatar_url }) {
        const fields = [];
        const values = [];

        if (full_name) {
            fields.push("full_name = ?");
            values.push(full_name);
        }

        if (phone) {
            fields.push("phone = ?");
            values.push(phone);
        }

        if (avatar_url) {
            fields.push("avatar_url = ?");
            values.push(avatar_url);
        }

        values.push(id);

        const [result] = await db.query(
            `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
            values
        );

        return result.affectedRows > 0;
    }

     static async findByIdWithRole(userId) {
        const conn = await db.getConnection();
        try {
            const [rows] = await conn.query(`
                SELECT 
                    u.*,
                    r.code as role_code,
                    r.name as role_name
                FROM users u
                LEFT JOIN user_role ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                WHERE u.id = ?
                LIMIT 1
            `, [userId]);
            
            return rows[0] || null;
        } finally {
            conn.release();
        }
    }

    // Cập nhật status của user
    static async updateStatus(userId, status) {
        const conn = await db.getConnection();
        try {
            const [result] = await conn.query(
                "UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?",
                [status, userId]
            );
            
            return result.affectedRows > 0;
        } finally {
            conn.release();
        }
    }

    // Kiểm tra email trừ user hiện tại
    static async existsByEmailExcludingUser(email, excludeUserId) {
        const conn = await db.getConnection();
        try {
            const [rows] = await conn.query(
                "SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1",
                [email, excludeUserId]
            );
            return rows.length > 0;
        } finally {
            conn.release();
        }
    }

    // Kiểm tra phone trừ user hiện tại
    static async existsByPhoneExcludingUser(phone, excludeUserId) {
        if (!phone) return false;
        const conn = await db.getConnection();
        try {
            const [rows] = await conn.query(
                "SELECT id FROM users WHERE phone = ? AND id != ? LIMIT 1",
                [phone, excludeUserId]
            );
            return rows.length > 0;
        } finally {
            conn.release();
        }
    }

}






module.exports = UserModel;
