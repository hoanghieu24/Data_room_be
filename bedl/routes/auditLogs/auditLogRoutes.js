const express = require('express');
const router = express.Router();
const db = require('../../db');
const { authenticate } = require('../../middlewares/authMiddleware');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const offset = (page - 1) * limit;

    const { action, search, startDate, endDate } = req.query;
    const whereConditions = [];
    const params = [];

    // Lọc theo Action
    if (action && action !== 'ALL') {
      whereConditions.push('a.action = ?');
      params.push(action);
    }

    // Lọc theo từ khóa (User, Document Title, IP)
    if (search && search.trim()) {
      whereConditions.push('(a.user_name LIKE ? OR a.document_title LIKE ? OR a.ip_address LIKE ?)');
      const p = `%${search.trim()}%`;
      params.push(p, p, p);
    }

    // Lọc theo khoảng thời gian
    if (startDate) {
      whereConditions.push('a.created_at >= ?');
      params.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      whereConditions.push('a.created_at <= ?');
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Đếm tổng số log
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM audit_logs a ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    // Lấy danh sách log
    const [rows] = await db.query(
      `SELECT a.id, a.user_id, a.user_name, a.action, a.document_id, a.document_title,
              a.ip_address, a.user_agent, a.status, a.details, a.created_at as timestamp
       FROM audit_logs a
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      logs: rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        userName: r.user_name || 'Hệ thống',
        action: r.action,
        documentId: r.document_id,
        documentName: r.document_title || 'N/A',
        ipAddress: r.ip_address || '127.0.0.1',
        userAgent: r.user_agent,
        status: r.status,
        details: r.details ? (typeof r.details === 'string' ? JSON.parse(r.details) : r.details) : null,
        timestamp: r.timestamp
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
