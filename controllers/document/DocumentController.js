const cloudinary = require('cloudinary').v2;
const DocumentModel = require("../../models/DocumentModel/DocumentModel");
const DocumentLogModel = require("../../models/DocumentModel/DocumentLogModel");
const { generateDocumentCode } = require("../../utils/documentUtils");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs").promises;
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { Readable } = require('stream');
const bcrypt = require("bcryptjs");

// Cấu hình Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dzdldby9a',
    api_key: process.env.CLOUDINARY_API_KEY || '548958782672292',
    api_secret: process.env.CLOUDINARY_API_SECRET || '_7CXnsC79ZFpFDmlOxkzwIJsMyE',
    secure: true
});

console.log('🔧 Cloudinary configured with cloud_name:', cloudinary.config().cloud_name);

// Helper lấy IP và User Agent
const getClientInfo = (req) => {
    const ip = req.headers['x-forwarded-for'] ||
        req.headers['x-real-ip'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.ip;

    const cleanIp = ip === '::1' ? '127.0.0.1' : ip?.split(',')[0].trim();

    return {
        ip_address: cleanIp || null,
        user_agent: req.headers['user-agent'] || null
    };
};

// Configure multer for file upload (using memory storage for Cloudinary)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("File type not allowed"), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
}).single("file");

// Multer cho chunk upload
const chunkUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB per chunk
    }
}).single("chunk");

const uploadToCloudinary = async (fileBuffer, originalname, mimetype) => {
    return new Promise((resolve, reject) => {
        const fileExt = path.extname(originalname).toLowerCase();
        let folder = "documents";
        let resourceType = "auto";

        // Determine folder based on file type
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(fileExt)) {
            folder = "documents/images";
            resourceType = "image";
        } else if (['.pdf'].includes(fileExt)) {
            folder = "documents/pdfs";
            resourceType = "raw";
        } else if (['.doc', '.docx'].includes(fileExt)) {
            folder = "documents/word";
            resourceType = "raw";
        } else if (['.xls', '.xlsx'].includes(fileExt)) {
            folder = "documents/excel";
            resourceType = "raw";
        } else {
            folder = "documents/others";
            resourceType = "raw";
        }

        const uploadOptions = {
            folder: folder,
            public_id: `${uuidv4()}`,
            resource_type: resourceType,
            use_filename: false,
            unique_filename: true,
            overwrite: false
        };

        // Upload buffer to Cloudinary
        const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    console.error("Cloudinary upload error:", error);
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        // Convert buffer to stream and pipe to Cloudinary
        const readableStream = new Readable();
        readableStream.push(fileBuffer);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
    });
};

// Class quản lý chunk upload
class ChunkUploadManager {
    constructor() {
        this.tempDir = path.join(process.cwd(), 'uploads', 'temp_chunks');
        this.ensureTempDir();
    }

