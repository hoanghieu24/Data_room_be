const express = require('express');
const router = express.Router();
const FolderController = require('../../controllers/Folder/folderController');

// Route to get all folders
router.get('/', FolderController.getAllFolders);
module.exports = router;