const db = require('../db');

const PERMISSION_WEIGHTS = {
  NONE: 0,
  VIEW: 1,
  DOWNLOAD: 2,
  EDIT: 3,
  ADMIN: 4
};

/**
 * Tính toán cấp độ quyền thực tế của một user đối với tài liệu
 * @param {Object} user { id, department_id, role_code }
 * @param {Object} document { id, uploaded_by, department_id, security_level, access_level }
 * @returns {Promise<string>} 'NONE' | 'VIEW' | 'DOWNLOAD' | 'EDIT' | 'ADMIN'
 */
async function computeUserDocumentPermission(user, document) {
  if (!user) return 'NONE';

  const roleCode = (user.role_code || '').toUpperCase();
  const userId = Number(user.id);

  // 1. Quản trị viên hệ thống có toàn quyền
  if (roleCode === 'ADMIN') {
    return 'ADMIN';
  }

  // 2. Tác giả tạo tài liệu có toàn quyền
  if (document.uploaded_by && Number(document.uploaded_by) === userId) {
    return 'ADMIN';
  }

  let maxWeight = PERMISSION_WEIGHTS.NONE;

  // 3. Kiểm tra phân quyền đích danh (User & Department) trong bảng document_permissions
  const [explicitPerms] = await db.query(
    `SELECT target_type, target_id, permission_level 
     FROM document_permissions 
     WHERE document_id = ? AND (
       (target_type = 'USER' AND target_id = ?) OR 
       (target_type = 'DEPARTMENT' AND target_id = ?)
     )`,
    [document.id, userId, user.department_id || 0]
  );

  if (explicitPerms && explicitPerms.length > 0) {
    for (const p of explicitPerms) {
      const weight = PERMISSION_WEIGHTS[p.permission_level] || 0;
      if (weight > maxWeight) {
        maxWeight = weight;
      }
    }
  }

  // 4. Nếu chưa có phân quyền đích danh, áp dụng theo mức độ bảo mật (security_level)
  if (maxWeight === PERMISSION_WEIGHTS.NONE) {
    const secLevel = (document.security_level || 'INTERNAL').toUpperCase();

    if (secLevel === 'PUBLIC') {
      // Công khai: Tất cả nhân viên đều có thể xem và tải
      maxWeight = PERMISSION_WEIGHTS.DOWNLOAD;
    } else if (secLevel === 'INTERNAL') {
      // Nội bộ: Nếu cùng phòng ban thì được tải, khác phòng ban thì được xem
      if (user.department_id && document.department_id && Number(user.department_id) === Number(document.department_id)) {
        maxWeight = PERMISSION_WEIGHTS.DOWNLOAD;
      } else {
        maxWeight = PERMISSION_WEIGHTS.VIEW;
      }
    } else if (secLevel === 'CONFIDENTIAL') {
      // Mật: Chặn hoàn toàn nếu không được cấp quyền đích danh
      maxWeight = PERMISSION_WEIGHTS.NONE;
    }
  }

  // Chuyển weight về tên quyền
  for (const [key, val] of Object.entries(PERMISSION_WEIGHTS)) {
    if (val === maxWeight) return key;
  }

  return 'NONE';
}

function hasPermission(userLevel, requiredLevel) {
  const currentWeight = PERMISSION_WEIGHTS[userLevel] || 0;
  const requiredWeight = PERMISSION_WEIGHTS[requiredLevel] || 0;
  return currentWeight >= requiredWeight;
}

module.exports = {
  PERMISSION_WEIGHTS,
  computeUserDocumentPermission,
  hasPermission
};
