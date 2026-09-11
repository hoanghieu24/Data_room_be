const Folder = require('../../models/FolderModel/folderModel');
const db = require('../../db');

class FolderServices {
    static async getAllFolders() {
        return await Folder.findAll();
    }

    static async getFolderTree(userRole = 'ADMIN', userId = null) {
        return await Folder.buildTree(userRole, userId);
    }

    static async getFolderContents(folderId = null, options = {}, userRole = 'ADMIN', userId = null) {
        let currentFolder = null;
        let breadcrumbs = [{ id: null, name: 'Data Room' }];

        if (folderId) {
            currentFolder = await Folder.findById(folderId);
            if (!currentFolder || !currentFolder.is_active) {
                const err = new Error('Thư mục không tồn tại');
                err.status = 404;
                throw err;
            }

            if (!Folder.canAccessFolder(currentFolder, userRole, userId)) {
                const err = new Error('Bạn không có quyền truy cập thư mục này');
                err.status = 403;
                throw err;
            }

            // Build breadcrumbs
            const crumbs = [];
            let curr = currentFolder;
            while (curr) {
                crumbs.unshift({ id: curr.id, name: curr.name });
                if (curr.parent_id) {
                    curr = await Folder.findById(curr.parent_id);
                } else {
                    curr = null;
                }
            }
            breadcrumbs = [{ id: null, name: 'Data Room' }, ...crumbs];
        }

        // Subfolders query
        let folderQuery = `SELECT * FROM folders WHERE is_active = 1 AND `;
        const folderParams = [];
        if (folderId) {
            folderQuery += `parent_id = ?`;
            folderParams.push(folderId);
        } else {
            folderQuery += `parent_id IS NULL`;
        }

        if (options.search) {
            folderQuery += ` AND name LIKE ?`;
            folderParams.push(`%${options.search}%`);
        }

        folderQuery += ` ORDER BY name ASC`;
        const [rawFolders] = await db.query(folderQuery, folderParams);

        // Filter subfolders by access permission
        const folders = rawFolders.filter(f => Folder.canAccessFolder(f, userRole, userId)).map(f => ({
            id: f.id,
            name: f.name,
            code: f.folder_code,
            parentId: f.parent_id,
            path: f.path,
            accessLevel: f.access_level,
            allowedRoles: typeof f.allowed_roles === 'string' ? JSON.parse(f.allowed_roles) : f.allowed_roles,
            allowedUsers: typeof f.allowed_users === 'string' ? JSON.parse(f.allowed_users) : f.allowed_users,
            createdAt: f.created_at,
            updatedAt: f.updated_at
        }));

        // Documents query
        let docQuery = `
            SELECT d.*, u.username as uploaded_by_username, u.full_name as uploaded_by_name
            FROM documents d
            LEFT JOIN users u ON u.id = d.uploaded_by
            WHERE d.is_active = 1 AND `;
        const docParams = [];
        if (folderId) {
            docQuery += `d.folder_id = ?`;
            docParams.push(folderId);
        } else {
            // At root, show documents in root folder if root folder id = 1 or folder_id is null
            docQuery += `(d.folder_id IS NULL OR d.folder_id = 1)`;
        }

        if (options.search) {
            docQuery += ` AND (d.name LIKE ? OR d.file_name LIKE ?)`;
            docParams.push(`%${options.search}%`, `%${options.search}%`);
        }

        const sortBy = options.sortBy || 'name';
        const sortOrder = (options.sortOrder || 'asc').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        const sortColumnMap = {
            name: 'd.name',
            size: 'd.file_size',
            date: 'd.updated_at',
            type: 'd.file_type'
        };
        docQuery += ` ORDER BY ${sortColumnMap[sortBy] || 'd.name'} ${sortOrder}`;

        const [rawDocs] = await db.query(docQuery, docParams);

        const files = rawDocs.map(d => {
            const ext = (d.file_type || d.file_name?.split('.').pop() || 'bin').toLowerCase();
            return {
                id: d.id,
                documentCode: d.document_code,
                name: d.name,
                fileName: d.file_name,
                extension: ext,
                fileType: ext,
                folderId: d.folder_id,
                size: d.file_size || 0,
                mimeType: d.mime_type,
                version: d.version || 1,
                currentVersion: d.version || 1,
                accessLevel: d.access_level,
                isEncrypted: !!d.is_encrypted || !!d.access_password_hash,
                hasPassword: !!d.access_password_hash,
                isLocked: !!(d.metadata && typeof d.metadata === 'object' && d.metadata.isLocked),
                lockedBy: d.metadata?.lockedBy || null,
                downloadCount: d.download_count || 0,
                viewCount: d.view_count || 0,
                url: d.file_path,
                previewUrl: `/api/files/${d.id}/raw`,
                downloadUrl: `/api/files/${d.id}/download`,
                createdAt: d.created_at,
                updatedAt: d.updated_at,
                uploadedBy: d.uploaded_by,
                uploader: {
                    id: d.uploaded_by,
                    name: d.uploaded_by_name || d.uploaded_by_username || 'Admin'
                }
            };
        });

        const isUserAdmin = (userRole || '').toUpperCase() === 'ADMIN';

        return {
            success: true,
            currentFolder: currentFolder ? {
                id: currentFolder.id,
                name: currentFolder.name,
                code: currentFolder.folder_code,
                parentId: currentFolder.parent_id,
                path: currentFolder.path,
                accessLevel: currentFolder.access_level,
                allowedRoles: typeof currentFolder.allowed_roles === 'string' ? JSON.parse(currentFolder.allowed_roles) : currentFolder.allowed_roles,
                allowedUsers: typeof currentFolder.allowed_users === 'string' ? JSON.parse(currentFolder.allowed_users) : currentFolder.allowed_users
            } : null,
            breadcrumbs,
            folders,
            files,
            currentFolderPermissions: {
                canRead: true,
                canWrite: isUserAdmin || (userRole || '').toUpperCase() === 'STAFF',
                canDelete: isUserAdmin,
                canShare: isUserAdmin,
                canUpload: isUserAdmin || (userRole || '').toUpperCase() === 'STAFF'
            },
            stats: {
                totalFolders: folders.length,
                totalFiles: files.length,
                totalSize: files.reduce((sum, f) => sum + (f.size || 0), 0)
            }
        };
    }

