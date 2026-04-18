const taskService = require('../../models/task/taskModel')

class TaskService {
static async addTask(data, userId) {
    if (!data || !data.title) throw new Error("Tên task là bắt buộc");

    if (!data.assigned_to) throw new Error("Phải có người được giao task");

    const taskId = await taskService.create({
        ...data,
        created_by: userId.id || userId
    });

    return taskId;
}
    static async getAllTask() {
        const tasks = await taskService.getAll();
        return tasks.map(t => ({
            ...t,
            is_active: t.is_active === 1,
        }));
    }

    static async getTaskById(id) {
        const task = await taskService.getById(id);
        if (!task) throw new Error("Task không tồn tại");
        return {
            ...task,
            is_active: task.is_active === 1,
        };
    }

    static async updateTask(id, data) {
        const task = await taskService.getById(id);
        if (!task) throw new Error("Task không tồn tại");
        await taskService.update(id, data);
        return this.getTaskById(id);
    }

    static async deleteTask(id) {
        const task = await taskService.getById(id);
        if (!task) throw new Error("Task không tồn tại");
        await taskService.delete(id);
        return { message: "Task đã được xóa" };
    }
}

module.exports = TaskService;