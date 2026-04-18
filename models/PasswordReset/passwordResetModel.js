const db = require("../../db");

class PasswordReset {
    static async create(data) {
        await db.query(
            "INSERT INTO password_resets (user_id, otp_code, expires_at) VALUES (?, ?, ?)",
            [data.user_id, data.otp_code, data.expires_at]
        );
    }

    static async findValidOtp(userId, otp) {
        const [rows] = await db.query(
            `SELECT * FROM password_resets
             WHERE user_id = ?
             AND otp_code = ?
             AND used = 0
             AND expires_at > NOW()
             ORDER BY id DESC
             LIMIT 1`,
            [userId, otp]
        );
        return rows[0];
    }

    static async markUsed(id) {
        await db.query("UPDATE password_resets SET used = 1 WHERE id = ?", [id]);
    }

    static async deleteAllByUserId(userId) {
    await db.query(
        "DELETE FROM password_resets WHERE user_id = ?",
        [userId]
    );
}


}



module.exports = PasswordReset;