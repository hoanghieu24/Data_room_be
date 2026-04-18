const bcrypt = require("bcryptjs");
const RoleModel = require("../../models/role/roleModel");
const dto = require("../../dto/User/userUpdateDto");
const dtocreate = require("../../dto/User/userCreateDto");

class RoleService {
    static async getAllRoles() {
        return await RoleModel.getAllRoles();
    }
}

module.exports = RoleService;