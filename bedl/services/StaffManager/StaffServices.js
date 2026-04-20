const StaffModel = require("../../models/StaffManager/StaffModel");
const StaffCreateDTO = require("../../dto/staff/staffCreateDto");
const StaffUpdateDTO = require("../../dto/staff/staffUpdateDto");

class StaffServices {
  static async getAllStaff() {
    return await StaffModel.getAllStaff();
  }

  static async createStaff(data) {
    const dto = data instanceof StaffCreateDTO ? data : new StaffCreateDTO(data);
    return await StaffModel.createStaff(dto);
  }

  static async updateStaff(data) {
    const dto = data instanceof StaffUpdateDTO ? data : new StaffUpdateDTO(data);
    return await StaffModel.updateStaff(dto.id, dto);
  }

  static async deleteStaff(staffId) {
    return await StaffModel.deleteStaff(staffId);
  }

  static async deleteStaffs(staffIds) {
    return await StaffModel.deleteStaffs(staffIds);
  }
}

module.exports = StaffServices;
