const express = require('express');
const router = express.Router();
const db = require('../../db');
const { optionalAuthenticate } = require('../../middlewares/authMiddleware');

router.get('/', optionalAuthenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const offset = (page - 1) * limit;

        const [rows] = await db.query(
            `SELECT l.id, l.action, l.ip_address, l.user_agent, l.accessed_at as timestamp,
                    u.username as user_name, u.email as user_email,
                    d.name as document_name, d.file_name
             FROM document_access_logs l
             LEFT JOIN users u ON u.id = l.user_id
             LEFT JOIN documents d ON d.id = l.document_id
             ORDER BY l.accessed_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const [countRow] = await db.query(`SELECT COUNT(*) as total FROM document_access_logs`);

        res.json({
            success: true,
            logs: rows.map(r => ({
                id: r.id,
                action: r.action,
                userName: r.user_name || r.user_email || 'System',
                documentName: r.document_name || r.file_name || 'N/A',
                ipAddress: r.ip_address,
                timestamp: r.timestamp
            })),
            pagination: {
                page,
                limit,
                total: countRow[0]?.total || 0,
                totalPages: Math.ceil((countRow[0]?.total || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Audit logs error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