    static async getFolderDashboard() {
        const [folderCountRow] = await db.query(`SELECT COUNT(*) as count FROM folders WHERE is_active = 1`);
        const [docStatsRow] = await db.query(
            `SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as totalSize 
             FROM documents WHERE is_active = 1`
        );
        const [recentDocs] = await db.query(
            `SELECT d.id, d.name, d.file_name, d.file_type, d.file_size, d.updated_at, u.username as uploader_name
             FROM documents d
             LEFT JOIN users u ON u.id = d.uploaded_by
             WHERE d.is_active = 1
             ORDER BY d.updated_at DESC LIMIT 5`
        );
        const [recentLogs] = await db.query(
            `SELECT l.id, l.action, l.accessed_at, u.username, d.name as document_name
             FROM document_access_logs l
             LEFT JOIN users u ON u.id = l.user_id
             LEFT JOIN documents d ON d.id = l.document_id
             ORDER BY l.accessed_at DESC LIMIT 10`
        );

        return {
            success: true,
            stats: {
                totalFolders: folderCountRow[0]?.count || 0,
                totalFiles: docStatsRow[0]?.count || 0,
                totalStorage: docStatsRow[0]?.totalSize || 0,
                recentFiles: recentDocs,
                recentActivities: recentLogs
            }
        };
    }

