const db = require("../../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserModel = require("../../models/User/userModel");
const USER_ROLE = require("../../constants/User/userRoles");
const USER_STATUS = require("../../constants/User/userStatus");

class AuthService {

    static async register(data) {
        if (!data) throw new Error("Dữ liệu không hợp lệ");

        if (await UserModel.existsByUsername(data.username))
            throw new Error("Username đã tồn tại");

        if (await UserModel.existsByEmail(data.email))
            throw new Error("Email đã tồn tại");

        if (data.phone && await UserModel.existsByPhone(data.phone))
            throw new Error("Số điện thoại đã tồn tại");

        const conn = await db.getConnection();

        try {
            const password_hash = await bcrypt.hash(data.password, 10);

            await conn.beginTransaction();

            const userId = await UserModel.create(conn, {
                username: data.username,
                email: data.email,
                full_name: data.full_name,
                phone: data.phone ?? null,
                avatar_url: data.avatar_url ?? null,
                department_id: data.department_id ?? null,
                password_hash,
                status: USER_STATUS.ACTIVE,
                created_by: null
            });

            const [roles] = await conn.query(
                "SELECT id FROM roles WHERE code = ? LIMIT 1",
                ["CUSTOMER"]
            );
            if (!roles.length) throw new Error("Role CUSTOMER không tồn tại");

            await conn.query(
                "INSERT INTO user_role (user_id, role_id) VALUES (?, ?)",
                [userId, roles[0].id]
            );

            await conn.commit();
            return userId;

        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    static async login(username, password) {
        const user = await UserModel.findAuthByUsername(username);
        if (!user) throw new Error("Sai tài khoản hoặc mật khẩu");

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) throw new Error("Sai tài khoản hoặc mật khẩu");

        const token = jwt.sign(
            {
                id: user.id,
                role_code: user.role_code
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return { token };
    }

    static async findAuthByUsername(username) {
        return await UserModel.findAuthByUsername(username);
    }
    
    static async findInternalById(userId) {
        return await UserModel.findInternalById(userId);
    }

    static async updatePassword(userId, new_password_hash) {
        return await UserModel.updatePassword(userId, new_password_hash);
    }

    static async findByEmailOrPhone(email_or_phone) {
        return await UserModel.findByEmailOrPhone(email_or_phone);
    }

    // ================== ADMIN FUNCTIONS ==================

    // Lấy danh sách user (cho admin)
    static async getUsersAdmin(filters = {}) {
        const {
            page = 1,
            limit = 10,
            search = "",
            status = "",
            role = ""
        } = filters;

        const offset = (page - 1) * limit;

        // Xây dựng query linh hoạt
        let query = `
            SELECT 
                u.id, u.username, u.email, u.full_name, u.phone, 
                u.avatar_url, u.status, u.created_at,
                r.code as role_code, r.name as role_name
            FROM users u
            LEFT JOIN user_role ur ON u.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            WHERE 1=1
        `;
        const params = [];

        // Tìm kiếm
        if (search) {
            query += ` AND (u.username LIKE ? OR u.email LIKE ? OR u.full_name LIKE ? OR u.phone LIKE ?)`;
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam, searchParam);
        }

        // Lọc theo status
        if (status) {
            query += ` AND u.status = ?`;
            params.push(status);
        }

        // Lọc theo role
        if (role) {
            query += ` AND r.code = ?`;
            params.push(role);
        }

        // Sắp xếp và phân trang
        query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const conn = await db.getConnection();
        try {
            const [users] = await conn.query(query, params);

            // Đếm tổng số bản ghi (không phân trang)
            let countQuery = `
                SELECT COUNT(*) as total
                FROM users u
                LEFT JOIN user_role ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                WHERE 1=1
            `;
            const countParams = params.slice(0, -2); // Bỏ limit và offset

            const [countResult] = await conn.query(countQuery, countParams);
            const total = countResult[0]?.total || 0;

            return { users, total };
        } finally {
            conn.release();
        }
    }

    // Lấy thông tin user theo ID (cho admin)
    static async getUserById(userId) {
        const conn = await db.getConnection();
        try {
            const [users] = await conn.query(`
                SELECT 
                    u.id, u.username, u.email, u.full_name, u.phone, 
                    u.avatar_url, u.status, u.created_at, u.department_id,
                    r.code as role_code, r.name as role_name,
                    d.name as department_name
                FROM users u
                LEFT JOIN user_role ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                LEFT JOIN departments d ON u.department_id = d.id
                WHERE u.id = ?
            `, [userId]);

            return users[0] || null;
        } finally {
            conn.release();
        }
    }

    // Tạo user mới (cho admin - có thể chỉ định role)
    static async createUserAdmin(data, adminId) {
        if (!data) throw new Error("Dữ liệu không hợp lệ");

        if (await UserModel.existsByUsername(data.username))
            throw new Error("Username đã tồn tại");

        if (await UserModel.existsByEmail(data.email))
            throw new Error("Email đã tồn tại");

        if (data.phone && await UserModel.existsByPhone(data.phone))
            throw new Error("Số điện thoại đã tồn tại");

        const conn = await db.getConnection();

        try {
            const password_hash = await bcrypt.hash(data.password, 10);

            await conn.beginTransaction();

            const userId = await UserModel.create(conn, {
                username: data.username,
                email: data.email,
                full_name: data.full_name,
                phone: data.phone ?? null,
                avatar_url: data.avatar_url ?? null,
                department_id: data.department_id ?? null,
                password_hash,
                status: data.status || USER_STATUS.ACTIVE,
                created_by: adminId // Admin tạo user
            });

            // Xác định role (mặc định là User nếu không chỉ định)
            const roleCode = data.role_code || "User";
            const [roles] = await conn.query(
                "SELECT id FROM roles WHERE code = ? LIMIT 1",
                [roleCode]
            );
            if (!roles.length) throw new Error(`Role ${roleCode} không tồn tại`);

            await conn.query(
                "INSERT INTO user_role (user_id, role_id) VALUES (?, ?)",
                [userId, roles[0].id]
            );

            await conn.commit();
            return userId;

        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    // Cập nhật user (cho admin)
    static async updateUserAdmin(userId, data) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // Cập nhật thông tin cơ bản
            const updateFields = [];
            const updateValues = [];

            if (data.full_name !== undefined) {
                updateFields.push("full_name = ?");
                updateValues.push(data.full_name);
            }
            if (data.email !== undefined) {
                // Kiểm tra email trùng
                if (await UserModel.existsByEmailExcludingUser(data.email, userId))
                    throw new Error("Email đã tồn tại");
                updateFields.push("email = ?");
                updateValues.push(data.email);
            }
            if (data.phone !== undefined) {
                if (data.phone && await UserModel.existsByPhoneExcludingUser(data.phone, userId))
                    throw new Error("Số điện thoại đã tồn tại");
                updateFields.push("phone = ?");
                updateValues.push(data.phone);
            }
            if (data.department_id !== undefined) {
                updateFields.push("department_id = ?");
                updateValues.push(data.department_id);
            }

            if (updateFields.length > 0) {
                updateValues.push(userId);
                const query = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
                await conn.query(query, updateValues);
            }

            // Cập nhật role nếu có
            if (data.role_code) {
                const [roles] = await conn.query(
                    "SELECT id FROM roles WHERE code = ? LIMIT 1",
                    [data.role_code]
                );
                if (!roles.length) throw new Error(`Role ${data.role_code} không tồn tại`);

                // Xóa role cũ
                await conn.query("DELETE FROM user_role WHERE user_id = ?", [userId]);
                // Thêm role mới
                await conn.query(
                    "INSERT INTO user_role (user_id, role_id) VALUES (?, ?)",
                    [userId, roles[0].id]
                );
            }

            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    // Thay đổi status user
    static async updateUserStatus(userId, status) {
        // Validate status
        const validStatuses = Object.values(USER_STATUS);
        if (!validStatuses.includes(status)) {
            throw new Error(`Status không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(", ")}`);
        }

        const conn = await db.getConnection();
        try {
            const [result] = await conn.query(
                "UPDATE users SET status = ? WHERE id = ?",
                [status, userId]
            );
            
            if (result.affectedRows === 0) {
                throw new Error("User không tồn tại");
            }
            
            return true;
        } finally {
            conn.release();
        }
    }

    // Xóa user (soft delete hoặc hard delete)
    static async deleteUser(userId, hardDelete = false) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            if (hardDelete) {
                // Hard delete
                await conn.query("DELETE FROM user_role WHERE user_id = ?", [userId]);
                await conn.query("DELETE FROM users WHERE id = ?", [userId]);
            } else {
                // Soft delete (cập nhật status)
                await this.updateUserStatus(userId, USER_STATUS.DELETED);
            }

            await conn.commit();
            return true;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    // Toggle user status (ACTIVE/INACTIVE)
    static async toggleUserStatus(userId) {
        const user = await UserModel.findByIdWithRole(userId);
        if (!user) throw new Error("User không tồn tại");

        const newStatus = user.status === USER_STATUS.ACTIVE 
            ? USER_STATUS.INACTIVE 
            : USER_STATUS.ACTIVE;

        const updated = await UserModel.updateStatus(userId, newStatus);
        if (!updated) throw new Error("Không thể cập nhật trạng thái");
        
        return { 
            old_status: user.status, 
            new_status: newStatus,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role_code: user.role_code
            }
        };
    }

    // Hoặc hàm thay đổi status cụ thể
    static async changeUserStatus(userId, status) {
        // Validate status
        const validStatuses = Object.values(USER_STATUS);
        if (!validStatuses.includes(status)) {
            throw new Error(`Status không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(", ")}`);
        }

        const user = await UserModel.findByIdWithRole(userId);
        if (!user) throw new Error("User không tồn tại");

        const updated = await UserModel.updateStatus(userId, status);
        if (!updated) throw new Error("Không thể cập nhật trạng thái");
        
        return { 
            old_status: user.status, 
            new_status: status,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role_code: user.role_code
            }
        };
    }
    // Thay đổi password user (admin thay đổi cho user khác)
    static async adminChangePassword(userId, newPassword) {
        const new_password_hash = await bcrypt.hash(newPassword, 10);
        return await UserModel.updatePassword(userId, new_password_hash);
    }
}

module.exports = AuthService;
