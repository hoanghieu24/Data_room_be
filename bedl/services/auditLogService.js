const db = require('../db');

/**
 * Helper lấy IP và User Agent từ request
 */
function getClientDetails(req) {
  if (!req) return { ip_address: null, user_agent: null };
  const ip =
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1';

  const cleanIp = ip.includes('::1') ? '127.0.0.1' : ip.split(',')[0].trim();
  const userAgent = req.headers['user-agent'] || null;

  return { ip_address: cleanIp, user_agent: userAgent };
}

/**
 * Ghi log hành động vào bảng audit_logs
 * Đồng thời ghi vào document_access_logs nếu có document_id để giữ tính kế thừa
 */
async function logAuditAction({
  req,
  user,
  action,
  document_id = null,
  document_title = null,
  status = 'SUCCESS',
  details = null
}) {
  try {
    const client = getClientDetails(req);
    const userId = user?.id || (req?.user?.id) || null;
    const userName = user?.fullName || user?.full_name || user?.username || req?.user?.username || 'System';

    // 1. Ghi vào bảng audit_logs chính của DMS
    await db.query(
      `INSERT INTO audit_logs (user_id, user_name, action, document_id, document_title, details, ip_address, user_agent, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        userName,
        action,
        document_id,
        document_title,
        details ? JSON.stringify(details) : null,
        client.ip_address,
        client.user_agent,
        status
      ]
    );

    // 2. Kế thừa bảng document_access_logs cũ nếu thao tác liên quan tới document
    if (document_id && userId) {
      await db.query(
        `INSERT INTO document_access_logs (document_id, user_id, action, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?)`,
        [document_id, userId, action.toLowerCase(), client.ip_address, client.user_agent]
      ).catch(() => {});
    }
  } catch (error) {
    console.error('❌ Failed to write audit log:', error.message);
  }
}

module.exports = {
  getClientDetails,
  logAuditAction
};
