const express = require('express');
const router = express.Router();
const FolderModel = require('../../models/FolderModel/folderModel');
const DocumentModel = require('../../models/DocumentModel/DocumentModel');
const { authenticate, authorize, optionalAuthenticate } = require('../../middlewares/authMiddleware');

router.get('/', optionalAuthenticate, async (req, res) => {
    try {
        const deletedFolders = await FolderModel.findAllDeleted();
        const deletedDocs = await DocumentModel.findAllDeleted();

        const folders = deletedFolders.map(f => ({
            id: f.id,
            name: f.name,
            code: f.folder_code,
            deletedAt: f.updated_at,
            deletedBy: f.created_by_name || 'Admin',
            type: 'folder'
        }));

        const files = deletedDocs.map(d => ({
            id: d.id,
            name: d.name,
            fileName: d.file_name,
            size: d.file_size,
            fileType: d.file_type,
            mimeType: d.mime_type,
            deletedAt: d.deleted_at || d.updated_at,
            deletedBy: d.uploaded_by_name || 'Admin',
            type: 'file'
        }));

        res.json({
            success: true,
            folders,
            files
        });
    } catch (error) {
        console.error('Recycle bin get error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/restore', optionalAuthenticate, async (req, res) => {
    try {
        const { type, id } = req.body;
        if (type === 'folder') {
            await FolderModel.restore(id);
        } else {
            await DocumentModel.restore(id);
        }
        res.json({ success: true, message: 'Đã khôi phục thành công' });
    } catch (error) {
        console.error('Restore error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/permanent', optionalAuthenticate, async (req, res) => {
    try {
        const { type, id } = req.body;
        if (type === 'folder') {
            await FolderModel.permanentDelete(id);
        } else {
            await DocumentModel.permanentDelete(id);
        }
        res.json({ success: true, message: 'Đã xóa vĩnh viễn' });
    } catch (error) {
        console.error('Permanent delete error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/empty', optionalAuthenticate, async (req, res) => {
    try {
        await DocumentModel.emptyTrash();
        const deletedFolders = await FolderModel.findAllDeleted();
        for (const f of deletedFolders) {
            await FolderModel.permanentDelete(f.id);
        }
        res.json({ success: true, message: 'Đã dọn sạch thùng rác' });
    } catch (error) {
        console.error('Empty trash error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
