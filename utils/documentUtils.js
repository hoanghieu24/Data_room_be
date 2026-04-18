const crypto = require("crypto");

// Generate unique document code
const generateDocumentCode = async () => {
    const timestamp = Date.now().toString(36);
    const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `DOC-${timestamp}-${randomStr}`;
};

// Validate file type
const validateFileType = (mimeType) => {
    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif'
    ];
    return allowedTypes.includes(mimeType);
};

// Get file extension from mime type
const getFileExtension = (mimeType) => {
    const extensions = {
        'application/pdf': 'pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/msword': 'doc',
        'text/plain': 'txt',
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif'
    };
    return extensions[mimeType] || 'bin';
};

// Format file size
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Check if document is expired
const isDocumentExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
};

// Generate document metadata
const generateDocumentMetadata = (filePath, originalName) => {
    const stats = require("fs").statSync(filePath);
    return {
        originalName,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        inode: stats.ino,
        device: stats.dev
    };
};

module.exports = {
    generateDocumentCode,
    validateFileType,
    getFileExtension,
    formatFileSize,
    isDocumentExpired,
    generateDocumentMetadata
};