    ensureTempDir() {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    getChunkDir(uploadId) {
        const chunkDir = path.join(this.tempDir, uploadId);
        if (!fs.existsSync(chunkDir)) {
            fs.mkdirSync(chunkDir, { recursive: true });
        }
        return chunkDir;
    }

    async saveChunk(uploadId, chunkIndex, chunkBuffer) {
        const chunkDir = this.getChunkDir(uploadId);
        const chunkPath = path.join(chunkDir, `chunk_${chunkIndex}`);
        await fs.writeFile(chunkPath, chunkBuffer);
        return true;
    }

    async getUploadedChunks(uploadId) {
        const chunkDir = path.join(this.tempDir, uploadId);
        if (!fs.existsSync(chunkDir)) {
            return [];
        }
        const files = await fs.readdir(chunkDir);
        return files.map(f => parseInt(f.split('_')[1])).sort((a, b) => a - b);
    }

    async mergeChunks(uploadId, totalChunks, fileName, folderId, originalSize, mimeType, metadata = {}) {
        const chunkDir = this.getChunkDir(uploadId);
        const finalFileName = `${Date.now()}_${fileName}`;
        const tempFilePath = path.join(this.tempDir, finalFileName);

        // Tạo file tạm để ghép
        const writeStream = fs.createWriteStream(tempFilePath);

        for (let i = 0; i < totalChunks; i++) {
            const chunkPath = path.join(chunkDir, `chunk_${i}`);
            const chunkData = await fs.readFile(chunkPath);
            writeStream.write(chunkData);
        }

        await new Promise((resolve, reject) => {
            writeStream.end();
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

        // Đọc file đã ghép để upload lên Cloudinary
        const fileBuffer = await fs.readFile(tempFilePath);

        // Upload lên Cloudinary
        const cloudinaryResult = await uploadToCloudinary(fileBuffer, fileName, mimeType);

        // Xóa file tạm và chunks
        await fs.unlink(tempFilePath);
        await fs.rm(chunkDir, { recursive: true, force: true });

        return cloudinaryResult;
    }

    async cleanupOldChunks(maxAgeHours = 24) {
        try {
            const now = Date.now();
            const dirs = await fs.readdir(this.tempDir);

            for (const dir of dirs) {
                const dirPath = path.join(this.tempDir, dir);
                const stat = await fs.stat(dirPath);
                const ageHours = (now - stat.mtimeMs) / (1000 * 60 * 60);

                if (ageHours > maxAgeHours) {
                    await fs.rm(dirPath, { recursive: true, force: true });
                    console.log(`Cleaned up old chunk directory: ${dir}`);
                }
            }
        } catch (error) {
            console.error("Error cleaning up chunks:", error);
        }
    }
}

const chunkManager = new ChunkUploadManager();

// Chạy cleanup mỗi 6 giờ
setInterval(() => {
    chunkManager.cleanupOldChunks(24);
}, 6 * 60 * 60 * 1000);

class DocumentController {
    // Get all documents
    static async getAllDocuments(req, res) {
        try {
            const documents = await DocumentModel.findAll();
            res.json({
                success: true,
                message: "Documents retrieved successfully",
                documents: documents,
                count: documents.length
            });
        } catch (error) {
            console.error("Error getting documents:", error);
            res.status(500).json({
                success: false,
                message: "Error retrieving documents",
                error: error.message
            });
        }
    }

    static async getDocumentById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const userRole = req.user.role_code;

            const accessResult = await DocumentModel.canUserAccess(id, userId, userRole);

            if (!accessResult.canAccess) {
                return res.status(403).json({
                    success: false,
                    message: accessResult.reason || "Bạn không có quyền xem tài liệu này"
                });
            }

            const document = await DocumentModel.findById(id);

            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: "Document not found"
                });
            }

            await DocumentModel.incrementViewCount(id);

