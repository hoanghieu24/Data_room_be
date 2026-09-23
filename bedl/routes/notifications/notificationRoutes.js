const express = require('express');
const router = express.Router();
const db = require('../../db');
const { authenticate } = require('../../middlewares/authMiddleware');
const { scanAndNotifyExpiringDocuments } = require('../../services/notificationService');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    // Kích hoạt quét tài liệu sắp hết hạn
    scanAndNotifyExpiringDocuments().catch(() => {});

    const userId = req.user?.id;

    const [rows] = await db.query(
      `SELECT n.id, n.title, n.message, n.type, n.document_id, n.is_read, n.created_at,
              d.name as document_name, d.document_code
       FROM notifications n
       LEFT JOIN documents d ON d.id = n.document_id
       WHERE n.user_id IS NULL OR n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId || 0]
    );

    const [unreadRows] = await db.query(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE (user_id IS NULL OR user_id = ?) AND is_read = 0`,
      [userId || 0]
    );

    res.json({
      success: true,
      notifications: rows.map(r => ({
        id: r.id,
        title: r.title,
        message: r.message,
        type: r.type,
        documentId: r.document_id,
        documentName: r.document_name,
        documentCode: r.document_code,
        isRead: !!r.is_read,
        created_at: r.created_at
      })),
      unreadCount: unreadRows[0]?.count || 0
    });
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/read', async (req, res) => {
  try {
    const { id } = req.body;
    if (id) {
      await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    }
    res.json({ success: true, message: 'Đã đánh dấu là đã đọc' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user?.id;
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id IS NULL OR user_id = ?',
      [userId || 0]
    );
    res.json({ success: true, message: 'Đã đánh dấu tất cả là đã đọc' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
