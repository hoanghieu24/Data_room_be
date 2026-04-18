const db = require("../../db");

class DocumentLogModel {
    // Ghi log hành động
    static async logAction(logData) {
        const {
            document_id,
            user_id,
            action, // CREATE, UPDATE, DELETE, DOWNLOAD, VIEW, RESTORE
            ip_address = null,
            user_agent = null,
            changes = null // Lưu thay đổi dưới dạng JSON string
        } = logData;

        const [result] = await db.query(
            `INSERT INTO document_access_logs (
                document_id, user_id, action, 
                ip_address, user_agent
            ) VALUES (?, ?, ?, ?, ?)`,
            [
                document_id, user_id, action,
                ip_address, user_agent
            ]
        );

        return result.insertId;
    }

    // Lấy lịch sử của một document
    static async getDocumentHistory(document_id, limit = 50) {
        const [rows] = await db.query(
            `SELECT l.*, 
                    u.username as user_name,
                    u.email as user_email
             FROM document_access_logs l
             LEFT JOIN users u ON l.user_id = u.id
             WHERE l.document_id = ?
             ORDER BY l.accessed_at DESC
             LIMIT ?`,
            [document_id, limit]
        );
        return rows;
    }

    // Lấy tất cả logs gần đây
    static async getRecentLogs(limit = 100) {
        const [rows] = await db.query(
            `SELECT l.*, 
                    d.name as document_name,
                    d.document_code,
                    u.username as user_name,
                    u.email as user_email
             FROM document_access_logs l
             LEFT JOIN documents d ON l.document_id = d.id
             LEFT JOIN users u ON l.user_id = u.id
             ORDER BY l.accessed_at DESC
             LIMIT ?`,
            [limit]
        );
        return rows;
    }

    // Lấy logs theo user
    static async getLogsByUser(user_id, limit = 50) {
        const [rows] = await db.query(
            `SELECT l.*, 
                    d.name as document_name,
                    d.document_code
             FROM document_access_logs l
             LEFT JOIN documents d ON l.document_id = d.id
             WHERE l.user_id = ?
             ORDER BY l.accessed_at DESC
             LIMIT ?`,
            [user_id, limit]
        );
        return rows;
    }

    // Lấy logs theo action
    static async getLogsByAction(action, limit = 100) {
        const [rows] = await db.query(
            `SELECT l.*, 
                    d.name as document_name,
                    u.username as user_name
             FROM document_access_logs l
             LEFT JOIN documents d ON l.document_id = d.id
             LEFT JOIN users u ON l.user_id = u.id
             WHERE l.action = ?
             ORDER BY l.accessed_at DESC
             LIMIT ?`,
            [action, limit]
        );
        return rows;
    }

    // Thống kê logs
    static async getLogStatistics() {
        const [stats] = await db.query(`
            SELECT 
                COUNT(*) as total_logs,
                COUNT(DISTINCT document_id) as unique_documents,
                COUNT(DISTINCT user_id) as unique_users,
                SUM(CASE WHEN action = 'DOWNLOAD' THEN 1 ELSE 0 END) as total_downloads,
                SUM(CASE WHEN action = 'VIEW' THEN 1 ELSE 0 END) as total_views,
                SUM(CASE WHEN action = 'UPDATE' THEN 1 ELSE 0 END) as total_updates,
                SUM(CASE WHEN action = 'CREATE' THEN 1 ELSE 0 END) as total_creates,
                SUM(CASE WHEN action = 'DELETE' THEN 1 ELSE 0 END) as total_deletes
            FROM document_access_logs
            WHERE accessed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `);
        return stats[0];
    }
}

module.exports = DocumentLogModel;