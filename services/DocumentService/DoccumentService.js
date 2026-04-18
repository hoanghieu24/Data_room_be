const DocumentModel = require("../models/DocumentModel");
const { generateDocumentCode, validateFileType, getFileExtension } = require("../utils/documentUtils");
const fs = require("fs").promises;
const path = require("path");

class DocumentService {
    // Get all documents
    static async getAllDocuments() {
        try {
            const documents = await DocumentModel.findAll();
            return {
                success: true,
                data: documents,
                message: "Documents retrieved successfully"
            };
        } catch (error) {
            console.error("Service error in getAllDocuments:", error);
            throw new Error("Failed to retrieve documents");
        }
    }

    // Get document by ID
    static async getDocumentById(id) {
        try {
            const document = await DocumentModel.findById(id);
            if (!document) {
                return {
                    success: false,
                    message: "Document not found"
                };
            }
            return {
                success: true,
                data: document,
                message: "Document retrieved successfully"
            };
        } catch (error) {
            console.error("Service error in getDocumentById:", error);
            throw new Error("Failed to retrieve document");
        }
    }

    // Create new document
    static async createDocument(documentData, file) {
        try {
            // Validate required fields
            if (!documentData.name || !file) {
                return {
                    success: false,
                    message: "Name and file are required"
                };
            }

            // Validate file type
            if (!validateFileType(file.mimetype)) {
                return {
                    success: false,
                    message: "Invalid file type"
                };
            }

            // Generate document code
            const documentCode = await generateDocumentCode();

            // Prepare document data
            const newDocumentData = {
                document_code: documentCode,
                name: documentData.name,
                description: documentData.description,
                folder_id: documentData.folder_id,
                file_name: file.originalname,
                file_path: file.path,
                file_size: file.size,
                file_type: getFileExtension(file.mimetype),
                mime_type: file.mimetype,
                access_level: documentData.access_level || 'restricted',
                allowed_roles: documentData.allowed_roles || ['ADMIN'],
                allowed_users: documentData.allowed_users,
                metadata: documentData.metadata,
                tags: documentData.tags,
                is_encrypted: documentData.is_encrypted || false,
                expiry_date: documentData.expiry_date,
                uploaded_by: documentData.uploaded_by || 1
            };

            // Create document
            const document = await DocumentModel.create(newDocumentData);

            return {
                success: true,
                data: document,
                message: "Document created successfully"
            };
        } catch (error) {
            console.error("Service error in createDocument:", error);
            // Clean up uploaded file if error occurs
            if (file && file.path) {
                await fs.unlink(file.path).catch(console.error);
            }
            throw new Error("Failed to create document");
        }
    }

    // Update document
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

        if (Number(existingDocument.uploaded_by) !== Number(userId) && req.user?.role_code !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền chỉnh sửa tài liệu này"
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

    // Delete document
    static async deleteDocument(id) {
        try {
            // Check if document exists
            const existingDocument = await DocumentModel.findById(id);
            if (!existingDocument) {
                return {
                    success: false,
                    message: "Document not found"
                };
            }

            // Delete document (soft delete)
            const deleted = await DocumentModel.delete(id);

            if (deleted) {
                return {
                    success: true,
                    message: "Document deleted successfully"
                };
            } else {
                return {
                    success: false,
                    message: "Failed to delete document"
                };
            }
        } catch (error) {
            console.error("Service error in deleteDocument:", error);
            throw new Error("Failed to delete document");
        }
    }

    // Download document
    static async downloadDocument(req, res) {
    try {
        const { id } = req.params;
        const password = req.headers["x-document-password"] || req.query.password || null;

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Bạn chưa đăng nhập"
            });
        }

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
                message: accessResult.reason
            });
        }

        const document = accessResult.document;

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

    } catch (error) {
        console.error("Download error:", error);
        res.status(500).json({
            success: false,
            message: "Error downloading document",
            error: error.message
        });
    }
}

    // Search documents
    static async searchDocuments(searchParams) {
        try {
            const documents = await DocumentModel.search(searchParams);
            
            return {
                success: true,
                data: documents,
                message: "Documents retrieved successfully"
            };
        } catch (error) {
            console.error("Service error in searchDocuments:", error);
            throw new Error("Failed to search documents");
        }
    }

    // Get document statistics
    static async getDocumentStatistics() {
        try {
            const statistics = await DocumentModel.getStatistics();
            
            return {
                success: true,
                data: statistics,
                message: "Statistics retrieved successfully"
            };
        } catch (error) {
            console.error("Service error in getDocumentStatistics:", error);
            throw new Error("Failed to retrieve statistics");
        }
    }

    // Toggle document status
    static async toggleDocumentStatus(id, isActive) {
        try {
            // Check if document exists
            const existingDocument = await DocumentModel.findById(id);
            if (!existingDocument) {
                return {
                    success: false,
                    message: "Document not found"
                };
            }

            // Update status
            const updatedDocument = await DocumentModel.update(id, { is_active: isActive });

            return {
                success: true,
                data: updatedDocument,
                message: `Document ${isActive ? 'activated' : 'deactivated'} successfully`
            };
        } catch (error) {
            console.error("Service error in toggleDocumentStatus:", error);
            throw new Error("Failed to update document status");
        }
    }

    // Get recent documents
    static async getRecentDocuments(limit = 10) {
        try {
            const documents = await DocumentModel.getRecent(limit);
            
            return {
                success: true,
                data: documents,
                message: "Recent documents retrieved successfully"
            };
        } catch (error) {
            console.error("Service error in getRecentDocuments:", error);
            throw new Error("Failed to retrieve recent documents");
        }
    }

    // Get documents by folder
    static async getDocumentsByFolder(folderId) {
        try {
            const documents = await DocumentModel.findByFolderId(folderId);
            
            return {
                success: true,
                data: documents,
                message: "Documents retrieved successfully"
            };
        } catch (error) {
            console.error("Service error in getDocumentsByFolder:", error);
            throw new Error("Failed to retrieve documents by folder");
        }
    }

    // Check document access
    static async checkDocumentAccess(documentId, user) {
        try {
            const document = await DocumentModel.findById(documentId);
            if (!document) {
                return false;
            }

            // If document is public
            if (document.access_level === 'public') {
                return true;
            }

            // If no user
            if (!user) {
                return false;
            }

            // If document is private
            if (document.access_level === 'private') {
                return user.id === document.uploaded_by || user.role_code === 'ADMIN';
            }

            // If document is restricted
            if (document.access_level === 'restricted') {
                if (!document.allowed_roles || document.allowed_roles.length === 0) {
                    return false;
                }

                const allowedRoles = Array.isArray(document.allowed_roles)
                    ? document.allowed_roles
                    : JSON.parse(document.allowed_roles || '[]');

                if (allowedRoles.includes(user.role_code)) {
                    return true;
                }

                // Check allowed users
                if (document.allowed_users) {
                    const allowedUsers = Array.isArray(document.allowed_users)
                        ? document.allowed_users
                        : JSON.parse(document.allowed_users || '[]');
                    
                    if (allowedUsers.includes(user.id)) {
                        return true;
                    }
                }

                return false;
            }

            return false;
        } catch (error) {
            console.error("Service error in checkDocumentAccess:", error);
            return false;
        }
    }
}

module.exports = DocumentService;