const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { Readable } = require('stream');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const db = require('../../db');
const { computeUserDocumentPermission, hasPermission } = require('../../services/permissionService');
const { logAuditAction } = require('../../services/auditLogService');
const { scanAndNotifyExpiringDocuments, getExpiryWarningDays } = require('../../services/notificationService');

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dzdldby9a',
  api_key: process.env.CLOUDINARY_API_KEY || '548958782672292',
  api_secret: process.env.CLOUDINARY_API_SECRET || '_7CXnsC79ZFpFDmlOxkzwIJsMyE',
  secure: true
});

/**
 * Upload buffer lên Cloudinary với fallback lưu local
 */
async function uploadFileBuffer(buffer, originalname, mimetype) {
  try {
    const fileExt = path.extname(originalname).toLowerCase().replace('.', '') || 'bin';
    let resourceType = 'auto';
    let folder = 'dms_documents';

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
      resourceType = 'image';
      folder = 'dms_documents/images';
    } else {
      resourceType = 'raw';
      folder = 'dms_documents/files';
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          public_id: `${Date.now()}-${uuidv4().substring(0, 8)}`,
          use_filename: false
        },
        (error, res) => {
          if (error) reject(error);
          else resolve(res);
        }
      );
      Readable.from(buffer).pipe(uploadStream);
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      is_local: false
    };
  } catch (err) {
    console.warn('Cloudinary upload warning, saving to local disk:', err.message);
    const uploadDir = path.resolve(process.cwd(), 'uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const safeName = `${Date.now()}_${path.basename(originalname).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const localPath = path.join(uploadDir, safeName);
    await fsPromises.writeFile(localPath, buffer);
    return {
      url: `/uploads/documents/${safeName}`,
      local_path: localPath,
      is_local: true
    };
  }
}

/**
 * Tự sinh mã tài liệu dạng DOC-YYYY-XXXX
 */
