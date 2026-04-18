class PositionCreateDTO {
    constructor(data) {
        this.code = data.code;                 // VARCHAR(50)
        this.name = data.name;                 // VARCHAR(100)
        this.description = data.description;  // TEXT

        this.level = data.level || 1;
        this.parent_id = data.parent_id || null;

        this.base_salary = data.base_salary || 0;
        this.allowance = data.allowance || {};   // JSON

        this.department_id = data.department_id || null;
        this.is_manager = data.is_manager || false;
        this.team_size_limit = data.team_size_limit || null;

        this.created_by = data.created_by;
    }
}

module.exports = PositionCreateDTO;
