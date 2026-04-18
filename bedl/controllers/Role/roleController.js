const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const RoleService = require("../../services/Role/roleService");

exports.getAllRoles = async (req, res) => {
    try {
        const roles = await RoleService.getAllRoles();
        return res.json({
            msg: "Danh sách role",
            total: roles.length,
            roles
        });
    } catch (error) {
        console.error("getAllRoles error:", error);
        return res.status(500).json({
            msg: "Lỗi server"
        });
    }
};