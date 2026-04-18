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
                msg: "Thiếu trạng thái người dùng"
            });
        }

        const updated = await UserService.updateStatus(userId, status);

        if (!updated) {
            return res.status(404).json({
                msg: "User không tồn tại"
            });
        }

        return res.json({
            msg: "Cập nhật trạng thái thành công"
        });
    } catch (error) {
        console.error("updateStatus error:", error);
        return res.status(500).json({
            msg: "Lỗi server"
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

        // không cho admin tự xoá chính mình
        if (id === req.user.id) {
            return res.status(400).json({ msg: "Không thể xoá chính mình" });
        }

        const deleted = await UserService.deleteById(id);

        if (!deleted) {
            return res.status(404).json({ msg: "User không tồn tại" });
        }

        res.json({ msg: "Xoá user thành công" });
    } catch (err) {
        console.error("deleteUser error:", err);
        res.status(500).json({ msg: "Lỗi server" });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await UserService.getAllUsers();

        return res.json({
            msg: "Danh sách user",
            total: users.length,
            users
        });
    } catch (error) {
        console.error("getAllUsers error:", error);
        return res.status(500).json({
            msg: "Lỗi server"
        });
    }
};



exports.deleteMultipleUsers = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ msg: "Danh sách ID không hợp lệ" });
        }

        if (ids.includes(req.user.id)) {
            return res.status(400).json({ msg: "Không thể xoá chính mình" });
        }

        const deleted = await UserService.deleteByIds(ids);

        res.json({
            msg: "Xoá nhiều user thành công",
            deleted
        });
    } catch (err) {
        console.error("deleteMultipleUsers error:", err);
        res.status(500).json({ msg: "Lỗi server" });
    }
};


exports.updateUser = async (req, res) => {
    try {
        const id = req.params.id;
        const dto = new UserUpdateDTO(req.body);

        const updated = await UserService.updateUser(id, dto);

        if (!updated) {
            return res.status(404).json({ msg: "User không tồn tại" });
        }

        res.json({ msg: "Cập nhật user thành công" });
    } catch (err) {
        console.error("updateUser error:", err);
        res.status(500).json({ msg: "Lỗi server" });
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

