const db = require("../../db");

class FolderModel {
    static async findAll() {
        const [rows] = await db.query(
            `SELECT id, folder_code, name, description, parent_id, path, access_level, 
                    allowed_roles, allowed_users, sort_order, is_active, created_by, 
                    created_at, updated_at
             FROM folders
             WHERE is_active = 1
             ORDER BY sort_order ASC, name ASC`
        );
        return rows;
    }

    static async findAllforDocument() {
        const [rows] = await db.query(
            `SELECT id, folder_code, name, parent_id, path
             FROM folders
             WHERE is_active = 1
             ORDER BY sort_order ASC, name ASC`
        );
        return rows;
    }

    static async findAllDeleted() {
        const [rows] = await db.query(
            `SELECT f.id, f.folder_code, f.name, f.description, f.parent_id, f.path, 
                    f.created_at, f.updated_at, u.username as created_by_name
             FROM folders f
             LEFT JOIN users u ON u.id = f.created_by
             WHERE f.is_active = 0
             ORDER BY f.updated_at DESC`
        );
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query(
            `SELECT id, folder_code, name, description, parent_id, path, access_level, 
                    allowed_roles, allowed_users, sort_order, is_active, created_by, 
                    created_at, updated_at
             FROM folders
             WHERE id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    static async findByCode(code) {
        const [rows] = await db.query(
            `SELECT * FROM folders WHERE folder_code = ? LIMIT 1`,
            [code]
        );
        return rows[0] || null;
    }

    static async findByParentAndName(parentId, name, excludeId = null) {
        let query = `SELECT id FROM folders WHERE name = ? AND is_active = 1 AND `;
        const params = [name];

        if (parentId === null || parentId === undefined) {
            query += `parent_id IS NULL`;
        } else {
            query += `parent_id = ?`;
            params.push(parentId);
        }

        if (excludeId) {
            query += ` AND id != ?`;
            params.push(excludeId);
        }

        const [rows] = await db.query(query, params);
        return rows[0] || null;
    }

    static async create({ folder_code, name, description, parent_id, path, access_level, allowed_roles, allowed_users, created_by }) {
        const code = folder_code || `FLD_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const roles = allowed_roles ? (typeof allowed_roles === 'string' ? allowed_roles : JSON.stringify(allowed_roles)) : JSON.stringify(['ADMIN', 'STAFF']);
        const users = allowed_users ? (typeof allowed_users === 'string' ? allowed_users : JSON.stringify(allowed_users)) : null;

        const [result] = await db.query(
            `INSERT INTO folders (folder_code, name, description, parent_id, path, access_level, allowed_roles, allowed_users, is_active, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
            [code, name, description || null, parent_id || null, path || `/${name}`, access_level || 'public', roles, users, created_by || 1]
        );

        return await this.findById(result.insertId);
    }

    static async update(id, data) {
        const updates = [];
        const params = [];

        const allowedFields = ['name', 'description', 'parent_id', 'path', 'access_level', 'allowed_roles', 'allowed_users', 'sort_order', 'is_active'];
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                updates.push(`${field} = ?`);
                let val = data[field];
                if ((field === 'allowed_roles' || field === 'allowed_users') && val !== null && typeof val === 'object') {
                    val = JSON.stringify(val);
                }
                params.push(val);
            }
        }

        if (updates.length === 0) return await this.findById(id);

        params.push(id);
        await db.query(`UPDATE folders SET ${updates.join(', ')} WHERE id = ?`, params);
        return await this.findById(id);
    }

    static async getAllDescendantIds(folderId) {
        const descendantIds = [];
        const queue = [folderId];

        while (queue.length > 0) {
            const currentId = queue.shift();
            const [children] = await db.query(
                `SELECT id FROM folders WHERE parent_id = ? AND is_active = 1`,
                [currentId]
            );
            for (const child of children) {
                descendantIds.push(child.id);
                queue.push(child.id);
            }
        }

        return descendantIds;
    }

    static async updateDescendantPaths(folderId, oldPath, newPath) {
        const [descendants] = await db.query(
            `SELECT id, path FROM folders WHERE path LIKE ?`,
            [`${oldPath}/%`]
        );

        for (const desc of descendants) {
            const updatedPath = newPath + desc.path.substring(oldPath.length);
            await db.query(`UPDATE folders SET path = ? WHERE id = ?`, [updatedPath, desc.id]);
        }
    }

    static async softDelete(folderId) {
        const descendantIds = await this.getAllDescendantIds(folderId);
        const allIds = [folderId, ...descendantIds];

        // Soft delete all folders
        await db.query(
            `UPDATE folders SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id IN (?)`,
            [allIds]
        );

        // Soft delete all documents inside
        await db.query(
            `UPDATE documents SET is_active = 0, deleted_at = CURRENT_TIMESTAMP WHERE folder_id IN (?)`,
            [allIds]
        );

        return true;
    }

    static async restore(folderId) {
        // Check if parent is active
        const folder = await this.findById(folderId);
        if (folder && folder.parent_id) {
            const parent = await this.findById(folder.parent_id);
            if (parent && !parent.is_active) {
                // If parent is also inactive, move to root
                await db.query(`UPDATE folders SET parent_id = NULL WHERE id = ?`, [folderId]);
            }
        }

        await db.query(`UPDATE folders SET is_active = 1 WHERE id = ?`, [folderId]);
        return true;
    }

    static async permanentDelete(folderId) {
        const descendantIds = await this.getAllDescendantIds(folderId);
        const allIds = [folderId, ...descendantIds];

        // Delete logs for documents
        const [docs] = await db.query(`SELECT id FROM documents WHERE folder_id IN (?)`, [allIds]);
        if (docs.length > 0) {
            const docIds = docs.map(d => d.id);
            await db.query(`DELETE FROM document_access_logs WHERE document_id IN (?)`, [docIds]);
            await db.query(`DELETE FROM documents WHERE id IN (?)`, [docIds]);
        }

        await db.query(`DELETE FROM folders WHERE id IN (?)`, [allIds]);
        return true;
    }

    static async getImpact(folderId) {
        const descendantIds = await this.getAllDescendantIds(folderId);
        const allIds = [folderId, ...descendantIds];

        const [docRows] = await db.query(
            `SELECT COUNT(*) as fileCount, COALESCE(SUM(file_size), 0) as totalSize 
             FROM documents 
             WHERE folder_id IN (?) AND is_active = 1`,
            [allIds]
        );

        return {
            subfolderCount: descendantIds.length,
            fileCount: docRows[0].fileCount || 0,
            totalSize: docRows[0].totalSize || 0
        };
    }

    static canAccessFolder(folder, userRole, userId) {
        if (!folder) return false;
        if (!userRole) return false;
        if (userRole.toUpperCase() === 'ADMIN') return true;

        if (folder.access_level === 'public') return true;

        let allowedRoles = [];
        if (folder.allowed_roles) {
            allowedRoles = typeof folder.allowed_roles === 'string' ? JSON.parse(folder.allowed_roles) : folder.allowed_roles;
        }
        if (Array.isArray(allowedRoles) && allowedRoles.includes(userRole.toUpperCase())) {
            return true;
        }

        let allowedUsers = [];
        if (folder.allowed_users) {
            allowedUsers = typeof folder.allowed_users === 'string' ? JSON.parse(folder.allowed_users) : folder.allowed_users;
        }
        if (Array.isArray(allowedUsers) && userId && allowedUsers.includes(Number(userId))) {
            return true;
        }

        return false;
    }

    static async buildTree(userRole = 'ADMIN', userId = null) {
        const allFolders = await this.findAll();

        // Filter folders by permission
        const accessibleFolders = allFolders.filter(f => this.canAccessFolder(f, userRole, userId));
        const folderMap = new Map();

        accessibleFolders.forEach(f => {
            folderMap.set(f.id, {
                id: f.id,
                name: f.name,
                code: f.folder_code,
                parentId: f.parent_id,
                path: f.path,
                accessLevel: f.access_level,
                allowedRoles: typeof f.allowed_roles === 'string' ? JSON.parse(f.allowed_roles) : f.allowed_roles,
                allowedUsers: typeof f.allowed_users === 'string' ? JSON.parse(f.allowed_users) : f.allowed_users,
                children: []
            });
        });

        const rootNodes = [];
        folderMap.forEach(node => {
            if (node.parentId && folderMap.has(node.parentId)) {
                folderMap.get(node.parentId).children.push(node);
            } else {
                rootNodes.push(node);
            }
        });

        return rootNodes;
    }
}

module.exports = FolderModel;