const folderServices = require('../../services/Folder/folderServices');
class FolderController {
    static async getAllFolders(req, res) {
        try {
            const folders = await folderServices.getAllFolders();
            res.status(200).json({
                success: true,
                total: folders?.length || 0,
                data: folders || []
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async createFolder(req, res) {
        try {
            const { name } = req.body;
            const newFolder = await folderServices.createFolder(name);
            res.status(201).json({
                success: true
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}
module.exports = FolderController;