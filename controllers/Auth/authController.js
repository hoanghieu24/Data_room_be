const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/user/userModel");
const AuthService = require("../../services/Auth/authService");
const PasswordReset = require("../../models/PasswordReset/passwordResetModel");



// Đăng ký người dùng mới
exports.register = async (req, res) => {
    try {
        const userId = await AuthService.register(req.body);

        return res.status(201).json({
            msg: "Đăng ký thành công",
            userId
        });
    } catch (err) {
        console.error("register error:", err.message);

        return res.status(400).json({
            msg: err.message || "Đăng ký thất bại"
        });
    }
};





// Đăng nhập người dùng
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username) return res.status(400).json({ msg: "Thiếu username" });
        if (!password) return res.status(400).json({ msg: "Thiếu password" });

        const user = await AuthService.findAuthByUsername(username);
        if (!user) return res.status(400).json({ msg: "Không tìm thấy user hoặc user đã bị vô hiệu hoá " });

        if (!user.password_hash)
            return res.status(500).json({ msg: "Password chưa được lưu trong DB" });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ msg: "Password không đúng" });

        const token = jwt.sign({ id: user.id, username: user.username, role_code: user.role_code }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({
            msg: "Đăng nhập thành công",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                status: user.status,
                role_code: user.role_code
            }
        });
        console.log("REQ BODY:", req.body);


    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};


// kiểm tra token và xác thực người dùng
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



// thay đổi mật khẩu
exports.changePassword = async (req, res) => {
    try {


        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword) return res.status(400).json({ msg: "Thiếu mật khẩu cũ" });
        if (!newPassword) return res.status(400).json({ msg: "Thiếu mật khẩu mới" });

        const user = await AuthService.findInternalById(userId);
        if (!user) return res.status(400).json({ msg: "User không tồn tại" });

        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) return res.status(400).json({ msg: "Mật khẩu cũ không đúng" });

        const new_password_hash = await bcrypt.hash(newPassword, 10);
        await AuthService.updatePassword(userId, new_password_hash);

        res.json({ msg: "Đổi mật khẩu thành công" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email_or_phone } = req.body;

    const user = await AuthService.findByEmailOrPhone(email_or_phone);
    if (!user) return res.status(404).json({ msg: "User không tồn tại" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    await PasswordReset.create({
        user_id: user.id,
        otp_code: otp,
        expires_at: expiresAt
    });

    // TODO: gửi email hoặc SMS
    console.log("OTP:", otp);

    res.json({ msg: "Đã gửi mã xác nhận" });
};


exports.verifyOtp = async (req, res) => {
    try {
        const { email_or_phone, otp } = req.body;

        const user = await AuthService.findByEmailOrPhone(email_or_phone);
        if (!user) {
            return res.status(404).json({ msg: "User không tồn tại" });
        }

        const record = await PasswordReset.findValidOtp(user.id, otp);
        if (!record) {
            return res.status(400).json({ msg: "OTP không hợp lệ hoặc đã hết hạn" });
        }

        // 🔥 Đánh dấu OTP đã dùng
        await PasswordReset.deleteAllByUserId(user.id);


        // 🔐 Tạo reset token (JWT sống ngắn)
        const resetToken = jwt.sign(
            {
                userId: user.id,
                type: "RESET_PASSWORD"
            },
            process.env.JWT_SECRET,
            { expiresIn: "10h" }
        );

        return res.json({
            msg: "OTP hợp lệ",
            reset_token: resetToken
        });

    } catch (err) {
        console.error("verifyOtp error:", err);
        return res.status(500).json({ msg: "Lỗi server" });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ msg: "Thiếu reset token" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== "RESET_PASSWORD") {
            return res.status(403).json({ msg: "Token không hợp lệ" });
        }

        const { newPassword } = req.body;
        const hash = await bcrypt.hash(newPassword, 10);

        await AuthService.updatePassword(decoded.userId, hash);

        return res.json({ msg: "Đặt lại mật khẩu thành công" });

    } catch (err) {
        console.log("JWT VERIFY ERROR:", err.name, err.message);
        return res.status(401).json({ msg: "Token hết hạn hoặc không hợp ệ" });
    }

};

// Toggle trạng thái user (ACTIVE/INACTIVE)
exports.toggleUserStatus = async (req, res) => {
    try {


        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ msg: "Thiếu userId" });
        }

        // Không cho phép tự toggle status của chính mình
        if (req.user.id.toString() === userId.toString()) {
            return res.status(400).json({ msg: "Không thể thay đổi trạng thái của chính mình" });
        }

        const result = await AuthService.toggleUserStatus(userId);

        res.json({ 
            msg: "Thay đổi trạng thái thành công",
            old_status: result.old_status,
            new_status: result.new_status,
            user: result.user
        });

    } catch (err) {
        console.error("toggleUserStatus error:", err.message);
        
        if (err.message.includes("không tồn tại")) {
            return res.status(404).json({ msg: err.message });
        }
        
        res.status(500).json({ msg: err.message || "Lỗi server" });
    }
};





