const cloudinary = require('cloudinary').v2;
const path = require('path');
const fsPromises = require('fs').promises;
const fs = require('fs');
const { Readable } = require('stream');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const DocumentModel = require('../../models/DocumentModel/DocumentModel');
const DocumentLogModel = require('../../models/DocumentModel/DocumentLogModel');
const { generateDocumentCode } = require('../../utils/documentUtils');
const db = require('../../db');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dzdldby9a',
    api_key: process.env.CLOUDINARY_API_KEY || '548958782672292',
    api_secret: process.env.CLOUDINARY_API_SECRET || '_7CXnsC79ZFpFDmlOxkzwIJsMyE',
    secure: true
});

const getClientInfo = (req) => {
    const ip = req.headers['x-forwarded-for'] ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.ip || '127.0.0.1';
    return {
        ip_address: ip.includes('::1') ? '127.0.0.1' : ip.split(',')[0].trim(),
        user_agent: req.headers['user-agent'] || null
    };
};

const uploadBufferToCloudinary = async (buffer, originalname, mimetype) => {
    try {
        const fileExt = path.extname(originalname).toLowerCase().replace('.', '');
        let resourceType = 'auto';
        let folder = 'documents/others';

        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
            folder = 'documents/images';
            resourceType = 'image';
        } else if (fileExt === 'pdf') {
            folder = 'documents/pdfs';
            resourceType = 'raw';
        } else if (['doc', 'docx'].includes(fileExt)) {
            folder = 'documents/word';
            resourceType = 'raw';
        } else if (['xls', 'xlsx'].includes(fileExt)) {
            folder = 'documents/excel';
            resourceType = 'raw';
        }

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
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
            Readable.from(buffer).pipe(stream);
        });

        return {
            url: result.secure_url,
            public_id: result.public_id,
            resource_type: result.resource_type
        };
    } catch (err) {
        console.warn('Cloudinary upload error, fallback to local storage:', err.message);
        const uploadDir = path.resolve(process.cwd(), 'uploads/documents');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const fileName = `${Date.now()}_${path.basename(originalname)}`;
        const localPath = path.join(uploadDir, fileName);
        await fsPromises.writeFile(localPath, buffer);
        return {
            url: `/uploads/documents/${fileName}`,
            local_path: localPath,
            is_local: true
        };
    }
};

class FileController {
    static async upload(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Vui lòng chọn tệp tin cần tải lên' });
            }

            let { originalname, buffer, mimetype, size } = req.file;
            try {
                const decoded = Buffer.from(originalname, 'latin1').toString('utf8');
                if (!decoded.includes('')) {
                    originalname = decoded;
                }
            } catch (e) {}
            const folderId = req.body.folderId ? Number(req.body.folderId) : (req.body.folder_id ? Number(req.body.folder_id) : 1);
            const customName = req.body.name || path.parse(originalname).name;
            const accessLevel = req.body.accessLevel || req.body.access_level || 'public';
            const userId = req.user?.id || 1;
            const password = req.body.password ? req.body.password.trim() : '';

            const fileExt = path.extname(originalname).toLowerCase().replace('.', '') || 'bin';
            const docCode = await generateDocumentCode();

            const uploadRes = await uploadBufferToCloudinary(buffer, originalname, mimetype);

            let accessPasswordHash = null;
            let isEncrypted = 0;
            if (password) {
                accessPasswordHash = await bcrypt.hash(password, 10);
                isEncrypted = 1;
            }

            const docData = {
                document_code: docCode,
                folder_id: folderId,
                name: customName,
                description: req.body.description || null,
                file_name: originalname,
                file_path: uploadRes.url,
                file_size: size,
                file_type: fileExt,
                mime_type: mimetype,
                version: 1,
                access_level: accessLevel,
                access_password_hash: accessPasswordHash,
                is_encrypted: isEncrypted,
                metadata: JSON.stringify({
                    cloudinary_public_id: uploadRes.public_id || null,
                    cloudinary_resource_type: uploadRes.resource_type || null,
                    local_path: uploadRes.local_path || null,
                    versions: []
                }),
                uploaded_by: userId
            };

            const newDoc = await DocumentModel.create(docData);

            const clientInfo = getClientInfo(req);
            await DocumentLogModel.logAction({
                document_id: newDoc.id,
                user_id: userId,
                action: 'UPLOAD',
                ip_address: clientInfo.ip_address,
                user_agent: clientInfo.user_agent
            });

