const Folder = require('../../models/FolderModel/folderModel');

class FolderServices {
    static async getAllFolders() {
         return await Folder.findAllforDocument();
    }
}

module.exports = FolderServices