    static async createFolder(data, userId = 1) {
        if (!data.name || !data.name.trim()) {
            const err = new Error('Tên thư mục không được để trống');
            err.status = 400;
            throw err;
        }

        const name = data.name.trim();
        const parentId = data.parentId || data.parent_id || null;

        // Check duplicate under parent
        const existing = await Folder.findByParentAndName(parentId, name);
        if (existing) {
            const err = new Error(`Thư mục '${name}' đã tồn tại trong thư mục này`);
            err.status = 400;
            throw err;
        }

        let folderPath = `/${name}`;
        if (parentId) {
            const parent = await Folder.findById(parentId);
            if (!parent) {
                const err = new Error('Thư mục cha không tồn tại');
                err.status = 404;
                throw err;
            }
            folderPath = `${parent.path}/${name}`;
        }

        return await Folder.create({
            name,
            description: data.description || null,
            parent_id: parentId,
            path: folderPath,
            access_level: data.accessLevel || data.access_level || 'public',
            allowed_roles: data.allowedRoles || data.allowed_roles || ['ADMIN', 'STAFF'],
            allowed_users: data.allowedUsers || data.allowed_users || null,
            created_by: userId
        });
    }

    static async renameFolder(folderId, newName) {
        if (!newName || !newName.trim()) {
            const err = new Error('Tên mới không được để trống');
            err.status = 400;
            throw err;
        }

        const folder = await Folder.findById(folderId);
        if (!folder) {
            const err = new Error('Thư mục không tồn tại');
            err.status = 404;
            throw err;
        }

        const trimmedName = newName.trim();
        const existing = await Folder.findByParentAndName(folder.parent_id, trimmedName, folderId);
        if (existing) {
            const err = new Error(`Thư mục '${trimmedName}' đã tồn tại trong thư mục cha`);
            err.status = 400;
            throw err;
        }

        let newPath = `/${trimmedName}`;
        if (folder.parent_id) {
            const parent = await Folder.findById(folder.parent_id);
            newPath = `${parent ? parent.path : ''}/${trimmedName}`;
        }

        const oldPath = folder.path;
        await Folder.update(folderId, { name: trimmedName, path: newPath });
        await Folder.updateDescendantPaths(folderId, oldPath, newPath);

        return await Folder.findById(folderId);
    }

    static async moveFolder(folderId, targetParentId) {
        const id = Number(folderId);
        const targetId = targetParentId ? Number(targetParentId) : null;

        if (id === targetId) {
            const err = new Error('Không thể chuyển thư mục vào chính nó');
            err.status = 400;
            throw err;
        }

        const folder = await Folder.findById(id);
        if (!folder) {
            const err = new Error('Thư mục không tồn tại');
            err.status = 404;
            throw err;
        }

        // Check cycle: cannot move into own descendants
        if (targetId) {
            const descendantIds = await Folder.getAllDescendantIds(id);
            if (descendantIds.includes(targetId)) {
                const err = new Error('Không thể chuyển thư mục vào thư mục con của chính nó');
                err.status = 400;
                throw err;
            }

            const targetParent = await Folder.findById(targetId);
            if (!targetParent) {
                const err = new Error('Thư mục đích không tồn tại');
                err.status = 404;
                throw err;
            }
        }

        // Check duplicate name under targetParentId
        const existing = await Folder.findByParentAndName(targetId, folder.name, id);
        if (existing) {
            const err = new Error(`Thư mục '${folder.name}' đã tồn tại trong thư mục đích`);
            err.status = 400;
            throw err;
        }

        let newPath = `/${folder.name}`;
        if (targetId) {
            const parent = await Folder.findById(targetId);
            newPath = `${parent.path}/${folder.name}`;
        }

        const oldPath = folder.path;
        await Folder.update(id, { parent_id: targetId, path: newPath });
        await Folder.updateDescendantPaths(id, oldPath, newPath);

        return await Folder.findById(id);
    }

    static async getImpact(folderId) {
        const folder = await Folder.findById(folderId);
        if (!folder) {
            const err = new Error('Thư mục không tồn tại');
            err.status = 404;
            throw err;
        }
        return await Folder.getImpact(folderId);
    }

    static async softDeleteFolder(folderId) {
        const folder = await Folder.findById(folderId);
        if (!folder) {
            const err = new Error('Thư mục không tồn tại');
            err.status = 404;
            throw err;
        }
        return await Folder.softDelete(folderId);
    }
}

module.exports = FolderServices;
