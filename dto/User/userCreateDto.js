class UserCreateDTO {
    constructor(data) {
        this.username = data.username;
        this.password = data.password;
        this.email = data.email;
        this.full_name = data.full_name;
        this.phone = data.phone ?? null;
        this.avatar_url = data.avatar_url ?? null;
        this.department_id = data.department_id ?? null;
        this.created_by = data.created_by ?? null;
        this.status = data.status;
    }
}

module.exports = UserCreateDTO;