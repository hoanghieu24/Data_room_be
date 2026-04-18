const db = require("../../db")

class FolderModel {
    static async findAll(){
        const results = await db.query(
            `SELECT id, name, created_at AS "createdAt", updated_at AS "updatedAt"
            FROM folders
            ORDER BY created_at`

        )
    }

     static async findAllforDocument(){
        const [rows] = await db.query(
        `SELECT id , name 
         FROM folders
         ORDER BY created_at`
    );
    return rows; 
    }
}

module.exports = FolderModel;