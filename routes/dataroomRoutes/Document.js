const express = require("express");
const router = express.Router();
const DocumentController = require("../../controllers/document/DocumentController");
const { authenticate, authorize } = require("../../middlewares/authMiddleware");

// Public
router.get("/", DocumentController.getAllDocuments);

// Protected
router.use(authenticate);

router.get("/:id/download", DocumentController.downloadDocument);
router.get("/:id/view", DocumentController.viewDocument);
router.get("/:id/preview-file", DocumentController.previewDocumentFile);

router.post("/upload-chunk", authorize("ADMIN", "STAFF"), DocumentController.uploadChunk);
router.get("/resume-upload/:uploadId", authorize("ADMIN", "STAFF"), DocumentController.resumeUpload);
router.delete("/cancel-upload/:uploadId", authorize("ADMIN", "STAFF"), DocumentController.cancelUpload);
router.get("/upload-status/:uploadId", authorize("ADMIN", "STAFF"), DocumentController.checkUploadStatus);

router.post("/", authorize("ADMIN", "STAFF"), DocumentController.createDocument);
router.get("/folder/:folderId", DocumentController.getDocumentsByFolder);
router.get("/user/:userId", authorize("ADMIN"), DocumentController.getDocumentsByUser);

router.get("/:id", DocumentController.getDocumentById);
router.put("/:id", authorize("ADMIN", "STAFF"), DocumentController.updateDocument);
router.delete("/:id", authorize("ADMIN","STAFF"), DocumentController.deleteDocument);
router.get("/:id/history", DocumentController.getDocumentHistory);
router.get("/logs/all", authorize("ADMIN"), DocumentController.getAllLogs);
router.get("/logs/statistics", authorize("ADMIN"), DocumentController.getLogStatistics);

module.exports = router;