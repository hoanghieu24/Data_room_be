const folderServices = require('../../services/Folder/folderServices');
const db = require('../../db');

class FolderController {
    static async getAllFolders(req, res) {
        try {
            const folders = await folderServices.getAllFolders();
            res.status(200).json({
                success: true,
                total: folders?.length || 0,
                data: folders || []
            });
        } catch (error) {
            console.error('getAllFolders error:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    static async getTree(req, res) {
        try {
            const userRole = req.user?.role_code || 'ADMIN';
            const userId = req.user?.id || null;
            const tree = await folderServices.getFolderTree(userRole, userId);
            res.status(200).json({
                success: true,
                tree
            });
        } catch (error) {
            console.error('getTree error:', error);
            res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
        }
    }

    static async getDashboard(req, res) {
        try {
            const data = await folderServices.getFolderDashboard();
            res.status(200).json(data);
        } catch (error) {
            console.error('getDashboard error:', error);
            res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
        }
    }

    static async getContents(req, res) {
        try {
            const folderId = req.params.id ? Number(req.params.id) : null;
            const userRole = req.user?.role_code || 'ADMIN';
            const userId = req.user?.id || null;
            const { search, sortBy, sortOrder } = req.query;

            const result = await folderServices.getFolderContents(
                folderId,
                { search, sortBy, sortOrder },
                userRole,
                userId
            );
            res.status(200).json(result);
        } catch (error) {
            console.error('getContents error:', error);
            const status = error.status || 500;
            res.status(status).json({ success: false, message: error.message || 'Internal Server Error' });
        }
    }

    static async getImpact(req, res) {
        try {
            const folderId = Number(req.params.id);
            const impact = await folderServices.getImpact(folderId);
            res.status(200).json({
                success: true,
                impact
            });
        } catch (error) {
            console.error('getImpact error:', error);
            const status = error.status || 500;
            res.status(status).json({ success: false, message: error.message || 'Internal Server Error' });
        }
    }

    static async createFolder(req, res) {
        try {
            const userId = req.user?.id || 1;
            const folder = await folderServices.createFolder(req.body, userId);
            res.status(201).json({
                success: true,
                message: 'Tạo thư mục thành công',
                folder
            });
        } catch (error) {
            console.error('createFolder error:', error);
            const status = error.status || 500;
            res.status(status).json({ success: false, message: error.message || 'Internal Server Error' });
        }
    }

    static async renameFolder(req, res) {
        try {
            const folderId = Number(req.params.id);
            const { name } = req.body;
            const folder = await folderServices.renameFolder(folderId, name);
            res.status(200).json({
                success: true,
                message: 'Đổi tên thư mục thành công',
                folder
            });
        } catch (error) {
            console.error('renameFolder error:', error);
            const status = error.status || 500;
            res.status(status).json({ success: false, message: error.message || 'Internal Server Error' });
        }
    }

    static async moveFolder(req, res) {
        try {
            const folderId = Number(req.params.id);
            const { targetParentId } = req.body;
            const folder = await folderServices.moveFolder(folderId, targetParentId);
            res.status(200).json({
                success: true,
                message: 'Di chuyển thư mục thành công',
                folder
            });
        } catch (error) {
            console.error('moveFolder error:', error);
            const status = error.status || 500;
            res.status(status).json({ success: false, message: error.message || 'Internal Server Error' });
        }
    }

    static async deleteFolder(req, res) {
        try {
            const folderId = Number(req.params.id);
            await folderServices.softDeleteFolder(folderId);
            res.status(200).json({
                success: true,
                message: 'Đã chuyển thư mục vào thùng rác'
            });
        } catch (error) {
            console.error('deleteFolder error:', error);
            const status = error.status || 500;
            res.status(status).json({ success: false, message: error.message || 'Internal Server Error' });
        }
    }

    static async getFullOverview(req, res) {
        try {
            const [folders] = await db.query(
                'SELECT id, name, folder_code, parent_id, path, description, created_at, updated_at FROM folders WHERE is_active = 1 ORDER BY parent_id ASC, name ASC'
            );
            const [documents] = await db.query(
                `SELECT d.id, d.name, d.file_name, d.file_type, d.file_size, d.folder_id, d.file_path, d.is_encrypted, d.access_password_hash, d.created_at, d.updated_at, u.username as uploader_name
                 FROM documents d
                 LEFT JOIN users u ON u.id = d.uploaded_by
                 WHERE d.is_active = 1 ORDER BY d.name ASC`
            );

            // Group files by folder_id
            const filesByFolder = {};
            const unclassifiedFiles = [];

            for (const doc of documents) {
                const item = {
                    id: doc.id,
                    name: doc.name || doc.file_name,
                    fileName: doc.file_name,
                    type: doc.file_type || (doc.file_name ? doc.file_name.split('.').pop() : 'file'),
                    extension: doc.file_type || (doc.file_name ? doc.file_name.split('.').pop() : 'file'),
                    size: doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : '0 KB',
                    bytes: doc.file_size || 0,
                    url: doc.file_path,
                    previewUrl: `/api/files/${doc.id}/raw`,
                    downloadUrl: `/api/files/${doc.id}/download`,
                    isEncrypted: !!doc.is_encrypted || !!doc.access_password_hash,
                    date: doc.created_at ? new Date(doc.created_at).toLocaleDateString('vi-VN') : '',
                    uploader: doc.uploader_name || 'Hệ thống'
                };

                if (!doc.folder_id || doc.folder_id === 1) {
                    unclassifiedFiles.push(item);
                } else {
                    if (!filesByFolder[doc.folder_id]) {
                        filesByFolder[doc.folder_id] = [];
                    }
                    filesByFolder[doc.folder_id].push(item);
                }
            }

            // Build hierarchical tree
            const folderMap = {};
            folders.forEach(f => {
                folderMap[f.id] = {
                    id: f.id,
                    name: f.name,
                    code: f.folder_code,
                    parentId: f.parent_id,
                    description: f.description,
                    subfolders: [],
                    files: filesByFolder[f.id] || []
                };
            });

            const rootSubfolders = [];
            folders.forEach(f => {
                if (f.id === 1) return;
                if (f.parent_id && f.parent_id !== 1 && folderMap[f.parent_id]) {
                    folderMap[f.parent_id].subfolders.push(folderMap[f.id]);
                } else {
                    rootSubfolders.push(folderMap[f.id]);
                }
            });

            const rootFolderNode = folderMap[1] || {
                id: 1,
                name: 'Data Room (Thư mục gốc)',
                subfolders: rootSubfolders,
                files: []
            };
            rootFolderNode.subfolders = rootSubfolders;

            return res.json({
                success: true,
                root: rootFolderNode,
                allFolders: folders,
                unclassifiedFiles: unclassifiedFiles
            });
        } catch (error) {
            console.error('getFullOverview error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = FolderController;
