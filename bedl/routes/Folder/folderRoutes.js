const express = require('express');
const router = express.Router();
const FolderController = require('../../controllers/Folder/folderController');
const { authenticate, authorize, optionalAuthenticate } = require('../../middlewares/authMiddleware');

// Tree, Dashboard, Contents
router.get('/tree', optionalAuthenticate, FolderController.getTree);
router.get('/dashboard', optionalAuthenticate, FolderController.getDashboard);
router.get('/contents', optionalAuthenticate, FolderController.getContents);
router.get('/:id/contents', optionalAuthenticate, FolderController.getContents);
router.get('/:id/impact', optionalAuthenticate, FolderController.getImpact);
router.get('/full-overview', optionalAuthenticate, FolderController.getFullOverview);

// All folders list
router.get('/', optionalAuthenticate, FolderController.getAllFolders);

// Operations: Create, Rename, Move, Delete
router.post('/', authenticate, authorize('ADMIN', 'STAFF'), FolderController.createFolder);
router.put('/:id/rename', authenticate, authorize('ADMIN', 'STAFF'), FolderController.renameFolder);
router.put('/:id/move', authenticate, authorize('ADMIN', 'STAFF'), FolderController.moveFolder);
router.delete('/:id', authenticate, authorize('ADMIN'), FolderController.deleteFolder);

module.exports = router;
