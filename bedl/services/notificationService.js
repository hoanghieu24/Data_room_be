const db = require('../db');

/**
 * Lấy cấu hình số ngày cảnh báo sắp hết hạn từ system_settings
 */
async function getExpiryWarningDays() {
  try {
    const [rows] = await db.query(
      `SELECT setting_value FROM system_settings WHERE setting_key = 'EXPIRY_WARNING_DAYS'`
    );
    if (rows.length > 0 && rows[0].setting_value) {
      return parseInt(rows[0].setting_value, 10) || 30;
    }
  } catch (e) {}
  return 30;
}

/**
 * Tự động quét và cập nhật trạng thái động của các tài liệu
 * Sinh thông báo cho các tài liệu sắp hết hạn
 */
async function scanAndNotifyExpiringDocuments() {
  try {
    const warningDays = await getExpiryWarningDays();

    // 1. Cập nhật các tài liệu quá hạn thành 'EXPIRED' nếu chưa thanh lý
    await db.query(`
      UPDATE documents 
      SET status = 'EXPIRED'
      WHERE expiry_date IS NOT NULL 
        AND expiry_date < CURDATE() 
        AND status != 'LIQUIDATED'
        AND status != 'EXPIRED'
    `);

    // 2. Cập nhật các tài liệu trong khoảng warningDays thành 'EXPIRING'
    await db.query(`
      UPDATE documents 
      SET status = 'EXPIRING'
      WHERE expiry_date IS NOT NULL 
        AND expiry_date >= CURDATE()
        AND DATEDIFF(expiry_date, CURDATE()) <= ?
        AND status != 'LIQUIDATED'
        AND status != 'EXPIRING'
    `, [warningDays]);

    // 3. Quét các tài liệu sắp hết hạn để tạo thông báo nếu chưa có thông báo gần đây
    const [expiringDocs] = await db.query(`
      SELECT d.id, d.name, d.document_code, d.partner_name, d.expiry_date, 
             DATEDIFF(d.expiry_date, CURDATE()) as days_left, d.uploaded_by
      FROM documents d
      WHERE d.expiry_date IS NOT NULL 
        AND d.expiry_date >= CURDATE()
        AND DATEDIFF(d.expiry_date, CURDATE()) <= ?
        AND d.status != 'LIQUIDATED'
    `, [warningDays]);

    for (const doc of expiringDocs) {
      // Kiểm tra xem đã có thông báo trong vòng 3 ngày qua chưa
      const [existingNotif] = await db.query(`
        SELECT id FROM notifications 
        WHERE document_id = ? AND type = 'EXPIRY_WARNING' 
          AND created_at >= DATE_SUB(NOW(), INTERVAL 3 DAY)
      `, [doc.id]);

      if (existingNotif.length === 0) {
        const title = `Tài liệu sắp hết hạn: ${doc.name}`;
        const message = `Tài liệu [${doc.document_code}] "${doc.name}" còn ${doc.days_left} ngày là hết hạn (Ngày hết hạn: ${new Date(doc.expiry_date).toLocaleDateString('vi-VN')}).`;

        await db.query(`
          INSERT INTO notifications (user_id, document_id, title, message, type)
          VALUES (?, ?, ?, ?, 'EXPIRY_WARNING')
        `, [doc.uploaded_by || null, doc.id, title, message]);
      }
    }
  } catch (error) {
    console.error('❌ Error scanning expiring documents:', error.message);
  }
}

module.exports = {
  getExpiryWarningDays,
  scanAndNotifyExpiringDocuments
};
