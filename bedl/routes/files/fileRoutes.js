const express = require('express');
const router = express.Router();
const multer = require('multer');
const FileController = require('../../controllers/File/fileController');
const { authenticate, authorize, optionalAuthenticate } = require('../../middlewares/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }
});

router.post('/upload', optionalAuthenticate, upload.single('file'), FileController.upload);
router.post('/chunk/init', optionalAuthenticate, FileController.initChunkUpload);
router.post('/chunk/upload', optionalAuthenticate, upload.single('chunk'), FileController.uploadChunk);
router.post('/chunk/complete', optionalAuthenticate, FileController.completeChunkUpload);

router.get('/:id/preview', optionalAuthenticate, FileController.preview);
router.get('/:id/raw', optionalAuthenticate, FileController.getRawStream);
router.get('/:id/download', optionalAuthenticate, FileController.download);
router.put('/:id/rename', optionalAuthenticate, FileController.rename);
router.put('/:id/move', optionalAuthenticate, FileController.move);
router.post('/:id/lock', optionalAuthenticate, FileController.lock);
router.post('/:id/unlock', optionalAuthenticate, FileController.unlock);
router.post('/:id/password', authenticate, FileController.setPassword);
router.get('/:id/versions', optionalAuthenticate, FileController.getVersions);
router.post('/:id/version', optionalAuthenticate, upload.single('file'), FileController.uploadVersion);
router.post('/:id/restore-version', optionalAuthenticate, FileController.restoreVersion);
router.delete('/:id', optionalAuthenticate, FileController.delete);

module.exports = router;
