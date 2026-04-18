const bcrypt = require("bcryptjs");
const StaffModel = require("../../models/StaffManager/StaffModel");
const dto = require("../../dto/staff/StaffCreateDTO");
const dtoUpdate = require("../../dto/staff/staffUpdateDto");

class StaffServices {
    static async getAllStaff() {
        return await StaffModel.getAllStaff();
    }
    static async createStaff(dto) {
        return await StaffModel.createStaff(dto);
    }
    static async updateStaff(dtoUpdate) {
        console.log("DTO in Service:", dtoUpdate);
        return await StaffModel.updateStaff(dtoUpdate.id, dtoUpdate);
    }
    static async deleteStaff(staffId) {
        return await StaffModel.deleteStaff(staffId);
    }
    static async deleteStaffs(staffIds) {
        return await StaffModel.deleteStaffs(staffIds);
    }
}

module.exports = StaffServices;