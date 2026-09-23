const bcrypt = require('bcryptjs');

/**
 * Tự động chạy migration mở rộng database cho DMS
 * Đảm bảo backward compatibility 100%, không mất dữ liệu cũ
 */
async function runDmsMigration(db) {
  console.log('🚀 [DMS Migration] Checking database schema...');

  try {
    // 1. Mở rộng bảng documents với các cột DMS
    const dmsColumns = [
      { name: 'document_type_id', type: 'INT NULL' },
      { name: 'department_id', type: 'INT NULL' },
      { name: 'contract_number', type: 'VARCHAR(100) NULL' },
      { name: 'partner_name', type: 'VARCHAR(255) NULL' },
      { name: 'published_date', type: 'DATE NULL' },
      { name: 'status', type: "VARCHAR(50) DEFAULT 'ACTIVE'" },
      { name: 'security_level', type: "VARCHAR(50) DEFAULT 'INTERNAL'" }
    ];

    for (const col of dmsColumns) {
      const [exists] = await db.query(
        `SHOW COLUMNS FROM documents LIKE '${col.name}'`
      );
      if (exists.length === 0) {
        console.log(`[DMS Migration] Adding column '${col.name}' to documents...`);
        await db.query(`ALTER TABLE documents ADD COLUMN ${col.name} ${col.type}`);
      }
    }

    // Cho phép folder_id nhận NULL nếu văn bản không nằm trong folder Data Room cũ
    try {
      await db.query(`ALTER TABLE documents MODIFY COLUMN folder_id INT NULL`);
    } catch (e) {
      // Bỏ qua nếu đã cấu hình
    }

    // 2. Tạo bảng document_types (Loại tài liệu)
    await db.query(`
      CREATE TABLE IF NOT EXISTS document_types (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Seed document_types nếu chưa có
    const [typesCount] = await db.query('SELECT COUNT(*) as count FROM document_types');
    if (typesCount[0].count === 0) {
      console.log('[DMS Migration] Seeding initial document types...');
      const defaultTypes = [
        ['CONTRACT', 'Hợp đồng', 'Hợp đồng kinh tế, dịch vụ, lao động'],
        ['DECISION', 'Quyết định', 'Quyết định bổ nhiệm, ban hành, điều hành'],
        ['DISPATCH', 'Công văn', 'Công văn đi, công văn đến'],
        ['MINUTES', 'Biên bản', 'Biên bản cuộc họp, biên bản nghiệm thu'],
        ['QUOTATION', 'Báo giá', 'Báo giá sản phẩm, dịch vụ'],
        ['DOSSIER', 'Hồ sơ', 'Hồ sơ năng lực, hồ sơ thầu, hồ sơ dự án'],
        ['PROCESS', 'Quy trình', 'Quy trình tác nghiệp, ISO, hướng dẫn'],
        ['POLICY', 'Chính sách', 'Chính sách nội bộ, chế độ phúc lợi'],
        ['TECHNICAL', 'Tài liệu kỹ thuật', 'Tài liệu kiến trúc, hướng dẫn kỹ thuật'],
        ['OTHER', 'Khác', 'Các loại văn bản, tài liệu khác']
      ];
      for (const [code, name, desc] of defaultTypes) {
        await db.query(
          'INSERT IGNORE INTO document_types (code, name, description) VALUES (?, ?, ?)',
          [code, name, desc]
        );
      }
    }

    // 3. Tạo bảng document_versions (Quản lý đa phiên bản)
    await db.query(`
      CREATE TABLE IF NOT EXISTS document_versions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        document_id INT NOT NULL,
        version_number INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT,
        file_type VARCHAR(50),
        mime_type VARCHAR(100),
        change_notes TEXT,
        uploaded_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_doc_ver (document_id, version_number)
      )
    `);

    // 4. Tạo bảng document_permissions (Phân quyền User / Phòng ban)
    await db.query(`
      CREATE TABLE IF NOT EXISTS document_permissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        document_id INT NOT NULL,
        target_type VARCHAR(20) NOT NULL COMMENT 'USER hoặc DEPARTMENT',
        target_id INT NOT NULL COMMENT 'user_id hoặc department_id',
        permission_level VARCHAR(20) NOT NULL COMMENT 'VIEW, DOWNLOAD, EDIT, ADMIN',
        granted_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_doc_target (document_id, target_type, target_id),
        INDEX idx_doc_perm (document_id)
      )
    `);

    // 5. Tạo bảng audit_logs
    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NULL,
        user_name VARCHAR(150) NULL,
        action VARCHAR(50) NOT NULL COMMENT 'VIEW, DOWNLOAD, PRINT, CREATE, EDIT, DELETE, SHARE, CHANGE_PERMISSION, UPLOAD_VERSION, LOGIN',
        document_id INT NULL,
        document_title VARCHAR(255) NULL,
        details JSON NULL,
        ip_address VARCHAR(45) NULL,
        user_agent TEXT NULL,
        status VARCHAR(20) DEFAULT 'SUCCESS',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_created (created_at DESC),
        INDEX idx_audit_action (action)
      )
    `);

    // 6. Tạo bảng notifications
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NULL COMMENT 'NULL là thông báo toàn hệ thống',
        document_id INT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'EXPIRY_WARNING',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notif_user (user_id, is_read)
      )
    `);

    // 7. Seed cấu hình hệ thống
    const defaultSettings = [
      ['EXPIRY_WARNING_DAYS', '30', 'number', 'dms', 'Số ngày cảnh báo tài liệu sắp hết hạn', 1],
      ['NAMING_CONVENTION_TEMPLATE', '[DATE]_[TYPE]_[PARTNER]_[VERSION]', 'string', 'dms', 'Quy tắc đặt tên file', 1]
    ];
    for (const [key, val, type, cat, desc, isPub] of defaultSettings) {
      await db.query(
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_public)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE setting_value = setting_value`,
        [key, val, type, cat, desc, isPub]
      );
    }

    // 8. Đảm bảo các tài khoản kiểm thử chuẩn
    const adminPassHash = await bcrypt.hash('Admin@123', 10);
    const staffPassHash = await bcrypt.hash('Staff@123', 10);

    // Lấy ID các role
    const [roles] = await db.query('SELECT id, code FROM roles');
    const roleMap = {};
    roles.forEach(r => { roleMap[r.code] = r.id; });

    // Đảm bảo có role ADMIN, STAFF nếu chưa có
    let adminRoleId = roleMap['ADMIN'];
    let staffRoleId = roleMap['STAFF'];

    // Update / Insert admin@dataroom.local
    const [adminCheck] = await db.query('SELECT id FROM users WHERE email = ?', ['admin@dataroom.local']);
    let adminUserId;
    if (adminCheck.length === 0) {
      const [res] = await db.query(
        'INSERT INTO users (username, email, password_hash, full_name, is_active, status, department_id) VALUES (?, ?, ?, ?, 1, ?, 1)',
        ['admin', 'admin@dataroom.local', adminPassHash, 'System Administrator', 'ACTIVE']
      );
      adminUserId = res.insertId;
    } else {
      adminUserId = adminCheck[0].id;
      await db.query('UPDATE users SET password_hash = ?, is_active = 1, status = ? WHERE id = ?', [adminPassHash, 'ACTIVE', adminUserId]);
    }
    if (adminRoleId && adminUserId) {
      await db.query('INSERT IGNORE INTO user_role (user_id, role_id) VALUES (?, ?)', [adminUserId, adminRoleId]);
    }

    // Update / Insert staff@dataroom.local
    const [staffCheck] = await db.query('SELECT id FROM users WHERE email = ?', ['staff@dataroom.local']);
    let staffUserId;
    if (staffCheck.length === 0) {
      const [res] = await db.query(
        'INSERT INTO users (username, email, password_hash, full_name, is_active, status, department_id) VALUES (?, ?, ?, ?, 1, ?, 5)',
        ['staff', 'staff@dataroom.local', staffPassHash, 'Nhân viên Kinh Doanh', 'ACTIVE']
      );
      staffUserId = res.insertId;
    } else {
      staffUserId = staffCheck[0].id;
      await db.query('UPDATE users SET password_hash = ?, is_active = 1, status = ? WHERE id = ?', [staffPassHash, 'ACTIVE', staffUserId]);
    }
    if (staffRoleId && staffUserId) {
      await db.query('INSERT IGNORE INTO user_role (user_id, role_id) VALUES (?, ?)', [staffUserId, staffRoleId]);
    }

    // Update / Insert manager@dataroom.local
    const [managerCheck] = await db.query('SELECT id FROM users WHERE email = ?', ['manager@dataroom.local']);
    let managerUserId;
    if (managerCheck.length === 0) {
      const [res] = await db.query(
        'INSERT INTO users (username, email, password_hash, full_name, is_active, status, department_id) VALUES (?, ?, ?, ?, 1, ?, 8)',
        ['manager', 'manager@dataroom.local', staffPassHash, 'Trưởng phòng Pháp chế', 'ACTIVE']
      );
      managerUserId = res.insertId;
    } else {
      managerUserId = managerCheck[0].id;
      await db.query('UPDATE users SET password_hash = ?, is_active = 1, status = ? WHERE id = ?', [staffPassHash, 'ACTIVE', managerUserId]);
    }
    if (staffRoleId && managerUserId) {
      await db.query('INSERT IGNORE INTO user_role (user_id, role_id) VALUES (?, ?)', [managerUserId, staffRoleId]);
    }

    // Seed một số tài liệu mẫu nếu documents trống hoặc cập nhật dữ liệu tài liệu hiện tại
    const [docCheck] = await db.query('SELECT COUNT(*) as count FROM documents');
    if (docCheck[0].count > 0) {
      // Cập nhật các cột mới cho các document hiện có nếu null
      await db.query(`
        UPDATE documents 
        SET 
          document_type_id = COALESCE(document_type_id, 1),
          department_id = COALESCE(department_id, 5),
          security_level = COALESCE(security_level, 'INTERNAL'),
          status = COALESCE(status, 'ACTIVE'),
          published_date = COALESCE(published_date, CURDATE())
        WHERE document_type_id IS NULL OR status IS NULL
      `);

      // Seed version 1 cho các documents hiện có nếu chưa có trong document_versions
      const [existingDocs] = await db.query('SELECT id, file_name, file_path, file_size, file_type, mime_type, uploaded_by, version FROM documents');
      for (const d of existingDocs) {
        const [vExists] = await db.query('SELECT id FROM document_versions WHERE document_id = ? AND version_number = ?', [d.id, d.version || 1]);
        if (vExists.length === 0) {
          await db.query(`
            INSERT INTO document_versions (document_id, version_number, file_name, file_path, file_size, file_type, mime_type, change_notes, uploaded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Bản khởi tạo gốc (V1)', ?)
          `, [d.id, d.version || 1, d.file_name, d.file_path, d.file_size || 0, d.file_type || 'bin', d.mime_type || 'application/octet-stream', d.uploaded_by || 1]);
        }
      }
    }

    console.log('✅ [DMS Migration] Database schema verified & ready.');
  } catch (err) {
    console.error('❌ [DMS Migration Error]:', err.message);
  }
}

module.exports = { runDmsMigration };
