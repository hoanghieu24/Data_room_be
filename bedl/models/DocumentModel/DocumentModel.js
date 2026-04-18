const db = require("../../db");
const bcrypt = require("bcryptjs");

class DocumentModel {
    static async findAll(includeDeleted = false) {
        let query = `
            SELECT d.*, 
                   u.username as uploaded_by_name,
                   u.email as uploaded_by_email,
                   f.name as folder_name
            FROM documents d
            LEFT JOIN users u ON d.uploaded_by = u.id
            LEFT JOIN folders f ON d.folder_id = f.id
        `;

        if (!includeDeleted) {
            query += ` WHERE d.deleted_at IS NULL`;
        }

        query += ` ORDER BY d.created_at DESC`;

        const [rows] = await db.query(query);
        return rows;
    }

    static async findById(id, includeDeleted = false) {
        let query = `
            SELECT d.*, 
                   u.username as uploaded_by_name,
                   u.email as uploaded_by_email,
                   f.name as folder_name
            FROM documents d
            LEFT JOIN users u ON d.uploaded_by = u.id
            LEFT JOIN folders f ON d.folder_id = f.id
            WHERE d.id = ?
        `;

        if (!includeDeleted) {
            query += ` AND d.deleted_at IS NULL`;
        }

        const [rows] = await db.query(query, [id]);
        return rows[0] || null;
    }