            return res.status(201).json({
                success: true,
                message: 'Tải lên tài liệu thành công',
                file: {
                    id: newDoc.id,
                    name: newDoc.name,
                    fileName: newDoc.file_name,
                    extension: fileExt,
                    fileType: fileExt,
                    folderId: newDoc.folder_id,
                    size: newDoc.file_size,
                    mimeType: newDoc.mime_type,
                    url: newDoc.file_path,
                    previewUrl: `/api/files/${newDoc.id}/raw`,
                    downloadUrl: `/api/files/${newDoc.id}/download`,
                    isEncrypted: isEncrypted === 1,
                    hasPassword: !!accessPasswordHash,
                    uploadedBy: userId
                }
            });
        } catch (error) {
            console.error('File upload error:', error);
            return res.status(500).json({ success: false, message: error.message || 'Lỗi khi tải tài liệu' });
        }
    }

    static async setPassword(req, res) {
        try {
            const { id } = req.params;
            const { password } = req.body;
            const document = await DocumentModel.findById(id);
            if (!document) {
                return res.status(404).json({ success: false, message: 'Tài liệu không tồn tại' });
            }

            // Chỉ người upload file hoặc Quản trị viên (ADMIN) mới được phép cài đặt / thay đổi mật mã
            const userId = req.user?.id;
            const userRole = (req.user?.role || '').toUpperCase();
            const isOwner = Number(document.uploaded_by) === Number(userId);
            const isAdmin = userRole === 'ADMIN';

            if (!isOwner && !isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Chỉ người tải lên tài liệu này hoặc Quản trị viên mới có quyền cài đặt hoặc đổi mật mã bảo vệ.'
                });
            }

            if (password && password.trim()) {
                const hash = await bcrypt.hash(password.trim(), 10);
                await DocumentModel.update(id, {
                    access_password_hash: hash,
                    is_encrypted: 1
                });
                return res.json({ success: true, message: 'Đã khóa bảo vệ tài liệu bằng mật mã thành công' });
            } else {
                await DocumentModel.update(id, {
                    access_password_hash: null,
                    is_encrypted: 0
                });
                return res.json({ success: true, message: 'Đã gỡ bỏ mật mã bảo vệ tài liệu' });
            }
        } catch (error) {
            console.error('setPassword error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async initChunkUpload(req, res) {
        try {
            const { fileName, totalSize, chunkSize = 5 * 1024 * 1024, totalChunks, folderId } = req.body;
            const uploadId = uuidv4();
            const tempDir = path.resolve(process.cwd(), 'temp', uploadId);

            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const meta = {
                uploadId,
                fileName,
                totalSize,
                chunkSize,
                totalChunks,
                folderId: folderId || 1,
                uploadedChunks: [],
                createdAt: Date.now()
            };
            await fsPromises.writeFile(path.join(tempDir, 'metadata.json'), JSON.stringify(meta, null, 2));

            res.status(200).json({
                success: true,
                uploadId,
                chunkSize
            });
        } catch (error) {
            console.error('initChunkUpload error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async uploadChunk(req, res) {
        try {
            const { uploadId, chunkIndex } = req.body;
            if (!req.file || !uploadId || chunkIndex === undefined) {
                return res.status(400).json({ success: false, message: 'Thiếu chunk hoặc uploadId' });
            }

            const tempDir = path.resolve(process.cwd(), 'temp', uploadId);
            if (!fs.existsSync(tempDir)) {
                return res.status(404).json({ success: false, message: 'Phiên upload không tồn tại hoặc đã hết hạn' });
            }

            const chunkPath = path.join(tempDir, `chunk_${chunkIndex}`);
            await fsPromises.writeFile(chunkPath, req.file.buffer);

            res.status(200).json({
                success: true,
                message: `Chunk ${chunkIndex} uploaded successfully`
            });
        } catch (error) {
            console.error('uploadChunk error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async completeChunkUpload(req, res) {
        try {
            const { uploadId, fileName, folderId, name, password } = req.body;
            const tempDir = path.resolve(process.cwd(), 'temp', uploadId);

            if (!fs.existsSync(tempDir)) {
                return res.status(404).json({ success: false, message: 'Phiên upload không tồn tại' });
            }

            const files = await fsPromises.readdir(tempDir);
            const chunkFiles = files
                .filter(f => f.startsWith('chunk_'))
                .sort((a, b) => {
                    const idxA = parseInt(a.split('_')[1], 10);
                    const idxB = parseInt(b.split('_')[1], 10);
                    return idxA - idxB;
                });

            const buffers = [];
            for (const cFile of chunkFiles) {
                const cBuf = await fsPromises.readFile(path.join(tempDir, cFile));
                buffers.push(cBuf);
            }
            const fullBuffer = Buffer.concat(buffers);

            const fileExt = path.extname(fileName).toLowerCase().replace('.', '') || 'bin';
            const mimeType = req.body.mimeType || 'application/octet-stream';
            const uploadRes = await uploadBufferToCloudinary(fullBuffer, fileName, mimeType);

            // Clean up temp
            try {
                for (const f of files) {
                    await fsPromises.unlink(path.join(tempDir, f));
                }
                await fsPromises.rmdir(tempDir);
            } catch (e) {}

            const userId = req.user?.id || 1;
            const docCode = await generateDocumentCode();

            let accessPasswordHash = null;
            let isEncrypted = 0;
            if (password && password.trim()) {
                accessPasswordHash = await bcrypt.hash(password.trim(), 10);
                isEncrypted = 1;
            }

            const docData = {
                document_code: docCode,
                folder_id: folderId ? Number(folderId) : 1,
                name: name || path.parse(fileName).name,
                description: req.body.description || null,
                file_name: fileName,
                file_path: uploadRes.url,
                file_size: fullBuffer.length,
                file_type: fileExt,
                mime_type: mimeType,
                version: 1,
                access_level: 'public',
                access_password_hash: accessPasswordHash,
                is_encrypted: isEncrypted,
                metadata: JSON.stringify({
                    cloudinary_public_id: uploadRes.public_id || null,
                    cloudinary_resource_type: uploadRes.resource_type || null,
                    local_path: uploadRes.local_path || null,
                    versions: []
                }),
                uploaded_by: userId
            };

            const newDoc = await DocumentModel.create(docData);

            return res.status(201).json({
                success: true,
                message: 'Tải lên hoàn tất',
                file: {
                    id: newDoc.id,
                    name: newDoc.name,
                    fileName: newDoc.file_name,
                    extension: fileExt,
                    fileType: fileExt,
                    folderId: newDoc.folder_id,
                    size: newDoc.file_size,
                    mimeType: newDoc.mime_type,
                    url: newDoc.file_path,
                    previewUrl: `/api/files/${newDoc.id}/raw`,
                    downloadUrl: `/api/files/${newDoc.id}/download`,
                    isEncrypted: isEncrypted === 1,
                    hasPassword: !!accessPasswordHash,
                    uploadedBy: userId
                }
            });
        } catch (error) {
            console.error('completeChunkUpload error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static checkFilePassword(document, req) {
        if (!document.access_password_hash) return true;
        const currentUserId = req.user?.id;
        // If current user is the uploader, bypass password check
        if (currentUserId && Number(currentUserId) === Number(document.uploaded_by)) {
            return true;
        }

        const clientPassword = req.headers['x-document-password'] || req.query.password || req.body?.password;
        if (!clientPassword) return false;

        return bcrypt.compareSync(String(clientPassword), document.access_password_hash);
    }

    static async preview(req, res) {
        try {
            const { id } = req.params;
            const document = await DocumentModel.findById(id);
            if (!document) {
                return res.status(404).json({ success: false, message: 'Tài liệu không tồn tại' });
            }

            // Check password lock
            if (document.access_password_hash && !FileController.checkFilePassword(document, req)) {
                return res.status(401).json({
                    success: false,
                    code: 'PASSWORD_REQUIRED',
                    isProtected: true,
                    message: req.headers['x-document-password'] ? 'Mật mã tài liệu không chính xác' : 'Tài liệu này đã được cài mật mã bảo vệ. Vui lòng nhập mật mã để mở khóa.'
                });
            }

            const rawUrl = `/api/files/${document.id}/raw`;
            const ext = (document.file_type || document.file_name?.split('.').pop() || 'bin').toLowerCase();
            return res.json({
                success: true,
                file: {
                    id: document.id,
                    name: document.name,
                    fileName: document.file_name,
                    extension: ext,
                    fileType: ext,
                    mimeType: document.mime_type,
                    size: document.file_size,
                    url: document.file_path,
                    previewUrl: rawUrl,
                    downloadUrl: `/api/files/${document.id}/download`,
                    version: document.version,
                    currentVersion: document.version,
                    isEncrypted: !!document.is_encrypted || !!document.access_password_hash,
                    hasPassword: !!document.access_password_hash,
                    uploadedBy: document.uploaded_by,
                    updatedAt: document.updated_at
                }
            });
        } catch (error) {
            console.error('File preview error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getRawStream(req, res) {
        try {
            const { id } = req.params;
            const document = await DocumentModel.findById(id);
            if (!document) {
                return res.status(404).send('File not found');
            }

            // Check password lock
            if (document.access_password_hash && !FileController.checkFilePassword(document, req)) {
                return res.status(401).json({
                    success: false,
                    code: 'PASSWORD_REQUIRED',
                    isProtected: true,
                    message: 'Tài liệu này đã được cài mật mã bảo vệ. Vui lòng nhập mật mã để mở khóa.'
                });
            }

            const filePath = document.file_path;
            if (filePath && filePath.startsWith('http')) {
                const response = await fetch(filePath);
                if (!response.ok) {
                    return res.status(response.status).send('Cannot fetch file from storage');
                }
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
                res.setHeader('Content-Length', buffer.length);
                res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.file_name)}"`);
                return res.send(buffer);
            } else {
                const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
                if (!fs.existsSync(absPath)) {
                    return res.status(404).send('File not found on disk');
                }
                res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
                res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.file_name)}"`);
                return res.sendFile(absPath);
            }
        } catch (error) {
            console.error('getRawStream error:', error);
            return res.status(500).send('Error streaming file');
        }
    }

    static async download(req, res) {
        try {
            const { id } = req.params;
            const document = await DocumentModel.findById(id);
            if (!document) {
                return res.status(404).json({ success: false, message: 'Tài liệu không tồn tại' });
            }

            // Check password lock
            if (document.access_password_hash && !FileController.checkFilePassword(document, req)) {
                return res.status(401).json({
                    success: false,
                    code: 'PASSWORD_REQUIRED',
                    isProtected: true,
                    message: 'Tài liệu này đã được cài mật mã bảo vệ. Vui lòng nhập mật mã để tải về.'
                });
            }

            await DocumentModel.incrementDownloadCount(id);

            const clientInfo = getClientInfo(req);
            await DocumentLogModel.logAction({
                document_id: id,
                user_id: req.user?.id || document.uploaded_by || 1,
                action: 'DOWNLOAD',
                ip_address: clientInfo.ip_address,
                user_agent: clientInfo.user_agent
            });

            if (document.file_path && document.file_path.startsWith('http')) {
                return res.redirect(document.file_path);
            }

            const absPath = path.isAbsolute(document.file_path) ? document.file_path : path.resolve(process.cwd(), document.file_path);
            return res.download(absPath, document.file_name);
        } catch (error) {
            console.error('Download error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async rename(req, res) {
        try {
            const { id } = req.params;
            const { name } = req.body;
            if (!name || !name.trim()) {
                return res.status(400).json({ success: false, message: 'Tên tài liệu không được để trống' });
            }

            const updated = await DocumentModel.update(id, { name: name.trim() });
            return res.json({
                success: true,
                message: 'Đổi tên tài liệu thành công',
                file: updated
            });
        } catch (error) {
            console.error('Rename error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async move(req, res) {
        try {
            const { id } = req.params;
            const targetFolderId = req.body.targetFolderId || req.body.folderId;
            if (!targetFolderId) {
                return res.status(400).json({ success: false, message: 'Chưa chọn thư mục đích' });
            }

            const updated = await DocumentModel.update(id, { folder_id: Number(targetFolderId) });
            return res.json({
                success: true,
                message: 'Di chuyển tài liệu thành công',
                file: updated
            });
        } catch (error) {
            console.error('Move error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async toggleLock(req, res, lockState) {
        try {
            const { id } = req.params;
            const document = await DocumentModel.findById(id);
            if (!document) {
                return res.status(404).json({ success: false, message: 'Tài liệu không tồn tại' });
            }

            let metadata = {};
            try {
                metadata = typeof document.metadata === 'string' ? JSON.parse(document.metadata) : (document.metadata || {});
            } catch (e) {}

            metadata.isLocked = lockState;
            metadata.lockedBy = lockState ? (req.user?.username || 'User') : null;
            metadata.lockedAt = lockState ? new Date().toISOString() : null;

            await DocumentModel.update(id, { metadata: JSON.stringify(metadata) });

            return res.json({
                success: true,
                message: lockState ? 'Đã khóa tài liệu (Check-out)' : 'Đã mở khóa tài liệu (Check-in)',
                isLocked: lockState
            });
        } catch (error) {
            console.error('Toggle lock error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async lock(req, res) {
        return FileController.toggleLock(req, res, true);
    }

    static async unlock(req, res) {
        return FileController.toggleLock(req, res, false);
    }

    static async getVersions(req, res) {
        try {
            const { id } = req.params;
            const document = await DocumentModel.findById(id);
            if (!document) {
                return res.status(404).json({ success: false, message: 'Tài liệu không tồn tại' });
            }

            let meta = {};
            try {
                meta = typeof document.metadata === 'string' ? JSON.parse(document.metadata) : (document.metadata || {});
            } catch (e) {}

            const versions = meta.versions || [];
            const allVersions = [
                {
                    version: document.version || 1,
                    fileName: document.file_name,
                    size: document.file_size,
                    url: document.file_path,
                    uploadedAt: document.updated_at || document.created_at,
                    isCurrent: true
                },
                ...versions
            ];

            return res.json({
                success: true,
                versions: allVersions
            });
        } catch (error) {
            console.error('getVersions error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async uploadVersion(req, res) {
        try {
            const { id } = req.params;
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Vui lòng chọn tệp tin mới' });
            }

            const document = await DocumentModel.findById(id);
            if (!document) {
                return res.status(404).json({ success: false, message: 'Tài liệu không tồn tại' });
            }

            const { originalname, buffer, mimetype, size } = req.file;
            const uploadRes = await uploadBufferToCloudinary(buffer, originalname, mimetype);

            let meta = {};
            try {
                meta = typeof document.metadata === 'string' ? JSON.parse(document.metadata) : (document.metadata || {});
            } catch (e) {}

            const prevVersions = meta.versions || [];
            prevVersions.unshift({
                version: document.version || 1,
                fileName: document.file_name,
                size: document.file_size,
                url: document.file_path,
                uploadedAt: document.updated_at || document.created_at,
                isCurrent: false
            });

            meta.versions = prevVersions;
            meta.cloudinary_public_id = uploadRes.public_id || null;

            const newVersion = (document.version || 1) + 1;
            const fileExt = path.extname(originalname).toLowerCase().replace('.', '') || 'bin';

            await DocumentModel.update(id, {
                file_name: originalname,
                file_path: uploadRes.url,
                file_size: size,
                file_type: fileExt,
                mime_type: mimetype,
                version: newVersion,
                metadata: JSON.stringify(meta)
            });

            return res.json({
                success: true,
                message: `Tải lên phiên bản ${newVersion} thành công`,
                version: newVersion
            });
        } catch (error) {
            console.error('uploadVersion error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async restoreVersion(req, res) {
        try {
            const { id } = req.params;
            const { versionNumber } = req.body;

            const document = await DocumentModel.findById(id);
            if (!document) {
                return res.status(404).json({ success: false, message: 'Tài liệu không tồn tại' });
            }

            let meta = {};
            try {
                meta = typeof document.metadata === 'string' ? JSON.parse(document.metadata) : (document.metadata || {});
            } catch (e) {}

            const versions = meta.versions || [];
            const target = versions.find(v => v.version === Number(versionNumber));
            if (!target) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy phiên bản yêu cầu' });
            }

            versions.unshift({
                version: document.version || 1,
                fileName: document.file_name,
                size: document.file_size,
                url: document.file_path,
                uploadedAt: document.updated_at || document.created_at,
                isCurrent: false
            });

            const newVersion = (document.version || 1) + 1;
            meta.versions = versions;

            await DocumentModel.update(id, {
                file_name: target.fileName,
                file_path: target.url,
                file_size: target.size,
                version: newVersion,
                metadata: JSON.stringify(meta)
            });

            return res.json({
                success: true,
                message: `Đã khôi phục về phiên bản ${versionNumber} (tạo version ${newVersion})`
            });
        } catch (error) {
            console.error('restoreVersion error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const deleted = await DocumentModel.softDelete(id);
            if (!deleted) {
                return res.status(404).json({ success: false, message: 'Tài liệu không tồn tại hoặc đã bị xóa' });
            }
            return res.json({
                success: true,
                message: 'Đã chuyển tài liệu vào thùng rác'
            });
        } catch (error) {
            console.error('Delete file error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = FileController;
