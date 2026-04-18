const taskService = require('../../services/task/taskService')


const TaskController = {
    getAllTasks: async (req, res) => {
        try {
            const tasks = await taskService.getAllTask();
            res.json({
                success: true,
                message: 'Tasks retrieved successfully',
                data: tasks
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving tasks',
                error: error.message
            });
        }
    },

    createTask: async (req, res) => {
        
        try {
            const newTask = await taskService.addTask(req.body, req.user);
            res.status(201).json({
                success: true,
                message: 'Task created successfully',
                data: newTask
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error creating task',
                error: error.message
            });
        }
},

    getTaskById: async (req, res) => {
        try {
            const task = await taskService.getTaskById(req.params.id);
            res.json({
                success: true,
                message: 'Task retrieved successfully',
                data: task
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving task',
                error: error.message
            });
        }
    },

    updateTask: async (req, res) => {
        try {
            const updatedTask = await taskService.updateTask(req.params.id, req.body);
            res.json({
                success: true,
                message: 'Task updated successfully',
                data: updatedTask
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating task',
                error: error.message
            });
        }
    },

    deleteTask: async (req, res) => {
        try {
            const result = await taskService.deleteTask(req.params.id);
            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error deleting task',
                error: error.message
            });
        }
    },      
};


module.exports = TaskController;