    static async create(documentData) {
        const {
            document_code,
            folder_id,
            name,
            description,
            file_name,
            file_path,
            file_size,
            file_type,
            mime_type,
            version,
            access_level,
            access_password_hash,
            allowed_roles,
            allowed_users,
            metadata,
            tags,
            is_encrypted,
            expiry_date,
            uploaded_by
        } = documentData;

        const [result] = await db.query(
            `INSERT INTO documents (
                document_code, folder_id, name, description,
                file_name, file_path, file_size, file_type,
                mime_type, version, access_level, access_password_hash,
                allowed_roles, allowed_users, metadata, tags, is_encrypted,
                expiry_date, uploaded_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                document_code,
                folder_id,
                name,
                description,
                file_name,
                file_path,
                file_size,
                file_type,
                mime_type,
                version || 1,
                access_level || "private",
                access_password_hash || null,
                allowed_roles || null,
                allowed_users || null,
                metadata || null,
                tags || null,
                is_encrypted || 0,
                expiry_date || null,
                uploaded_by
            ]
        );

        return this.findById(result.insertId);
    }

    static async update(id, documentData) {
        const {
            name,
            description,
            folder_id,
            access_level,
            access_password_hash,
            allowed_roles,
            allowed_users,
            metadata,
            tags,
            is_encrypted,
            is_active,
            version
        } = documentData;

        const updateFields = [];
        const values = [];

        if (name !== undefined) {
            updateFields.push("name = ?");
            values.push(name);
        }
        if (description !== undefined) {
            updateFields.push("description = ?");
            values.push(description);
        }
        if (folder_id !== undefined) {
            updateFields.push("folder_id = ?");
            values.push(folder_id);
        }
        if (access_level !== undefined) {
            updateFields.push("access_level = ?");
            values.push(access_level);
        }
        if (access_password_hash !== undefined) {
            updateFields.push("access_password_hash = ?");
            values.push(access_password_hash);
        }
        if (allowed_roles !== undefined) {
            updateFields.push("allowed_roles = ?");
            values.push(allowed_roles);
        }
        if (allowed_users !== undefined) {
            updateFields.push("allowed_users = ?");
            values.push(allowed_users);
        }
        if (metadata !== undefined) {
            updateFields.push("metadata = ?");
            values.push(metadata);
        }
        if (tags !== undefined) {
            updateFields.push("tags = ?");
            values.push(tags);
        }
        if (is_encrypted !== undefined) {
            updateFields.push("is_encrypted = ?");
            values.push(is_encrypted);
        }
        if (is_active !== undefined) {
            updateFields.push("is_active = ?");
            values.push(is_active);
        }
        if (version !== undefined) {
            updateFields.push("version = ?");
            values.push(version);
        }

        if (updateFields.length === 0) {
            return this.findById(id);
        }

        updateFields.push("updated_at = NOW()");
        values.push(id);

        await db.query(
            `UPDATE documents 
             SET ${updateFields.join(", ")} 
             WHERE id = ? AND deleted_at IS NULL`,
            values
        );

        return this.findById(id);
    }

    static async softDelete(id) {
        const [result] = await db.query(
            `UPDATE documents
             SET is_active = 0,
                 deleted_at = NOW(),
                 updated_at = NOW()
             WHERE id = ? AND deleted_at IS NULL`,
            [id]
        );

        return result.affectedRows > 0;
    }

    static async incrementDownloadCount(id) {
        const [result] = await db.query(
            `UPDATE documents
             SET download_count = download_count + 1
             WHERE id = ? AND deleted_at IS NULL`,
            [id]
        );
        return result.affectedRows > 0;
    }

    static async incrementViewCount(id) {
        const [result] = await db.query(
            `UPDATE documents
             SET view_count = view_count + 1
             WHERE id = ? AND deleted_at IS NULL`,
            [id]
        );
        return result.affectedRows > 0;
    }

    static async verifyDocumentPassword(document, password) {
        if (!document.access_password_hash) return true;
        if (!password) return false;

        return await bcrypt.compare(password, document.access_password_hash);
    }

    static async canUserAccess(documentId, userId, userRole = null, password = null) {
        const document = await this.findById(documentId);

        if (!document) {
            return { canAccess: false, reason: "Tài liệu không tồn tại", code: "NOT_FOUND" };
        }

        if (!document.is_active) {
            return { canAccess: false, reason: "Tài liệu đã bị vô hiệu hoá", code: "INACTIVE" };
        }

        if (document.expiry_date && new Date(document.expiry_date) < new Date()) {
            return { canAccess: false, reason: "Tài liệu đã hết hạn", code: "EXPIRED" };
        }

        const isOwner = Number(document.uploaded_by) === Number(userId);
        const isAdmin = userRole === "ADMIN";

        if (document.access_level === "public") {
            return { canAccess: true, document };
        }

        if (!userId) {
            return { canAccess: false, reason: "Bạn chưa đăng nhập", code: "UNAUTHORIZED" };
        }

        if (document.access_level === "private") {
            

            if (document.access_password_hash) {
                const ok = await this.verifyDocumentPassword(document, password);
                if (!ok) {
                    return { canAccess: false, reason: "Mật mã tài liệu không đúng", code: "PASSWORD_REQUIRED" };
                }
            }

            return { canAccess: true, document };
        }

        if (document.access_level === "restricted") {
            let allowedRoles = [];
            let allowedUsers = [];

            try {
                allowedRoles = document.allowed_roles
                    ? (Array.isArray(document.allowed_roles)
                        ? document.allowed_roles
                        : JSON.parse(document.allowed_roles))
                    : [];
            } catch {
                allowedRoles = [];
            }

            try {
                allowedUsers = document.allowed_users
                    ? (Array.isArray(document.allowed_users)
                        ? document.allowed_users
                        : JSON.parse(document.allowed_users))
                    : [];
            } catch {
                allowedUsers = [];
            }

            const hasRolePermission = userRole && allowedRoles.includes(userRole);
            const hasUserPermission =
                allowedUsers.includes(Number(userId)) ||
                allowedUsers.includes(String(userId));

            

            if (document.access_password_hash) {
                const ok = await this.verifyDocumentPassword(document, password);
                if (!ok) {
                    return { canAccess: false, reason: "Mật mã tài liệu không đúng", code: "PASSWORD_REQUIRED" };
                }
            }

            return { canAccess: true, document };
        }

        return { canAccess: false, reason: "Access level không hợp lệ", code: "INVALID_ACCESS" };
    }

    static async canUserDelete(documentId, userId) {
        const document = await this.findById(documentId, true);

        if (!document) {
            return { canDelete: false, reason: "Tài liệu không tồn tại", code: "NOT_FOUND" };
        }

        if (document.deleted_at) {
            return { canDelete: false, reason: "Tài liệu đã bị xoá trước đó", code: "ALREADY_DELETED" };
        }

        if (!userId) {
            return { canDelete: false, reason: "Bạn chưa đăng nhập", code: "UNAUTHORIZED" };
        }

        const isOwner = Number(document.uploaded_by) === Number(userId);

        if (!isOwner) {
            return {
                canDelete: false,
                reason: "Chỉ người upload mới được xoá tài liệu này",
                code: "FORBIDDEN"
            };
        }

        return { canDelete: true, document };
    }
}

module.exports = DocumentModel;