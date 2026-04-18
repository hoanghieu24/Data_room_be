const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Positions = require("../../services/Positions/positionsService");
const PositionCreateDTO = require("../../dto/positions/positionCreateDto");
const PositionUpdateDTO = require("../../dto/positions/positionUpdateDto");

exports.getAllPositions = async (req, res) => {
  try {
    const positions = await Positions.getAllPositions();
    return res.json({
      msg: "Danh sách vị trí",
      total: positions.length,
      data: positions   // 👈 QUAN TRỌNG
    });
  } catch (error) {
    console.error("getAllPositions error:", error);
    return res.status(500).json({
      msg: "Lỗi server"
    });
  }
};




exports.create = async (req, res) => {
    try {
        const dto = new PositionCreateDTO({
            ...req.body,
            created_by: req.user.id   
        });
        const existingPosition = await Positions.findByCode(dto.code);
        if (existingPosition) {
            return res.status(400).json({
                msg: "Chức danh đã tồn tại"
            });
        }
        const id = await Positions.createPosition(dto);
        res.json({
            msg: "Tạo chức danh thành công",
            position_id: id
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Lỗi tạo chức danh" });
    }
};

exports.update = async (req, res) => {
    try {
        const dto = new PositionUpdateDTO({
            ...req.body,
            id: req.params.id
        });

        const updated = await Positions.updatePosition(dto);

        if (updated === 0) {
            return res.status(404).json({
                msg: "Chức danh không tồn tại hoặc đã bị vô hiệu"
            });
        }
        const position = await Positions.findByCode(dto.position_code);
        if (!position) {
            return res.status(404).json({
                msg: "Chức danh không tồn tại"
            });
        }


        res.json({
            msg: "Cập nhật chức danh thành công"
        });

    } catch (err) {
        console.error("update position error:", err);
        res.status(500).json({ msg: "Lỗi cập nhật chức danh" });
    }
};

exports.deleteById = async (req, res) => {
    try {
        const id = req.params.id;
        const deleted = await Positions.deleteById(id);
        if (deleted === 0) {
            return res.status(404).json({
                msg: "Chức danh không tồn tại hoặc đã bị vô hiệu"
            });
        }
        res.json({
            msg: "Xóa chức danh thành công"
        });
    } catch (err) {
        console.error("delete position error:", err);
        res.status(500).json({ msg: "Lỗi xóa chức danh" });
    }
};

exports.deleteByIds = async (req, res) => {
    try { 
        const ids = req.body.ids;
        const deletedCount = await Positions.deleteByIds(ids);
        if (deletedCount === 0) {
            return res.status(404).json({
                msg: "Không có chức danh nào bị xóa"
            });
        }
        res.json({
            msg: `Xóa thành công ${deletedCount} chức danh`
        });
    } catch (err) {
        console.error("delete positions error:", err);
        res.status(500).json({ msg: "Lỗi xóa chức danh" });
    }
};
