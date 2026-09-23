const express = require('express');
const router = express.Router();
const multer = require('multer');
const DmsController = require('../../controllers/document/DmsController');
const DocumentController = require('../../controllers/document/DocumentController');
const { authenticate, authorize } = require('../../middlewares/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Yêu cầu xác thực với tất cả thao tác tài liệu
router.use(authenticate);

// Thống kê dashboard
router.get('/dashboard-stats', DmsController.getDashboardStats);

// Legacy chunk upload routes (Data Room v2 backward compatibility)
router.post('/upload-chunk', authorize('ADMIN', 'STAFF'), DocumentController.uploadChunk);
router.get('/resume-upload/:uploadId', authorize('ADMIN', 'STAFF'), DocumentController.resumeUpload);
router.delete('/cancel-upload/:uploadId', authorize('ADMIN', 'STAFF'), DocumentController.cancelUpload);
router.get('/upload-status/:uploadId', authorize('ADMIN', 'STAFF'), DocumentController.checkUploadStatus);

// Legacy folder & user documents
router.get('/folder/:folderId', DocumentController.getDocumentsByFolder);
router.get('/user/:userId', authorize('ADMIN'), DocumentController.getDocumentsByUser);
router.get('/logs/all', authorize('ADMIN'), DocumentController.getAllLogs);
router.get('/logs/statistics', authorize('ADMIN'), DocumentController.getLogStatistics);

// DMS Core APIs
router.get('/', DmsController.getDocuments);
router.post('/', upload.single('file'), DmsController.createDocument);

// File access & security
router.get('/:id/file', DmsController.streamFile);
router.get('/:id/preview-file', DmsController.streamFile);
router.get('/:id/view', DmsController.streamFile);
router.get('/:id/download', DmsController.downloadFile);
router.post('/:id/print', DmsController.logPrint);

// Versions
router.get('/:id/versions', DmsController.getVersions);
router.post('/:id/versions', upload.single('file'), DmsController.uploadVersion);

// Permissions
router.get('/:id/permissions', DmsController.getPermissions);
router.post('/:id/permissions', DmsController.setPermission);
router.delete('/:id/permissions/:permissionId', DmsController.removePermission);

// Single Document CRUD
router.get('/:id', DmsController.getDocumentById);
router.put('/:id', DmsController.updateDocument);
router.delete('/:id', DmsController.deleteDocument);

module.exports = router;