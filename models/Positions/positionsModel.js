const db = require("../../db");
const dto = require("../../dto/positions/positionCreateDto");

class PositionModel {
    static async getAllPositions() {
        const [rows] = await db.query("SELECT * FROM positions");
        return rows.map(r => ({
            ...r,
            position_code: r.position_code,
        }));
    }

    static async findByCode(position_code) {
        const [rows] = await db.query(
            "SELECT * FROM positions WHERE code = ?",
            [position_code]
        );
        return rows[0];
    }

    static async createPosition(dto) {
        const [result] = await db.query(
            `
        INSERT INTO positions (
            code, name, description,
            level, parent_id,
            base_salary, allowance,
            department_id, is_manager, team_size_limit,
            created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
            [
                dto.code,
                dto.name,
                dto.description,
                dto.level,
                dto.parent_id,
                dto.base_salary,
                JSON.stringify(dto.allowance),
                dto.department_id,
                dto.is_manager,
                dto.team_size_limit,
                dto.created_by
            ]
        );

        return result.insertId;
    }
    static async updatePosition(dto) {
        const [result] = await db.query(
            `
        UPDATE positions SET
            code = ?,
            name = ?,
            description = ?,
            level = ?,
            parent_id = ?,
            base_salary = ?,
            allowance = ?,
            department_id = ?,
            is_manager = ?,
            team_size_limit = ?
        WHERE id = ? AND is_active = 1
        `,
            [
                dto.code,
                dto.name,
                dto.description,
                dto.level,
                dto.parent_id,
                dto.base_salary,
                dto.allowance ? JSON.stringify(dto.allowance) : null,
                dto.department_id,
                dto.is_manager,
                dto.team_size_limit,
                dto.id
            ]
        );

        return result.affectedRows;
    }

    static async deleteByid(id) {
        const [result] = await db.query(
            "UPDATE positions SET is_active = 0 WHERE id = ?",
            [id]
        );
        return result.affectedRows;
    }

    static async deleteByIds(ids) {
        const [result] = await db.query(
            "UPDATE positions SET is_active = 0 WHERE id IN (?)",
            [ids]
        );
        return result.affectedRows;
    }


}

module.exports = PositionModel;

