const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserService = require("../../services/User/usersService");
const UserUpdateDTO = require("../../dto/User/userUpdateDto");

exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const userId = req.params.id;

        if (!status) {
            return res.status(400).json({
                success: false,
                msg: "Thiếu trạng thái người dùng"
            });
        }

        const isActive = status === 'ACTIVE' ? 1 : 0;
        await require("../../db").query(
            "UPDATE users SET status = ?, is_active = ? WHERE id = ?",
            [status, isActive, userId]
        );

        return res.json({
            success: true,
            msg: "Cập nhật trạng thái thành công"
        });
    } catch (error) {
        console.error("updateStatus error:", error);
        return res.status(500).json({
            success: false,
            msg: "Lỗi server: " + error.message
        });
    }
};


exports.profile = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await UserService.findPublicById(userId);

        if (!user) {
            return res.status(404).json({
                msg: "User không tồn tại"
            });
        }

        return res.json({
            msg: "Thông tin profile",
            user
        });
    } catch (error) {
        console.error("profile error:", error);
        return res.status(500).json({
            msg: "Lỗi server"
        });
    }
};


exports.profileAdmin = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await UserService.findAdminProfileById(userId);

        if (!user) {
            return res.status(404).json({
                msg: "User không tồn tại"
            });
        }

        return res.json({
            msg: "Thông tin profile admin",
            user
        });
    } catch (error) {
        console.error("profileAdmin error:", error);
        return res.status(500).json({
            msg: "Lỗi server"
        });
    }
};



exports.authMiddleware = (roles = []) => (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ msg: "Chưa đăng nhập hoặc định dạng token sai" });
    }
    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        if (roles.length && !roles.includes(decoded.role_code)) {
            return res.status(403).json({ msg: "Không có quyền truy cập" });
        }

        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") return res.status(401).json({ msg: "Token đã hết hạn" });
        return res.status(401).json({ msg: "Token không hợp lệ" });
    }
};


exports.deleteUser = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (id === req.user?.id) {
            return res.status(400).json({ success: false, msg: "Không thể xoá chính mình" });
        }

        const deleted = await UserService.deleteById(id);

        if (!deleted) {
            return res.status(404).json({ success: false, msg: "User không tồn tại" });
        }

        res.json({ success: true, msg: "Xoá user thành công" });
    } catch (err) {
        console.error("deleteUser error:", err);
        res.status(500).json({ success: false, msg: "Lỗi server" });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await UserService.getAllUsers();

        return res.json({
            success: true,
            msg: "Danh sách user",
            total: users.length,
            users
        });
    } catch (error) {
        console.error("getAllUsers error:", error);
        return res.status(500).json({
            success: false,
            msg: "Lỗi server"
        });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { username, email, password, full_name, phone, role_code } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ success: false, msg: "Vui lòng điền đầy đủ username, email và mật khẩu" });
        }

        const db = require("../../db");
        // Check exists
        const [existing] = await db.query(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            [username, email]
        );
        if (existing.length > 0) {
            return res.status(400).json({ success: false, msg: "Username hoặc Email đã tồn tại" });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            `INSERT INTO users (username, email, password_hash, full_name, phone, status, is_active, created_by)
             VALUES (?, ?, ?, ?, ?, 'ACTIVE', 1, ?)`,
            [username, email, password_hash, full_name || username, phone || null, req.user?.id || 1]
        );

        const newUserId = result.insertId;
        const role = (role_code || 'STAFF').toUpperCase();
        const [roles] = await db.query("SELECT id FROM roles WHERE code = ? LIMIT 1", [role]);
        const roleId = roles[0] ? roles[0].id : 2;
        await db.query("INSERT IGNORE INTO user_role (user_id, role_id) VALUES (?, ?)", [newUserId, roleId]);

        return res.status(201).json({
            success: true,
            msg: "Tạo người dùng thành công",
            userId: newUserId
        });
    } catch (err) {
        console.error("createUser error:", err);
        return res.status(500).json({ success: false, msg: err.message });
    }
};

exports.deleteMultipleUsers = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, msg: "Danh sách ID không hợp lệ" });
        }

        if (ids.includes(req.user?.id)) {
            return res.status(400).json({ success: false, msg: "Không thể xoá chính mình" });
        }

        const deleted = await UserService.deleteByIds(ids);

        res.json({
            success: true,
            msg: "Xoá nhiều user thành công",
            deleted
        });
    } catch (err) {
        console.error("deleteMultipleUsers error:", err);
        res.status(500).json({ success: false, msg: "Lỗi server" });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const id = req.params.id;
        const { full_name, phone, email, role_code } = req.body;
        const db = require("../../db");

        const updateFields = [];
        const params = [];
        if (full_name !== undefined) { updateFields.push("full_name = ?"); params.push(full_name); }
        if (phone !== undefined) { updateFields.push("phone = ?"); params.push(phone); }
        if (email !== undefined) { updateFields.push("email = ?"); params.push(email); }

        if (updateFields.length > 0) {
            params.push(id);
            await db.query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, params);
        }

        if (role_code) {
            const [roles] = await db.query("SELECT id FROM roles WHERE code = ? LIMIT 1", [role_code.toUpperCase()]);
            if (roles[0]) {
                await db.query("DELETE FROM user_role WHERE user_id = ?", [id]);
                await db.query("INSERT INTO user_role (user_id, role_id) VALUES (?, ?)", [id, roles[0].id]);
            }
        }

        res.json({ success: true, msg: "Cập nhật user thành công" });
    } catch (err) {
        console.error("updateUser error:", err);
        res.status(500).json({ success: false, msg: "Lỗi server" });
    }
};


exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id; // lấy từ token
        const { full_name, phone, avatar_url } = req.body;

        if (!full_name && !phone && !avatar_url) {
            return res.status(400).json({ msg: "Không có dữ liệu để cập nhật" });
        }

        const updated = await UserService.updateProfile(userId, {
            full_name,
            phone,
            avatar_url
        });

        if (!updated) {
            return res.status(400).json({ msg: "Cập nhật thất bại" });
        }

        res.json({ msg: "Cập nhật profile thành công" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