async function generateDocCode() {
  const year = new Date().getFullYear();
  const prefix = `DOC-${year}-`;
  const [rows] = await db.query(
    `SELECT document_code FROM documents WHERE document_code LIKE ? ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextNum = 1;
  if (rows.length > 0) {
    const lastCode = rows[0].document_code;
    const parts = lastCode.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }
  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

class DmsController {
  /**
   * 1. GET /api/documents
   * Danh sách tài liệu với bộ lọc đa chiều đồng thời, phân trang, sắp xếp & phân quyền
   */
  static async getDocuments(req, res) {
    try {
      // Trigger background update of statuses
      scanAndNotifyExpiringDocuments().catch(() => {});

      const {
        search,
        q,
        tab,
        status,
        security_level,
        document_type_id,
        department_id,
        dateType, // 'published_date' hoặc 'expiry_date'
        startDate,
        endDate,
        sortBy = 'created_at',
        sortOrder = 'desc',
        page = 1,
        limit = 10
      } = req.query;

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      const offset = (pageNum - 1) * limitNum;

      const keyword = (search || q || '').trim();
      const whereConditions = ['d.deleted_at IS NULL'];
      const params = [];

      // Bộ lọc từ khóa
      if (keyword) {
        whereConditions.push(
          '(d.name LIKE ? OR d.document_code LIKE ? OR d.contract_number LIKE ? OR d.partner_name LIKE ? OR d.description LIKE ?)'
        );
        const searchPattern = `%${keyword}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      }

      // Bộ lọc theo Tab
      if (tab === 'my_docs') {
        whereConditions.push('d.uploaded_by = ?');
        params.push(req.user?.id || 0);
      } else if (tab === 'expiring') {
        const warningDays = await getExpiryWarningDays();
        whereConditions.push(
          `d.expiry_date IS NOT NULL AND d.expiry_date >= CURDATE() AND DATEDIFF(d.expiry_date, CURDATE()) <= ? AND d.status != 'LIQUIDATED'`
        );
        params.push(warningDays);
      } else if (tab === 'liquidated') {
        whereConditions.push("d.status = 'LIQUIDATED'");
      }

      // Bộ lọc Trạng thái (Hiệu lực, Sắp hết hạn, Hết hiệu lực, Đã nghiệm thu/Thanh lý)
      if (status && status !== 'ALL') {
        if (status === 'ACTIVE') {
          whereConditions.push(
            "(d.status = 'ACTIVE' AND (d.expiry_date IS NULL OR d.expiry_date >= CURDATE()))"
          );
        } else if (status === 'EXPIRING') {
          const warningDays = await getExpiryWarningDays();
          whereConditions.push(
            `d.expiry_date IS NOT NULL AND d.expiry_date >= CURDATE() AND DATEDIFF(d.expiry_date, CURDATE()) <= ? AND d.status != 'LIQUIDATED'`
          );
          params.push(warningDays);
        } else if (status === 'EXPIRED') {
          whereConditions.push(
            "(d.status = 'EXPIRED' OR (d.expiry_date IS NOT NULL AND d.expiry_date < CURDATE() AND d.status != 'LIQUIDATED'))"
          );
        } else if (status === 'LIQUIDATED') {
          whereConditions.push("d.status = 'LIQUIDATED'");
        }
      }

      // Bộ lọc Mức độ bảo mật
      if (security_level && security_level !== 'ALL') {
        whereConditions.push('d.security_level = ?');
        params.push(security_level);
      }

      // Bộ lọc Loại tài liệu
      if (document_type_id && document_type_id !== 'ALL') {
        whereConditions.push('d.document_type_id = ?');
        params.push(document_type_id);
      }

      // Bộ lọc Phòng ban
      if (department_id && department_id !== 'ALL') {
        whereConditions.push('d.department_id = ?');
        params.push(department_id);
      }

      // Bộ lọc Khoảng thời gian
      if (startDate) {
        const col = dateType === 'expiry_date' ? 'd.expiry_date' : 'd.published_date';
        whereConditions.push(`${col} >= ?`);
        params.push(startDate);
      }
      if (endDate) {
        const col = dateType === 'expiry_date' ? 'd.expiry_date' : 'd.published_date';
        whereConditions.push(`${col} <= ?`);
        params.push(endDate);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Đếm tổng số bản ghi
      const [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM documents d ${whereClause}`,
        params
      );
      const total = countResult[0]?.total || 0;

      // Danh sách cột được phép sắp xếp
      const allowedSortColumns = {
        name: 'd.name',
        document_code: 'd.document_code',
        published_date: 'd.published_date',
        expiry_date: 'd.expiry_date',
        created_at: 'd.created_at',
        status: 'd.status',
        security_level: 'd.security_level'
      };
      const orderColumn = allowedSortColumns[sortBy] || 'd.created_at';
      const orderDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      // Truy vấn dữ liệu chi tiết
      const querySql = `
        SELECT 
          d.id, d.document_code, d.name, d.description, d.file_name, d.file_path, 
          d.file_size, d.file_type, d.mime_type, d.version, d.access_level,
          d.contract_number, d.partner_name, d.published_date, d.expiry_date,
          d.status, d.security_level, d.uploaded_by, d.created_at, d.updated_at,
          dt.name as document_type_name, dt.code as document_type_code,
          dep.name as department_name, dep.code as department_code,
          u.full_name as uploader_name, u.username as uploader_username,
          DATEDIFF(d.expiry_date, CURDATE()) as days_until_expiry
        FROM documents d
        LEFT JOIN document_types dt ON dt.id = d.document_type_id
        LEFT JOIN departments dep ON dep.id = d.department_id
        LEFT JOIN users u ON u.id = d.uploaded_by
        ${whereClause}
        ORDER BY ${orderColumn} ${orderDirection}
        LIMIT ? OFFSET ?
      `;

      const [docs] = await db.query(querySql, [...params, limitNum, offset]);

      // Tính toán quyền thực tế của User đối với từng tài liệu
      const warningDays = await getExpiryWarningDays();
      const enrichedDocs = [];

      for (const doc of docs) {
        const perm = await computeUserDocumentPermission(req.user, doc);

        // Tính trạng thái hiển thị động
        let dynamicStatus = doc.status || 'ACTIVE';
        if (dynamicStatus !== 'LIQUIDATED') {
          if (doc.expiry_date) {
            const daysLeft = doc.days_until_expiry;
            if (daysLeft < 0) {
              dynamicStatus = 'EXPIRED';
            } else if (daysLeft <= warningDays) {
              dynamicStatus = 'EXPIRING';
            } else {
              dynamicStatus = 'ACTIVE';
            }
          }
        }

        enrichedDocs.push({
          id: doc.id,
          documentCode: doc.document_code,
          name: doc.name,
          description: doc.description,
          fileName: doc.file_name,
          filePath: doc.file_path,
          fileSize: doc.file_size,
          fileType: (doc.file_type || '').toLowerCase(),
          version: doc.version || 1,
          contractNumber: doc.contract_number || null,
          partnerName: doc.partner_name || null,
          publishedDate: doc.published_date,
          expiryDate: doc.expiry_date,
          daysUntilExpiry: doc.days_until_expiry !== null ? Number(doc.days_until_expiry) : null,
          status: dynamicStatus,
          securityLevel: doc.security_level || 'INTERNAL',
          documentTypeId: doc.document_type_id,
          documentTypeName: doc.document_type_name || 'Khác',
          departmentId: doc.department_id,
          departmentName: doc.department_name || 'Toàn công ty',
          uploadedBy: doc.uploaded_by,
          uploaderName: doc.uploader_name || doc.uploader_username || 'Chưa rõ',
          createdAt: doc.created_at,
          updatedAt: doc.updated_at,
          userPermission: perm,
          canView: hasPermission(perm, 'VIEW'),
          canDownload: hasPermission(perm, 'DOWNLOAD'),
          canEdit: hasPermission(perm, 'EDIT'),
          canAdmin: hasPermission(perm, 'ADMIN')
        });
      }

      return res.json({
        success: true,
        documents: enrichedDocs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error('getDocuments error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 2. POST /api/documents
   * Tạo tài liệu mới (upload file, áp dụng quy tắc đặt tên, lưu version 1, ghi log)
   */
  static async createDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Vui lòng đính kèm tệp tài liệu' });
      }

      let { originalname, buffer, mimetype, size } = req.file;
      try {
        const decoded = Buffer.from(originalname, 'latin1').toString('utf8');
        if (!decoded.includes('')) originalname = decoded;
      } catch (e) {}

      const {
        name,
        customFileName,
        document_type_id,
        department_id,
        contract_number,
        partner_name,
        published_date,
        expiry_date,
        security_level = 'INTERNAL',
        description,
        initial_permissions // JSON string hoặc Array
      } = req.body;

      const effectiveFileName = (customFileName && customFileName.trim()) ? customFileName.trim() : originalname;
      const docCode = await generateDocCode();
      const ext = path.extname(effectiveFileName).toLowerCase().replace('.', '') || 'bin';

      // Upload file
      const uploadRes = await uploadFileBuffer(buffer, effectiveFileName, mimetype);

      // Lưu document vào database
      const [insertResult] = await db.query(`
        INSERT INTO documents (
          document_code, name, description, file_name, file_path, file_size, 
          file_type, mime_type, version, document_type_id, department_id, 
          contract_number, partner_name, published_date, expiry_date, 
          status, security_level, uploaded_by, folder_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, 1)
      `, [
        docCode,
        name || path.parse(effectiveFileName).name,
        description || null,
        effectiveFileName,
        uploadRes.url,
        size,
        ext,
        mimetype,
        document_type_id ? Number(document_type_id) : 1,
        department_id ? Number(department_id) : null,
        contract_number || null,
        partner_name || null,
        published_date || new Date().toISOString().split('T')[0],
        expiry_date || null,
        security_level,
        req.user?.id || 1
      ]);

      const docId = insertResult.insertId;

      // Lưu version 1 vào document_versions
      await db.query(`
        INSERT INTO document_versions (
          document_id, version_number, file_name, file_path, file_size, 
          file_type, mime_type, change_notes, uploaded_by
        ) VALUES (?, 1, ?, ?, ?, ?, ?, 'Khởi tạo tài liệu (V1)', ?)
      `, [
        docId,
        effectiveFileName,
        uploadRes.url,
        size,
        ext,
        mimetype,
        req.user?.id || 1
      ]);

      // Lưu phân quyền ban đầu nếu có
      if (initial_permissions) {
        try {
          const perms = typeof initial_permissions === 'string' ? JSON.parse(initial_permissions) : initial_permissions;
          if (Array.isArray(perms)) {
            for (const p of perms) {
              if (p.target_type && p.target_id && p.permission_level) {
                await db.query(`
                  INSERT INTO document_permissions (document_id, target_type, target_id, permission_level, granted_by)
                  VALUES (?, ?, ?, ?, ?)
                  ON DUPLICATE KEY UPDATE permission_level = VALUES(permission_level)
                `, [docId, p.target_type, p.target_id, p.permission_level, req.user?.id || 1]);
              }
            }
          }
        } catch (e) {
          console.warn('Initial permissions parsing error:', e.message);
        }
      }

      // Ghi Audit Log CREATE
      await logAuditAction({
        req,
        action: 'CREATE',
        document_id: docId,
        document_title: name || effectiveFileName,
        details: { docCode, fileName: effectiveFileName, security_level }
      });

      return res.status(201).json({
        success: true,
        message: 'Thêm mới tài liệu thành công',
        documentId: docId,
        documentCode: docCode
      });
    } catch (error) {
      console.error('createDocument error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 3. GET /api/documents/:id
   * Chi tiết tài liệu
   */
  static async getDocumentById(req, res) {
    try {
      const { id } = req.params;
      const [rows] = await db.query(`
        SELECT d.*, 
               dt.name as document_type_name, 
               dep.name as department_name,
               u.full_name as uploader_name, u.username as uploader_username,
               DATEDIFF(d.expiry_date, CURDATE()) as days_until_expiry
        FROM documents d
        LEFT JOIN document_types dt ON dt.id = d.document_type_id
        LEFT JOIN departments dep ON dep.id = d.department_id
        LEFT JOIN users u ON u.id = d.uploaded_by
        WHERE d.id = ? AND d.deleted_at IS NULL
      `, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Tài liệu không tồn tại' });
      }

      const doc = rows[0];
      const perm = await computeUserDocumentPermission(req.user, doc);

      if (!hasPermission(perm, 'VIEW')) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền xem tài liệu này' });
      }

      // Log action VIEW
      await logAuditAction({
        req,
        action: 'VIEW',
        document_id: doc.id,
        document_title: doc.name
      });

      // Increment view_count
      await db.query('UPDATE documents SET view_count = view_count + 1 WHERE id = ?', [id]).catch(() => {});

      return res.json({
        success: true,
        document: {
          ...doc,
          userPermission: perm,
          canView: hasPermission(perm, 'VIEW'),
          canDownload: hasPermission(perm, 'DOWNLOAD'),
          canEdit: hasPermission(perm, 'EDIT'),
          canAdmin: hasPermission(perm, 'ADMIN')
        }
      });
    } catch (error) {
      console.error('getDocumentById error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 4. PUT /api/documents/:id
   * Cập nhật thông tin tài liệu
   */
  static async updateDocument(req, res) {
    try {
      const { id } = req.params;
      const [rows] = await db.query('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Tài liệu không tồn tại' });
      }

      const doc = rows[0];
      const perm = await computeUserDocumentPermission(req.user, doc);
      if (!hasPermission(perm, 'EDIT')) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa tài liệu này' });
      }

      const {
        name,
        document_type_id,
        department_id,
        contract_number,
        partner_name,
        published_date,
        expiry_date,
        status,
        security_level,
        description
      } = req.body;

      await db.query(`
        UPDATE documents SET
          name = COALESCE(?, name),
          document_type_id = COALESCE(?, document_type_id),
          department_id = ?,
          contract_number = ?,
          partner_name = ?,
          published_date = COALESCE(?, published_date),
          expiry_date = ?,
          status = COALESCE(?, status),
          security_level = COALESCE(?, security_level),
          description = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [
        name,
        document_type_id,
        department_id !== undefined ? department_id : doc.department_id,
        contract_number !== undefined ? contract_number : doc.contract_number,
        partner_name !== undefined ? partner_name : doc.partner_name,
        published_date,
        expiry_date !== undefined ? expiry_date : doc.expiry_date,
        status,
        security_level,
        description !== undefined ? description : doc.description,
        id
      ]);

      await logAuditAction({
        req,
        action: 'EDIT',
        document_id: doc.id,
        document_title: name || doc.name,
        details: { changes: req.body }
      });

      return res.json({ success: true, message: 'Cập nhật tài liệu thành công' });
    } catch (error) {
      console.error('updateDocument error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 5. DELETE /api/documents/:id
   * Xóa tài liệu
   */
  static async deleteDocument(req, res) {
    try {
      const { id } = req.params;
      const [rows] = await db.query('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Tài liệu không tồn tại' });
      }

      const doc = rows[0];
      const perm = await computeUserDocumentPermission(req.user, doc);
      if (!hasPermission(perm, 'ADMIN')) {
        return res.status(403).json({ success: false, message: 'Chỉ Admin hoặc Chủ sở hữu mới được xóa tài liệu này' });
      }

      // Soft delete
      await db.query('UPDATE documents SET deleted_at = NOW() WHERE id = ?', [id]);

      await logAuditAction({
        req,
        action: 'DELETE',
        document_id: doc.id,
        document_title: doc.name
      });

      return res.json({ success: true, message: 'Đã chuyển tài liệu vào thùng rác' });
    } catch (error) {
      console.error('deleteDocument error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 6. POST /api/documents/:id/versions
   * Upload phiên bản mới cho tài liệu (V+1)
   */
  static async uploadVersion(req, res) {
    try {
      const { id } = req.params;
      const [rows] = await db.query('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Tài liệu không tồn tại' });
      }

      const doc = rows[0];
      const perm = await computeUserDocumentPermission(req.user, doc);
      if (!hasPermission(perm, 'EDIT')) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền tải lên phiên bản mới cho tài liệu này' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Vui lòng đính kèm tệp tin phiên bản mới' });
      }

      let { originalname, buffer, mimetype, size } = req.file;
      try {
        const decoded = Buffer.from(originalname, 'latin1').toString('utf8');
        if (!decoded.includes('')) originalname = decoded;
      } catch (e) {}

      const { changeNotes, customFileName } = req.body;
      const newVersionNum = (doc.version || 1) + 1;
      const effectiveFileName = (customFileName && customFileName.trim()) ? customFileName.trim() : originalname;
      const ext = path.extname(effectiveFileName).toLowerCase().replace('.', '') || 'bin';

      const uploadRes = await uploadFileBuffer(buffer, effectiveFileName, mimetype);

      // Cập nhật tài liệu với version mới
      await db.query(`
        UPDATE documents SET 
          version = ?, 
          file_name = ?, 
          file_path = ?, 
          file_size = ?, 
          file_type = ?, 
          mime_type = ?, 
          updated_at = NOW() 
        WHERE id = ?
      `, [newVersionNum, effectiveFileName, uploadRes.url, size, ext, mimetype, id]);

      // Thêm bản ghi vào document_versions
      await db.query(`
        INSERT INTO document_versions (
          document_id, version_number, file_name, file_path, file_size, 
          file_type, mime_type, change_notes, uploaded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        newVersionNum,
        effectiveFileName,
        uploadRes.url,
        size,
        ext,
        mimetype,
        changeNotes || `Cập nhật phiên bản ${newVersionNum}`,
        req.user?.id || 1
      ]);

      await logAuditAction({
        req,
        action: 'UPLOAD_VERSION',
        document_id: doc.id,
        document_title: doc.name,
        details: { version: newVersionNum, fileName: effectiveFileName, changeNotes }
      });

      return res.status(201).json({
        success: true,
        message: `Đã cập nhật lên phiên bản V${newVersionNum}`,
        version: newVersionNum
      });
    } catch (error) {
      console.error('uploadVersion error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 7. GET /api/documents/:id/versions
   * Lấy lịch sử phiên bản của tài liệu
   */
  static async getVersions(req, res) {
    try {
      const { id } = req.params;
      const [rows] = await db.query('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Tài liệu không tồn tại' });
      }

      const doc = rows[0];
      const perm = await computeUserDocumentPermission(req.user, doc);
      if (!hasPermission(perm, 'VIEW')) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền xem thông tin tài liệu này' });
      }

      const [versions] = await db.query(`
        SELECT v.*, u.full_name as uploader_name, u.username as uploader_username
        FROM document_versions v
        LEFT JOIN users u ON u.id = v.uploaded_by
        WHERE v.document_id = ?
        ORDER BY v.version_number DESC
      `, [id]);

      return res.json({
        success: true,
        currentVersion: doc.version,
        versions: versions.map(v => ({
          id: v.id,
          versionNumber: v.version_number,
          fileName: v.file_name,
          fileSize: v.file_size,
          fileType: v.file_type,
          changeNotes: v.change_notes,
          uploadedBy: v.uploaded_by,
          uploaderName: v.uploader_name || v.uploader_username || 'Hệ thống',
          createdAt: v.created_at,
          isCurrent: v.version_number === doc.version
        }))
      });
    } catch (error) {
      console.error('getVersions error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 8. GET /api/documents/:id/permissions
   * Lấy danh sách phân quyền của tài liệu
   */
  static async getPermissions(req, res) {
    try {
      const { id } = req.params;
      const [rows] = await db.query('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Tài liệu không tồn tại' });
      }

      const doc = rows[0];
      const perm = await computeUserDocumentPermission(req.user, doc);
      if (!hasPermission(perm, 'ADMIN')) {
        return res.status(403).json({ success: false, message: 'Chỉ Admin hoặc Chủ tài liệu mới được xem danh sách phân quyền' });
      }

      const [perms] = await db.query(`
        SELECT p.*,
               CASE 
                 WHEN p.target_type = 'USER' THEN u.full_name 
                 WHEN p.target_type = 'DEPARTMENT' THEN dep.name 
               END as target_name,
               CASE 
                 WHEN p.target_type = 'USER' THEN u.email 
                 WHEN p.target_type = 'DEPARTMENT' THEN dep.code 
               END as target_sub
        FROM document_permissions p
        LEFT JOIN users u ON p.target_type = 'USER' AND u.id = p.target_id
        LEFT JOIN departments dep ON p.target_type = 'DEPARTMENT' AND dep.id = p.target_id
        WHERE p.document_id = ?
        ORDER BY p.created_at DESC
      `, [id]);

      return res.json({
        success: true,
        permissions: perms.map(p => ({
          id: p.id,
          targetType: p.target_type,
          targetId: p.target_id,
          targetName: p.target_name || `ID #${p.target_id}`,
          targetSub: p.target_sub,
          permissionLevel: p.permission_level,
          createdAt: p.created_at
        }))
      });
    } catch (error) {
      console.error('getPermissions error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 9. POST /api/documents/:id/permissions
   * Cấp / Cập nhật quyền cho User hoặc Phòng ban
   */
  static async setPermission(req, res) {
    try {
      const { id } = req.params;
      const [rows] = await db.query('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Tài liệu không tồn tại' });
      }

      const doc = rows[0];
      const perm = await computeUserDocumentPermission(req.user, doc);
      if (!hasPermission(perm, 'ADMIN')) {
        return res.status(403).json({ success: false, message: 'Chỉ Admin hoặc Chủ tài liệu mới có quyền phân quyền' });
      }

      const { target_type, target_id, permission_level } = req.body;
      if (!target_type || !target_id || !permission_level) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin phân quyền' });
      }

      if (!['USER', 'DEPARTMENT'].includes(target_type)) {
        return res.status(400).json({ success: false, message: 'target_type phải là USER hoặc DEPARTMENT' });
      }

      if (!['VIEW', 'DOWNLOAD', 'EDIT', 'ADMIN'].includes(permission_level)) {
        return res.status(400).json({ success: false, message: 'permission_level không hợp lệ' });
      }

      await db.query(`
        INSERT INTO document_permissions (document_id, target_type, target_id, permission_level, granted_by)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE permission_level = VALUES(permission_level), updated_at = NOW()
      `, [id, target_type, Number(target_id), permission_level, req.user?.id || 1]);

      await logAuditAction({
        req,
        action: 'CHANGE_PERMISSION',
        document_id: doc.id,
        document_title: doc.name,
        details: { target_type, target_id, permission_level }
      });

      return res.json({ success: true, message: 'Phân quyền thành công' });
    } catch (error) {
      console.error('setPermission error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 10. DELETE /api/documents/:id/permissions/:permissionId
   * Thu hồi quyền
   */
  static async removePermission(req, res) {
    try {
      const { id, permissionId } = req.params;
      const [rows] = await db.query('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Tài liệu không tồn tại' });
      }

      const doc = rows[0];
      const perm = await computeUserDocumentPermission(req.user, doc);
      if (!hasPermission(perm, 'ADMIN')) {
        return res.status(403).json({ success: false, message: 'Chỉ Admin hoặc Chủ tài liệu mới có quyền thu hồi quyền' });
      }

      await db.query('DELETE FROM document_permissions WHERE id = ? AND document_id = ?', [permissionId, id]);

      await logAuditAction({
        req,
        action: 'CHANGE_PERMISSION',
        document_id: doc.id,
        document_title: doc.name,
        details: { removedPermissionId: permissionId }
      });

      return res.json({ success: true, message: 'Thu hồi quyền thành công' });
    } catch (error) {
      console.error('removePermission error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 11. GET /api/documents/:id/file
   * Xem tệp tin trực tiếp (bảo mật, không bypass URL)
   */
  static async streamFile(req, res) {
    try {
      const { id } = req.params;
      const { version } = req.query;

      const [rows] = await db.query('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL', [id]);
      if (rows.length === 0) {
        return res.status(404).send('Tài liệu không tồn tại');
      }

      const doc = rows[0];
      const perm = await computeUserDocumentPermission(req.user, doc);
      if (!hasPermission(perm, 'VIEW')) {
        return res.status(403).send('Từ chối truy cập: Bạn không có quyền xem tệp này');
      }

      let filePath = doc.file_path;
      let fileName = doc.file_name;
      let mimeType = doc.mime_type || 'application/octet-stream';

      // Nếu yêu cầu version cụ thể
      if (version) {
        const [vRows] = await db.query(
          'SELECT * FROM document_versions WHERE document_id = ? AND version_number = ?',
          [id, parseInt(version, 10)]
        );
        if (vRows.length > 0) {
          filePath = vRows[0].file_path;
          fileName = vRows[0].file_name;
          mimeType = vRows[0].mime_type || mimeType;
        }
      }

      if (filePath && filePath.startsWith('http')) {
        const fetchRes = await fetch(filePath);
        if (!fetchRes.ok) {
          return res.status(fetchRes.status).send('Không thể lấy tệp từ kho lưu trữ đám mây');
        }
        const arrayBuf = await fetchRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
        return res.send(buffer);
      } else {
        const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
        if (!fs.existsSync(absPath)) {
          return res.status(404).send('Tệp không tồn tại trên ổ đĩa máy chủ');
        }
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
        return res.sendFile(absPath);
      }
    } catch (error) {
      console.error('streamFile error:', error);
      return res.status(500).send('Lỗi khi mở tệp tin');
    }
  }

  /**
   * 12. GET /api/documents/:id/download
   * Tải về tệp tin (Kiểm tra quyền DOWNLOAD, ghi log)
   */
  static async downloadFile(req, res) {
    try {
      const { id } = req.params;
      const { version } = req.query;

      const [rows] = await db.query('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Tài liệu không tồn tại' });
      }

      const doc = rows[0];
      const perm = await computeUserDocumentPermission(req.user, doc);
      if (!hasPermission(perm, 'DOWNLOAD')) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền tải về tài liệu này' });
      }

      let filePath = doc.file_path;
      let fileName = doc.file_name;
      let mimeType = doc.mime_type || 'application/octet-stream';

      if (version) {
        const [vRows] = await db.query(
          'SELECT * FROM document_versions WHERE document_id = ? AND version_number = ?',
          [id, parseInt(version, 10)]
        );
        if (vRows.length > 0) {
          filePath = vRows[0].file_path;
          fileName = vRows[0].file_name;
          mimeType = vRows[0].mime_type || mimeType;
        }
      }

      // Tăng download_count
      await db.query('UPDATE documents SET download_count = download_count + 1 WHERE id = ?', [id]).catch(() => {});

      // Log DOWNLOAD
      await logAuditAction({
        req,
        action: 'DOWNLOAD',
        document_id: doc.id,
        document_title: doc.name,
        details: { fileName, version: version || doc.version }
      });

      if (filePath && filePath.startsWith('http')) {
        const fetchRes = await fetch(filePath);
        if (!fetchRes.ok) {
          return res.status(fetchRes.status).send('Không thể tải tệp từ kho đám mây');
        }
        const arrayBuf = await fetchRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        return res.send(buffer);
      } else {
        const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
        if (!fs.existsSync(absPath)) {
          return res.status(404).send('Tệp không tồn tại trên ổ đĩa máy chủ');
        }
        return res.download(absPath, fileName);
      }
    } catch (error) {
      console.error('downloadFile error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 13. POST /api/documents/:id/print
   * Ghi nhận hành động in ấn
   */
  static async logPrint(req, res) {
    try {
      const { id } = req.params;
      const [rows] = await db.query('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Tài liệu không tồn tại' });
      }

      const doc = rows[0];
      const perm = await computeUserDocumentPermission(req.user, doc);
      if (!hasPermission(perm, 'DOWNLOAD')) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền in tài liệu này' });
      }

      await logAuditAction({
        req,
        action: 'PRINT',
        document_id: doc.id,
        document_title: doc.name
      });

      return res.json({ success: true, message: 'Đã ghi nhận lệnh in tài liệu' });
    } catch (error) {
      console.error('logPrint error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 14. GET /api/documents/dashboard-stats
   * Thống kê tổng hợp số lượng theo 5 trạng thái, 5-10 tài liệu sắp hết hạn gần nhất, và hoạt động gần đây
   */
  static async getDashboardStats(req, res) {
    try {
      const warningDays = await getExpiryWarningDays();

      // Đếm theo các trạng thái
      const [allDocs] = await db.query(`
        SELECT id, status, expiry_date,
               DATEDIFF(expiry_date, CURDATE()) as days_left
        FROM documents 
        WHERE deleted_at IS NULL
      `);

      let total = allDocs.length;
      let activeCount = 0;
      let expiringCount = 0;
      let expiredCount = 0;
      let liquidatedCount = 0;

      for (const d of allDocs) {
        if (d.status === 'LIQUIDATED') {
          liquidatedCount++;
        } else if (d.expiry_date) {
          const daysLeft = d.days_left;
          if (daysLeft < 0) {
            expiredCount++;
          } else if (daysLeft <= warningDays) {
            expiringCount++;
          } else {
            activeCount++;
          }
        } else {
          activeCount++;
        }
      }

      // 5-10 tài liệu sắp hết hạn gần nhất
      const [expiringList] = await db.query(`
        SELECT d.id, d.name, d.document_code, d.partner_name, d.expiry_date,
               DATEDIFF(d.expiry_date, CURDATE()) as days_left,
               u.full_name as person_in_charge, u.username as uploader_username
        FROM documents d
        LEFT JOIN users u ON u.id = d.uploaded_by
        WHERE d.deleted_at IS NULL 
          AND d.expiry_date IS NOT NULL 
          AND d.expiry_date >= CURDATE()
          AND DATEDIFF(d.expiry_date, CURDATE()) <= ?
          AND d.status != 'LIQUIDATED'
        ORDER BY d.expiry_date ASC
        LIMIT 10
      `, [warningDays]);

      // Hoạt động gần đây từ audit_logs
      const [recentActivities] = await db.query(`
        SELECT id, user_name, action, document_id, document_title, created_at, status
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT 10
      `);

      return res.json({
        success: true,
        stats: {
          total,
          active: activeCount,
          expiring: expiringCount,
          expired: expiredCount,
          liquidated: liquidatedCount,
          warningDays
        },
        expiringDocuments: expiringList.map(item => ({
          id: item.id,
          name: item.name,
          documentCode: item.document_code,
          partnerName: item.partner_name || 'N/A',
          expiryDate: item.expiry_date,
          daysLeft: item.days_left !== null ? Number(item.days_left) : 0,
          personInCharge: item.person_in_charge || item.uploader_username || 'Chưa rõ'
        })),
        recentActivities: recentActivities.map(act => ({
          id: act.id,
          userName: act.user_name || 'Hệ thống',
          action: act.action,
          documentId: act.document_id,
          documentTitle: act.document_title,
          status: act.status,
          createdAt: act.created_at
        }))
      });
    } catch (error) {
      console.error('getDashboardStats error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = DmsController;
