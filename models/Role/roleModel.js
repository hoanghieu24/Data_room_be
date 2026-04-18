const db = require("../../db");

class RoleModel {
    static async getAllRoles() {
        
        const [rows] = await db.query("SELECT * FROM roles");
        
        return rows.map(r => ({
            ...r,
            role_code: r.role_code,
        }));
    }
}

module.exports = RoleModel;