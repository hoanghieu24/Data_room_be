const bcrypt = require("bcryptjs");
const PositionsModel = require("../../models/positions/positionsModel");

class PositionsService {
    static async getAllPositions() {
        return await PositionsModel.getAllPositions();
    }

    static async createPosition(dto) {
        return await PositionsModel.createPosition(dto);
    }

    static async updatePosition(dto) {
        return await PositionsModel.updatePosition(dto);
    }

    static async findByCode(code) {
        return await PositionsModel.findByCode(code);
    }

    static async deleteById(id) {
        return await PositionsModel.deleteByid(id);
    }

    static async deleteByIds(ids) {
        return await PositionsModel.deleteByIds(ids);
    }


}



module.exports = PositionsService;
