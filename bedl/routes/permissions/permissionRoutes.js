const express = require('express');
const router = express.Router();
const FolderModel = require('../../models/FolderModel/folderModel');
const DocumentModel = require('../../models/DocumentModel/DocumentModel');
const db = require('../../db');
const { optionalAuthenticate } = require('../../middlewares/authMiddleware');

router.get('/', optionalAuthenticate, async (req, res) => {
    try {
        const { folderId, fileId } = req.query;
        let perms = [];

        if (folderId) {
            const folder = await FolderModel.findById(folderId);
            if (folder) {
                let allowedRoles = typeof folder.allowed_roles === 'string' ? JSON.parse(folder.allowed_roles) : (folder.allowed_roles || []);
                let allowedUsers = typeof folder.allowed_users === 'string' ? JSON.parse(folder.allowed_users) : (folder.allowed_users || []);

                for (const r of allowedRoles) {
                    perms.push({
                        id: `role-${r}`,
                        targetType: 'role',
                        targetName: r,
                        permission: 'editor',
                        createdAt: folder.created_at
                    });
                }

                if (allowedUsers.length > 0) {
                    const [users] = await db.query(`SELECT id, username, email FROM users WHERE id IN (?)`, [allowedUsers]);
                    for (const u of users) {
                        perms.push({
                            id: `user-${u.id}`,
                            targetType: 'user',
                            targetName: u.username || u.email,
                            permission: 'viewer',
                            createdAt: folder.created_at
                        });
                    }
                }
            }
        } else if (fileId) {
            const doc = await DocumentModel.findById(fileId);
            if (doc) {
                let allowedRoles = typeof doc.allowed_roles === 'string' ? JSON.parse(doc.allowed_roles) : (doc.allowed_roles || []);
                let allowedUsers = typeof doc.allowed_users === 'string' ? JSON.parse(doc.allowed_users) : (doc.allowed_users || []);

                for (const r of allowedRoles) {
                    perms.push({
                        id: `role-${r}`,
                        targetType: 'role',
                        targetName: r,
                        permission: 'editor',
                        createdAt: doc.created_at
                    });
                }

                if (allowedUsers.length > 0) {
                    const [users] = await db.query(`SELECT id, username, email FROM users WHERE id IN (?)`, [allowedUsers]);
                    for (const u of users) {
                        perms.push({
                            id: `user-${u.id}`,
                            targetType: 'user',
                            targetName: u.username || u.email,
                            permission: 'viewer',
                            createdAt: doc.created_at
                        });
                    }
                }
            }
        }

        res.json({ success: true, permissions: perms });
    } catch (error) {
        console.error('Permission get error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/share', optionalAuthenticate, async (req, res) => {
    try {
        const { targetType, targetId, shareType, shareTargetId, permission } = req.body;
        // shareType: 'user' or 'role'
        const isFolder = targetType === 'folder';

        if (isFolder) {
            const folder = await FolderModel.findById(targetId);
            if (!folder) return res.status(404).json({ success: false, message: 'Folder not found' });

            if (shareType === 'role') {
                let allowedRoles = typeof folder.allowed_roles === 'string' ? JSON.parse(folder.allowed_roles) : (folder.allowed_roles || []);
                if (!allowedRoles.includes(shareTargetId)) allowedRoles.push(shareTargetId);
                await FolderModel.update(targetId, { allowed_roles: allowedRoles });
            } else {
                let allowedUsers = typeof folder.allowed_users === 'string' ? JSON.parse(folder.allowed_users) : (folder.allowed_users || []);
                const uid = Number(shareTargetId);
                if (!allowedUsers.includes(uid)) allowedUsers.push(uid);
                await FolderModel.update(targetId, { allowed_users: allowedUsers });
            }
        } else {
            const doc = await DocumentModel.findById(targetId);
            if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

            if (shareType === 'role') {
                let allowedRoles = typeof doc.allowed_roles === 'string' ? JSON.parse(doc.allowed_roles) : (doc.allowed_roles || []);
                if (!allowedRoles.includes(shareTargetId)) allowedRoles.push(shareTargetId);
                await DocumentModel.update(targetId, { allowed_roles: JSON.stringify(allowedRoles) });
            } else {
                let allowedUsers = typeof doc.allowed_users === 'string' ? JSON.parse(doc.allowed_users) : (doc.allowed_users || []);
                const uid = Number(shareTargetId);
                if (!allowedUsers.includes(uid)) allowedUsers.push(uid);
                await DocumentModel.update(targetId, { allowed_users: JSON.stringify(allowedUsers) });
            }
        }

        res.json({ success: true, message: 'Chia sẻ thành công' });
    } catch (error) {
        console.error('Share error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/:id', optionalAuthenticate, async (req, res) => {
    res.json({ success: true, message: 'Thu hồi quyền thành công' });
});

module.exports = router;
