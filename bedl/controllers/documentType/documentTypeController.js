const db = require('../../db');

class DocumentTypeController {
  static async getAll(req, res) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM document_types ORDER BY is_active DESC, name ASC'
      );
      return res.json({ success: true, types: rows });
    } catch (error) {
      console.error('getAll documentTypes error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { code, name, description } = req.body;
      if (!code || !name) {
        return res.status(400).json({ success: false, message: 'Mã và tên loại tài liệu là bắt buộc' });
      }

      const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_');

      const [existing] = await db.query('SELECT id FROM document_types WHERE code = ?', [cleanCode]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'Mã loại tài liệu đã tồn tại' });
      }

      const [result] = await db.query(
        'INSERT INTO document_types (code, name, description, is_active) VALUES (?, ?, ?, 1)',
        [cleanCode, name.trim(), description || null]
      );

      return res.status(201).json({
        success: true,
        message: 'Thêm mới loại tài liệu thành công',
        typeId: result.insertId
      });
    } catch (error) {
      console.error('create documentType error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description, is_active } = req.body;

      await db.query(
        'UPDATE document_types SET name = COALESCE(?, name), description = ?, is_active = COALESCE(?, is_active), updated_at = NOW() WHERE id = ?',
        [name ? name.trim() : null, description !== undefined ? description : null, is_active, id]
      );

      return res.json({ success: true, message: 'Cập nhật loại tài liệu thành công' });
    } catch (error) {
      console.error('update documentType error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;

      // Kiểm tra có tài liệu nào đang dùng loại này không
      const [used] = await db.query('SELECT COUNT(*) as count FROM documents WHERE document_type_id = ?', [id]);
      if (used[0].count > 0) {
        // Vô hiệu hóa thay vì xóa cứng
        await db.query('UPDATE document_types SET is_active = 0 WHERE id = ?', [id]);
        return res.json({ success: true, message: `Loại tài liệu đang có ${used[0].count} tài liệu liên kết, đã chuyển sang trạng thái ngưng áp dụng.` });
      }

      await db.query('DELETE FROM document_types WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Xóa loại tài liệu thành công' });
    } catch (error) {
      console.error('delete documentType error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = DocumentTypeController;
