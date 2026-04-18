
const bcrypt = require("bcryptjs");
const UserModel = require("../../models/user/userModel");
const dto = require("../../dto/User/userUpdateDto");
const dtocreate = require("../../dto/User/userCreateDto");

class UserService {


    static async getProfile(userId) {
        const user = await UserModel.findPublicById(userId);
        if (!user) throw new Error("User không tồn tại");
        return user;
    }

    static async getAdminProfile(userId) {
        const user = await UserModel.findAdminById(userId);
        if (!user) throw new Error("User không tồn tại");
        return user;
    }


    static async changePassword(userId, oldPassword, newPassword) {
        const user = await UserModel.findById(userId); 
        if (!user) throw new Error("User không tồn tại");

        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) throw new Error("Mật khẩu cũ không đúng");

        const newHash = await bcrypt.hash(newPassword, 10);
        return await UserModel.updatePassword(userId, newHash);
    }

    static async updateStatus(userId, status) {
        return await UserModel.updateStatus(userId, status);
    }

    static async findPublicById(id) {
        return await UserModel.findPublicById(id);
    }

    static async findAdminProfileById(id) {
        return await UserModel.findAdminById(id);
    }

    static async deleteById(id) {
        return await UserModel.deleteById(id);
    }

    static async deleteByIds(ids) {
        return await UserModel.deleteByIds(ids);
    }

    static async getAllUsers() {
        return await UserModel.findAll();
    }

    static async updateUser(id, dto) {
        return await UserModel.updateUser(id, dto);
    }

    static async updateProfile(userId, profileData) {
        return await UserModel.updateProfile(userId, profileData);
    }

}

module.exports = UserService;
