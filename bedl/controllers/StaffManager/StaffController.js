const StaffService = require("../../services/StaffManager/StaffServices");
const StaffCreateDTO = require("../../dto/staff/StaffCreateDTO");
const StaffUpdateDTO = require("../../dto/staff/staffUpdateDto");

/**
 * GET ALL STAFF
 */
exports.getAllStaff = async (req, res) => {
    try {
        const staffs = await StaffService.getAllStaff();

        res.status(200).json({
            success: true,
            msg: "Lấy danh sách nhân viên thành công",
            total: staffs.length,
            data: staffs
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            msg: err.message,
            data: null
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

        res.status(201).json({
            success: true,
            msg: "Tạo nhân viên thành công",
            data: newStaff
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            msg: err.message,
            data: null
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
            id: req.params.id
        });

        const updatedStaff = await StaffService.updateStaff(staffDto);

        res.status(200).json({
            success: true,
            msg: "Cập nhật nhân viên thành công",
            data: updatedStaff
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            msg: err.message,
            data: null
        });
    }
};

/**
 * DELETE SINGLE STAFF
 */
exports.deleteStaff = async (req, res) => {
    try {
        await StaffService.deleteStaff(req.params.id);

        res.status(200).json({
            success: true,
            msg: "Xóa nhân viên thành công",
            data: null
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            msg: err.message,
            data: null
        });
    }
};

/**
 * DELETE MULTIPLE STAFFS
 */
exports.deleteStaffs = async (req, res) => {
    try {
        const { staffIds } = req.body;
        await StaffService.deleteStaffs(staffIds);

        res.status(200).json({
            success: true,
            msg: "Xóa nhiều nhân viên thành công",
            data: null
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            msg: err.message,
            data: null
        });
    }
};


