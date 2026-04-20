const StaffService = require("../../services/StaffManager/StaffServices");
const StaffCreateDTO = require("../../dto/staff/staffCreateDto");
const StaffUpdateDTO = require("../../dto/staff/staffUpdateDto");

/**
 * GET ALL STAFF
 */
exports.getAllStaff = async (req, res) => {
  try {
    const staffs = await StaffService.getAllStaff();
    return res.status(200).json({
      success: true,
      msg: "Lấy danh sách nhân viên thành công",
      total: staffs.length,
      data: staffs,
    });
  } catch (err) {
    console.error("getAllStaff error:", err);
    return res.status(500).json({
      success: false,
      msg: err.message || "Lỗi server",
      data: null,
    });
  }
};

/**
 * CREATE STAFF
 */
exports.createStaff = async (req, res) => {
  try {
    const staffDto = new StaffCreateDTO(req.body);
    const newStaff = await StaffService.createStaff(staffDto);

    return res.status(201).json({
      success: true,
      msg: "Tạo nhân viên thành công",
      data: newStaff,
    });
  } catch (err) {
    console.error("createStaff error:", err);
    return res.status(500).json({
      success: false,
      msg: err.message || "Lỗi tạo nhân viên",
      data: null,
    });
  }
};

/**
 * UPDATE STAFF
 */
exports.updateStaff = async (req, res) => {
  try {
    const staffDto = new StaffUpdateDTO({
      ...req.body,
      id: req.params.id,
    });

    const updated = await StaffService.updateStaff(staffDto);

    return res.status(200).json({
      success: true,
      msg: "Cập nhật nhân viên thành công",
      data: updated,
    });
  } catch (err) {
    console.error("updateStaff error:", err);
    return res.status(500).json({
      success: false,
      msg: err.message || "Lỗi cập nhật nhân viên",
      data: null,
    });
  }
};

/**
 * DELETE ONE STAFF
 */
exports.deleteStaff = async (req, res) => {
  try {
    const result = await StaffService.deleteStaff(req.params.id);

    return res.status(200).json({
      success: true,
      msg: "Xóa nhân viên thành công",
      data: result,
    });
  } catch (err) {
    console.error("deleteStaff error:", err);
    return res.status(500).json({
      success: false,
      msg: err.message || "Lỗi xóa nhân viên",
      data: null,
    });
  }
};

/**
 * DELETE MANY STAFF
 */
exports.deleteStaffs = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    const result = await StaffService.deleteStaffs(ids);

    return res.status(200).json({
      success: true,
      msg: "Xóa danh sách nhân viên thành công",
      data: result,
    });
  } catch (err) {
    console.error("deleteStaffs error:", err);
    return res.status(500).json({
      success: false,
      msg: err.message || "Lỗi xóa danh sách nhân viên",
      data: null,
    });
  }
};
