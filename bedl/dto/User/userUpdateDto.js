class UserUpdateDTO {
    constructor(data) {
        this.full_name = data.full_name;
        this.phone = data.phone ?? null;
        this.avatar_url = data.avatar_url ?? null;
        this.department_id = data.department_id ?? null;
        this.status = data.status;
    }
}

module.exports = UserUpdateDTO;

exports.updateUser = async (req, res) => {
    try {
        const id = req.params.id;
        const dto = new UserUpdateDTO(req.body);

        const updated = await UserService.updateUser(id, dto);

        if (!updated) {
            return res.status(404).json({ msg: "User không tồn tại" });
        }

        res.json({ msg: "Cập nhật user thành công" });
    } catch (err) {
        console.error("updateUser error:", err);
        res.status(500).json({ msg: "Lỗi server" });
    }
};
