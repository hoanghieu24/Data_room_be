class PositionUpdateDTO {
    constructor(data) {
        this.id = data.id;

        this.code = data.code;
        this.name = data.name;
        this.description = data.description ?? null;

        this.level = data.level ?? 1;
        this.parent_id = data.parent_id ?? null;

        this.base_salary = data.base_salary ?? null;
        this.allowance = data.allowance ?? null;

        this.department_id = data.department_id ?? null;
        this.is_manager = data.is_manager ?? false;
        this.team_size_limit = data.team_size_limit ?? null;
    }
}

module.exports = PositionUpdateDTO;