            res.json({
                success: true,
                message: "Document retrieved successfully",
                document: document
            });
        } catch (error) {
            console.error("Error getting document:", error);
            res.status(500).json({
                success: false,
                message: "Error retrieving document",
                error: error.message
            });
        }
    }

    static async createDocument(req, res) {
        try {
            console.log("🔥 [CREATE DOCUMENT] API HIT");

            upload(req, res, async (err) => {
                if (err) {
                    console.error("❌ Multer error:", err);
                    return res.status(400).json({
                        success: false,
                        message: "File upload error",
                        error: err.message
                    });
                }

                try {
                    const {
                        name,
                        description,
                        folder_id,
                        access_level = "restricted",
                        access_password,
                        allowed_roles = ["ADMIN"],
                        allowed_users,
                        metadata,
                        tags,
                        is_encrypted = false,
                        expiry_date
                    } = req.body;

                    let access_password_hash = null;
                    if (access_password && String(access_password).trim()) {
                        access_password_hash = await bcrypt.hash(String(access_password).trim(), 10);
                    }

                    // Validate required fields
                    if (!name || !req.file) {
                        console.warn("⚠️ Missing name or file");
                        return res.status(400).json({
                            success: false,
                            message: "Name and file are required"
                        });
                    }

                    // Generate document code
                    const document_code = await generateDocumentCode();

                    // Parse allowed_roles
                    let parsedAllowedRoles = ["ADMIN"];
                    if (allowed_roles) {
                        try {
                            parsedAllowedRoles = Array.isArray(allowed_roles)
                                ? allowed_roles
                                : JSON.parse(allowed_roles);
                        } catch (e) {
                            console.warn("⚠️ allowed_roles parse fail:", allowed_roles);
                        }
                    }

                    let parsedAllowedUsers = null;
                    if (allowed_users) {
                        try {
                            parsedAllowedUsers = Array.isArray(allowed_users)
                                ? allowed_users
                                : JSON.parse(allowed_users);
                        } catch (e) {
                            console.warn("⚠️ allowed_users parse fail");
                        }
                    }

                    let parsedMetadata = null;
                    if (metadata) {
                        try {
                            parsedMetadata = JSON.parse(metadata);
                        } catch (e) {
                            console.warn("⚠️ metadata parse fail");
                        }
                    }

                    let parsedTags = null;
                    if (tags) {
                        try {
                            parsedTags = Array.isArray(tags) ? tags : JSON.parse(tags);
                        } catch (e) {
                            console.warn("⚠️ tags parse fail");
                        }
                    }

                    // Upload to Cloudinary
                    console.log("☁️ Uploading to Cloudinary...");
                    let cloudinaryResult;
                    try {
                        cloudinaryResult = await uploadToCloudinary(
                            req.file.buffer,
                            req.file.originalname,
                            req.file.mimetype
                        );
                        console.log("✅ Cloudinary upload successful");
                    } catch (cloudinaryError) {
                        console.error("❌ Cloudinary upload failed:", cloudinaryError);
                        return res.status(500).json({
                            success: false,
                            message: "Failed to upload file to Cloudinary",
                            error: cloudinaryError.message
                        });
                    }

                    const file_name = req.file.originalname;
                    const file_path = cloudinaryResult.secure_url;
                    const file_size = cloudinaryResult.bytes;
                    const file_type = path.extname(file_name).substring(1).toLowerCase();
                    const mime_type = req.file.mimetype;
                    const uploaded_by = req.user?.id || 1;

                    const documentData = {
                        document_code,
                        folder_id: folder_id || null,
                        name,
                        description: description || null,
                        file_name,
                        file_path,
                        file_size,
                        file_type,
                        mime_type,
                        version: 1,
                        access_level,
                        access_password_hash, // thêm dòng này
                        allowed_roles: JSON.stringify(parsedAllowedRoles),
                        allowed_users: parsedAllowedUsers ? JSON.stringify(parsedAllowedUsers) : null,
                        metadata: JSON.stringify({
                            ...parsedMetadata,
                            cloudinary_public_id: cloudinaryResult.public_id,
                            cloudinary_resource_type: cloudinaryResult.resource_type,
                            cloudinary_url: cloudinaryResult.secure_url,
                            cloudinary_signature: cloudinaryResult.signature
                        }),
                        tags: parsedTags ? JSON.stringify(parsedTags) : null,
                        is_encrypted: is_encrypted ? 1 : 0,
                        expiry_date: expiry_date || null,
                        uploaded_by
                    };

                    const newDocument = await DocumentModel.create(documentData);
                    console.log("✅ Document created successfully:", newDocument.id);

                    // GHI LOG CREATE
                    const clientInfo = getClientInfo(req);
                    await DocumentLogModel.logAction({
                        document_id: newDocument.id,
                        user_id: uploaded_by,
                        action: 'CREATE',
                        ip_address: clientInfo.ip_address,
                        user_agent: clientInfo.user_agent
                    });

                    res.status(201).json({
                        success: true,
                        message: "Document created successfully",
                        document: newDocument
                    });

                } catch (error) {
                    console.error("🔥 CREATE DOCUMENT ERROR:", error);
                    res.status(500).json({
                        success: false,
                        message: "Error creating document",
                        error: error.message
                    });
                }
            });
        } catch (error) {
            console.error("💥 OUTER ERROR:", error);
            res.status(500).json({
                success: false,
                message: "Error creating document",
                error: error.message
            });
        }
    }

    static async updateDocument(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const userId = req.user?.id || 1;
            const clientInfo = getClientInfo(req);

            const existingDocument = await DocumentModel.findById(id);
            if (!existingDocument) {
                return res.status(404).json({
                    success: false,
                    message: "Document not found"
                });
            }

            if (Number(existingDocument.uploaded_by) !== Number(userId)) {
                return res.status(403).json({
                    success: false,
                    message: "Chỉ người upload tài liệu mới có quyền chỉnh sửa"
                });
            }

            if (updateData.allowed_roles) {
                try {
                    const parsedRoles = Array.isArray(updateData.allowed_roles)
                        ? updateData.allowed_roles
                        : JSON.parse(updateData.allowed_roles);
                    updateData.allowed_roles = JSON.stringify(parsedRoles);
                } catch (e) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid allowed_roles format"
                    });
                }
            }

            if (updateData.allowed_users) {
                try {
                    const parsedUsers = Array.isArray(updateData.allowed_users)
                        ? updateData.allowed_users
                        : JSON.parse(updateData.allowed_users);
                    updateData.allowed_users = JSON.stringify(parsedUsers);
                } catch (e) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid allowed_users format"
                    });
                }
            }

            if (updateData.metadata) {
                try {
                    const parsedMetadata = typeof updateData.metadata === "object"
                        ? updateData.metadata
                        : JSON.parse(updateData.metadata);
                    updateData.metadata = JSON.stringify(parsedMetadata);
                } catch (e) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid metadata format"
                    });
                }
            }

            if (updateData.tags) {
                try {
                    const parsedTags = Array.isArray(updateData.tags)
                        ? updateData.tags
                        : JSON.parse(updateData.tags);
                    updateData.tags = JSON.stringify(parsedTags);
                } catch (e) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid tags format"
                    });
                }
            }

            if (updateData.access_password !== undefined) {
                if (String(updateData.access_password).trim() === "") {
                    updateData.access_password_hash = null;
                } else {
                    updateData.access_password_hash = await bcrypt.hash(
                        String(updateData.access_password).trim(),
                        10
                    );
                }
                delete updateData.access_password;
            }

            const updatedDocument = await DocumentModel.update(id, updateData);

            await DocumentLogModel.logAction({
                document_id: id,
                user_id: userId,
                action: "UPDATE",
                ip_address: clientInfo.ip_address,
                user_agent: clientInfo.user_agent
            });

            res.json({
                success: true,
                message: "Document updated successfully",
                document: updatedDocument
            });
        } catch (error) {
            console.error("Error updating document:", error);
            res.status(500).json({
                success: false,
                message: "Error updating document",
                error: error.message
            });
        }
    }

    static async deleteDocument(req, res) {
    try {
        const { id } = req.params;

        const deleted = await DocumentModel.softDelete(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tài liệu hoặc tài liệu đã bị xoá"
            });
        }

        return res.json({
            success: true,
            message: "Xoá tài liệu thành công"
        });
    } catch (error) {
        console.error("Delete document error:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server khi xoá tài liệu"
        });
    }
}

    static async downloadDocument(req, res) {
        try {
            const { id } = req.params;

            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: "Bạn chưa đăng nhập"
                });
            }

            const password = req.headers["x-document-password"] || req.query.password || null;

            const accessResult = await DocumentModel.canUserAccess(
                id,
                req.user.id,
                req.user.role_code,
                password
            );

            if (!accessResult.canAccess) {
                const status =
                    accessResult.code === "NOT_FOUND" ? 404 :
                        accessResult.code === "PASSWORD_REQUIRED" ? 401 :
                            accessResult.code === "UNAUTHORIZED" ? 401 : 403;

                return res.status(status).json({
                    success: false,
                    code: accessResult.code,
                    message: accessResult.reason || "Bạn không có quyền tải tài liệu này"
                });
            }

            const document = await DocumentModel.findById(id);
            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: "Document not found"
                });
            }

            if (document.file_path && document.file_path.includes("cloudinary.com")) {
                let metadata = {};
                if (document.metadata) {
                    metadata = typeof document.metadata === "string"
                        ? JSON.parse(document.metadata)
                        : document.metadata;
                }

                let downloadUrl = document.file_path;

                if (metadata.cloudinary_public_id) {
                    try {
                        downloadUrl = cloudinary.url(metadata.cloudinary_public_id, {
                            resource_type: metadata.cloudinary_resource_type || "raw",
                            flags: "attachment",
                            secure: true
                        });
                    } catch (error) {
                        if (!downloadUrl.includes("fl_attachment")) {
                            downloadUrl = downloadUrl.replace("/upload/", "/upload/fl_attachment/");
                        }
                    }
                } else if (!downloadUrl.includes("fl_attachment")) {
                    downloadUrl = downloadUrl.replace("/upload/", "/upload/fl_attachment/");
                }

                const clientInfo = getClientInfo(req);

                await DocumentLogModel.logAction({
                    document_id: id,
                    user_id: req.user.id,
                    action: "DOWNLOAD",
                    ip_address: clientInfo.ip_address,
                    user_agent: clientInfo.user_agent
                });

                await DocumentModel.incrementDownloadCount(id);

                return res.redirect(downloadUrl);
            }

            const filePath = path.isAbsolute(document.file_path)
                ? document.file_path
                : path.resolve(process.cwd(), document.file_path);

            try {
                await fsPromises.access(filePath);

                const clientInfo = getClientInfo(req);

                await DocumentLogModel.logAction({
                    document_id: id,
                    user_id: req.user.id,
                    action: "DOWNLOAD",
                    ip_address: clientInfo.ip_address,
                    user_agent: clientInfo.user_agent
                });

                await DocumentModel.incrementDownloadCount(id);

                return res.download(filePath, document.file_name);
            } catch (error) {
                return res.status(404).json({
                    success: false,
                    message: "File not found on server"
                });
            }
            console.log("AUTH HEADER:", req.headers.authorization);
            console.log("PASSWORD HEADER:", req.headers["x-document-password"]);
        } catch (error) {
            console.error("Download error:", error);
            return res.status(500).json({
                success: false,
                message: "Error downloading document",
                error: error.message
            });
        }
    }

    static async viewDocument(req, res) {
        try {
            const { id } = req.params;
            const password = req.headers["x-document-password"] || req.query.password || null;
            const userId = req.user?.id || null;
            const clientInfo = getClientInfo(req);

            const accessResult = await DocumentModel.canUserAccess(
                id,
                userId,
                req.user?.role_code,
                password
            );

            if (!accessResult.canAccess) {
                const status =
                    accessResult.code === "NOT_FOUND" ? 404 :
                        accessResult.code === "PASSWORD_REQUIRED" ? 401 :
                            accessResult.code === "UNAUTHORIZED" ? 401 : 403;

                return res.status(status).json({
                    success: false,
                    code: accessResult.code,
                    message: accessResult.reason
                });
            }

            const document = accessResult.document;

            await DocumentLogModel.logAction({
                document_id: id,
                user_id: userId,
                action: "VIEW",
                ip_address: clientInfo.ip_address,
                user_agent: clientInfo.user_agent
            });

            await DocumentModel.incrementViewCount(id);

            res.json({
                success: true,
                message: "Document ready for preview",
                document: {
                    id: document.id,
                    name: document.name,
                    file_name: document.file_name,
                    file_type: document.file_type,
                    mime_type: document.mime_type,
                    file_size: document.file_size,
                    file_path: document.file_path,
                    is_cloudinary: document.file_path?.includes("cloudinary.com") || false,
                    preview_url: `/api/documents/${id}/preview-file`
                }
            });
        } catch (error) {
            console.error("Error viewing document:", error);
            res.status(500).json({
                success: false,
                message: "Error viewing document",
                error: error.message
            });
        }
    }

    static async previewDocumentFile(req, res) {
        try {
            const { id } = req.params;
            const password = req.headers["x-document-password"] || req.query.password || null;

            const accessResult = await DocumentModel.canUserAccess(
                id,
                req.user?.id,
                req.user?.role_code,
                password
            );

            if (!accessResult.canAccess) {
                const status =
                    accessResult.code === "NOT_FOUND" ? 404 :
                        accessResult.code === "PASSWORD_REQUIRED" ? 401 :
                            accessResult.code === "UNAUTHORIZED" ? 401 : 403;

                return res.status(status).json({
                    success: false,
                    code: accessResult.code,
                    message: accessResult.reason
                });
            }

            const document = accessResult.document;

            if (document.file_path && document.file_path.includes("cloudinary.com")) {
                if (["jpg", "jpeg", "png", "gif", "webp", "pdf"].includes(document.file_type)) {
                    return res.redirect(document.file_path);
                }

                return res.json({
                    preview_url: document.file_path,
                    file_type: document.file_type,
                    mime_type: document.mime_type
                });
            }

            const filePath = path.isAbsolute(document.file_path)
                ? document.file_path
                : path.resolve(process.cwd(), document.file_path);

            try {
                await fsPromises.access(filePath);
            } catch (error) {
                return res.status(404).send("File not found");
            }

            res.setHeader("Content-Type", document.mime_type);
            res.setHeader("Content-Disposition", `inline; filename="${document.file_name}"`);
            res.sendFile(filePath);
        } catch (error) {
            console.error("Error previewing document:", error);
            res.status(500).send("Error previewing document");
        }
    }


    static async getDocumentHistory(req, res) {
        try {
            const { id } = req.params;
            const { limit = 50 } = req.query;

            const document = await DocumentModel.findById(id);
            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: "Document not found"
                });
            }

            const logs = await DocumentLogModel.getDocumentHistory(id, parseInt(limit));

            res.json({
                success: true,
                message: "Document history retrieved successfully",
                document: {
                    id: document.id,
                    name: document.name,
                    document_code: document.document_code
                },
                logs: logs,
                count: logs.length
            });
        } catch (error) {
            console.error("Error getting document history:", error);
            res.status(500).json({
                success: false,
                message: "Error retrieving document history",
                error: error.message
            });
        }
    }

    static async getAllLogs(req, res) {
        try {
            const { limit = 100, action, userId } = req.query;

            let logs;
            if (action) {
                logs = await DocumentLogModel.getLogsByAction(action, parseInt(limit));
            } else if (userId) {
                logs = await DocumentLogModel.getLogsByUser(userId, parseInt(limit));
            } else {
                logs = await DocumentLogModel.getRecentLogs(parseInt(limit));
            }

            res.json({
                success: true,
                message: "Logs retrieved successfully",
                logs: logs,
                count: logs.length
            });
        } catch (error) {
            console.error("Error getting logs:", error);
            res.status(500).json({
                success: false,
                message: "Error retrieving logs",
                error: error.message
            });
        }
    }

    static async getLogStatistics(req, res) {
        try {
            const stats = await DocumentLogModel.getLogStatistics();

            res.json({
                success: true,
                message: "Log statistics retrieved successfully",
                statistics: stats
            });
        } catch (error) {
            console.error("Error getting log statistics:", error);
            res.status(500).json({
                success: false,
                message: "Error retrieving log statistics",
                error: error.message
            });
        }
    }

    static async searchDocuments(req, res) {
        try {
            const {
                searchTerm,
                fileType,
                accessLevel,
                folderId,
                isActive = 1,
                page = 1,
                limit = 20
            } = req.query;

            const searchParams = {
                searchTerm,
                fileType,
                accessLevel,
                folderId,
                isActive: isActive === 'false' ? 0 : 1
            };

            const documents = await DocumentModel.search(searchParams);

            const total = documents.length;
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const paginatedDocuments = documents.slice(startIndex, endIndex);

            res.json({
                success: true,
                message: "Documents retrieved successfully",
                documents: paginatedDocuments,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: endIndex < total,
                    hasPrevPage: startIndex > 0
                }
            });
        } catch (error) {
            console.error("Error searching documents:", error);
            res.status(500).json({
                success: false,
                message: "Error searching documents",
                error: error.message
            });
        }
    }

    static async getDocumentStatistics(req, res) {
        try {
            const statistics = await DocumentModel.getStatistics();

            res.json({
                success: true,
                message: "Statistics retrieved successfully",
                statistics: statistics
            });
        } catch (error) {
            console.error("Error getting statistics:", error);
            res.status(500).json({
                success: false,
                message: "Error retrieving statistics",
                error: error.message
            });
        }
    }

    static async toggleDocumentStatus(req, res) {
        try {
            const { id } = req.params;
            const { is_active } = req.body;
            const userId = req.user?.id || 1;
            const clientInfo = getClientInfo(req);

            if (is_active === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "is_active field is required"
                });
            }
            if (Number(existingDocument.uploaded_by) !== Number(userId)) {
                return res.status(403).json({
                    success: false,
                    message: "Chỉ người upload tài liệu mới có quyền thay đổi trạng thái"
                });
            }

            const existingDocument = await DocumentModel.findById(id);
            if (!existingDocument) {
                return res.status(404).json({
                    success: false,
                    message: "Document not found"
                });
            }

            const updatedDocument = await DocumentModel.update(id, { is_active });

            await DocumentLogModel.logAction({
                document_id: id,
                user_id: userId,
                action: is_active ? 'ACTIVATE' : 'DEACTIVATE',
                ip_address: clientInfo.ip_address,
                user_agent: clientInfo.user_agent
            });

            res.json({
                success: true,
                message: `Document ${is_active ? 'activated' : 'deactivated'} successfully`,
                document: updatedDocument
            });
        } catch (error) {
            console.error("Error toggling document status:", error);
            res.status(500).json({
                success: false,
                message: "Error updating document status",
                error: error.message
            });
        }
    }

    static async getRecentDocuments(req, res) {
        try {
            const { limit = 10 } = req.query;
            const documents = await DocumentModel.getRecent(parseInt(limit));

            res.json({
                success: true,
                message: "Recent documents retrieved successfully",
                documents: documents,
                count: documents.length
            });
        } catch (error) {
            console.error("Error getting recent documents:", error);
            res.status(500).json({
                success: false,
                message: "Error retrieving recent documents",
                error: error.message
            });
        }
    }

    static async getDocumentsByFolder(req, res) {
        try {
            const { folderId } = req.params;

            if (!folderId) {
                return res.status(400).json({
                    success: false,
                    message: "Folder ID is required"
                });
            }

            const documents = await DocumentModel.findByFolderId(folderId);

            res.json({
                success: true,
                message: "Documents retrieved successfully",
                documents: documents,
                count: documents.length
            });
        } catch (error) {
            console.error("Error getting documents by folder:", error);
            res.status(500).json({
                success: false,
                message: "Error retrieving documents",
                error: error.message
            });
        }
    }

    static async getDocumentsByUser(req, res) {
        try {
            const { userId } = req.params;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: "User ID is required"
                });
            }

            const documents = await DocumentModel.findByUploadedBy(userId);

            res.json({
                success: true,
                message: "Documents retrieved successfully",
                documents: documents,
                count: documents.length
            });
        } catch (error) {
            console.error("Error getting documents by user:", error);
            res.status(500).json({
                success: false,
                message: "Error retrieving documents",
                error: error.message
            });
        }
    }
    static async uploadChunk(req, res) {
        console.log("📦 [UPLOAD CHUNK] API HIT");

        // Gọi multer trực tiếp
        chunkUpload(req, res, async (err) => {
            if (err) {
                console.error("❌ Multer error:", err);
                return res.status(400).json({
                    success: false,
                    message: "Chunk upload error",
                    error: err.message
                });
            }

            try {
                const {
                    chunkIndex,
                    totalChunks,
                    uploadId,
                    fileName,
                    folderId,
                    totalSize,
                    fileType
                } = req.body;

                console.log(`📦 Chunk ${parseInt(chunkIndex) + 1}/${totalChunks} received`);

                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: "No chunk file received"
                    });
                }

                if (!uploadId || chunkIndex === undefined || !totalChunks) {
                    return res.status(400).json({
                        success: false,
                        message: "Missing required fields: uploadId, chunkIndex, totalChunks"
                    });
                }

                await chunkManager.saveChunk(
                    uploadId,
                    parseInt(chunkIndex),
                    req.file.buffer
                );

                const uploadedChunks = await chunkManager.getUploadedChunks(uploadId);

                if (uploadedChunks.length === parseInt(totalChunks)) {
                    console.log("✅ All chunks received, merging...");

                    const cloudinaryResult = await chunkManager.mergeChunks(
                        uploadId,
                        parseInt(totalChunks),
                        fileName,
                        folderId,
                        parseInt(totalSize),
                        fileType
                    );

                    const documentCode = await generateDocumentCode();
                    const uploadedBy = req.user?.id || 1;

                    let allowedRoles = ["ADMIN"];
                    if (req.body.allowed_roles) {
                        try {
                            allowedRoles = JSON.parse(req.body.allowed_roles);
                            if (!Array.isArray(allowedRoles)) allowedRoles = ["ADMIN"];
                        } catch (e) {
                            allowedRoles = ["ADMIN"];
                        }
                    }

                    const documentData = {
                        document_code: documentCode,
                        folder_id: folderId || null,
                        name: req.body.name || fileName.replace(/\.[^/.]+$/, ""),
                        description: req.body.description || null,
                        file_name: fileName,
                        file_path: cloudinaryResult.secure_url,
                        file_size: parseInt(totalSize),
                        file_type: path.extname(fileName).substring(1).toLowerCase(),
                        mime_type: fileType,
                        version: 1,
                        access_level: req.body.access_level || "restricted",
                        allowed_roles: JSON.stringify(allowedRoles),
                        allowed_users: null,
                        metadata: JSON.stringify({
                            cloudinary_public_id: cloudinaryResult.public_id,
                            cloudinary_resource_type: cloudinaryResult.resource_type,
                            cloudinary_url: cloudinaryResult.secure_url,
                            cloudinary_signature: cloudinaryResult.signature,
                            upload_method: "chunked",
                            chunk_total: parseInt(totalChunks)
                        }),
                        tags: null,
                        is_encrypted: req.body.is_encrypted === 'true' ? 1 : 0,
                        expiry_date: req.body.expiry_date || null,
                        uploaded_by: uploadedBy
                    };

                    const newDocument = await DocumentModel.create(documentData);

                    const clientInfo = getClientInfo(req);
                    await DocumentLogModel.logAction({
                        document_id: newDocument.id,
                        user_id: uploadedBy,
                        action: 'CREATE',
                        ip_address: clientInfo.ip_address,
                        user_agent: clientInfo.user_agent
                    });

                    console.log("✅ Document created successfully from chunks:", newDocument.id);

                    return res.json({
                        success: true,
                        message: "File uploaded successfully",
                        data: {
                            id: newDocument.id,
                            name: newDocument.name,
                            file_size: newDocument.file_size,
                            file_type: newDocument.file_type,
                            document_code: newDocument.document_code
                        }
                    });
                }

                res.json({
                    success: true,
                    message: `Chunk ${parseInt(chunkIndex) + 1}/${totalChunks} uploaded`,
                    uploaded: true,
                    received: uploadedChunks.length,
                    total: parseInt(totalChunks)
                });

            } catch (error) {
                console.error("🔥 Upload chunk error:", error);
                res.status(500).json({
                    success: false,
                    message: "Error processing chunk",
                    error: error.message
                });
            }
        });
    }

    static async resumeUpload(req, res) {
        try {
            const { uploadId } = req.params;

            if (!uploadId) {
                return res.status(400).json({
                    success: false,
                    message: "Upload ID is required"
                });
            }

            const uploadedChunks = await chunkManager.getUploadedChunks(uploadId);

            res.json({
                success: true,
                uploadedChunks: uploadedChunks,
                totalChunks: null,
                uploadId: uploadId
            });
        } catch (error) {
            console.error("Error resuming upload:", error);
            res.status(500).json({
                success: false,
                message: "Error checking upload status",
                error: error.message
            });
        }
    }

    static async cancelUpload(req, res) {
        try {
            const { uploadId } = req.params;

            if (!uploadId) {
                return res.status(400).json({
                    success: false,
                    message: "Upload ID is required"
                });
            }

            const chunkDir = path.join(chunkManager.tempDir, uploadId);
            try {
                await fs.access(chunkDir);
                await fs.rm(chunkDir, { recursive: true, force: true });
                console.log(`🗑️ Cancelled upload: ${uploadId}`);
            } catch (e) {
                console.log(`No chunks found for upload: ${uploadId}`);
            }

            res.json({
                success: true,
                message: "Upload cancelled successfully"
            });
        } catch (error) {
            console.error("Error cancelling upload:", error);
            res.status(500).json({
                success: false,
                message: "Error cancelling upload",
                error: error.message
            });
        }
    }

    static async checkUploadStatus(req, res) {
        try {
            const { uploadId } = req.params;

            if (!uploadId) {
                return res.status(400).json({
                    success: false,
                    message: "Upload ID is required"
                });
            }

            const uploadedChunks = await chunkManager.getUploadedChunks(uploadId);

            res.json({
                success: true,
                uploadId: uploadId,
                uploadedChunks: uploadedChunks,
                uploadedCount: uploadedChunks.length
            });
        } catch (error) {
            console.error("Error checking upload status:", error);
            res.status(500).json({
                success: false,
                message: "Error checking upload status",
                error: error.message
            });
        }
    }
}

module.exports = DocumentController;