const DepartmentService = require("../../services/Department/departmentService");

const parseId = (id) => {
    const parsed = parseInt(id, 10);
    if (isNaN(parsed)) {
        throw new Error('Invalid ID format');
    }
    return parsed;
};

const DepartmentController = {
    getAllDepartments: async (req, res) => {
        try {
            const page = Math.max(1, parseInt(req.query.page, 10) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
            const result = await DepartmentService.getAllDepartments(page, limit);
            res.json({
                success: true,
                message: 'Departments retrieved successfully',
                data: result
            });
        } catch (error) {
            console.error('Error in getAllDepartments:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve departments'
            });
        }
    },

    getDepartmentById: async (req, res) => {
        try {
            const id = parseId(req.params.id);
            const department = await DepartmentService.getDepartmentById(id);
            res.json({
                success: true,
                message: 'Department retrieved successfully',
                data: department
            });
        } catch (error) {
            console.error('Error in getDepartmentById:', error);
            const status = error.message.includes('Invalid ID') ? 400 :
                error.message.includes('not found') ? 404 : 500;
            res.status(status).json({
                success: false,
                message: error.message.includes('Invalid ID') ? 'Invalid ID format' : error.message
            });
        }
    },

    createDepartment: async (req, res) => {
        try {
            const departmentData = {
                code: req.body.code?.trim(),
                name: req.body.name?.trim(),
                description: req.body.description?.trim(),
                is_active: req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : 1
            };

            if (!departmentData.code || !departmentData.name) {
                return res.status(400).json({
                    success: false,
                    message: 'Code and name are required'
                });
            }

            const newDepartment = await DepartmentService.createDepartment(departmentData);
            res.status(201).json({
                success: true,
                message: 'Department created successfully',
                data: newDepartment
            });
        } catch (error) {
            console.error('Error in createDepartment:', error);
            const status = error.message.includes('already exists') ? 409 : 500;
            res.status(status).json({
                success: false,
                message: error.message
            });
        }
    },

    updateDepartment: async (req, res) => {
        try {
            const id = parseId(req.params.id);
            const updateData = {
                code: req.body.code?.trim(),
                name: req.body.name?.trim(),
                description: req.body.description?.trim(),
                is_active: req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : undefined
            };

            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No data to update'
                });
            }

            const updatedDepartment = await DepartmentService.updateDepartment(id, updateData);
            res.json({
                success: true,
                message: 'Department updated successfully',
                data: updatedDepartment
            });
        } catch (error) {
            console.error('Error in updateDepartment:', error);
            const status = error.message.includes('Invalid ID') ? 400 :
                error.message.includes('not found') ? 404 :
                error.message.includes('already exists') ? 409 : 500;
            res.status(status).json({
                success: false,
                message: error.message.includes('Invalid ID') ? 'Invalid ID format' : error.message
            });
        }
    },

    deleteDepartment: async (req, res) => {
        try {
            const id = parseId(req.params.id);
            await DepartmentService.deleteDepartment(id);
            res.json({
                success: true,
                message: 'Department deleted successfully'
            });
        } catch (error) {
            console.error('Error in deleteDepartment:', error);
            const status = error.message.includes('Invalid ID') ? 400 :
                error.message.includes('not found') ? 404 : 500;
            res.status(status).json({
                success: false,
                message: error.message.includes('Invalid ID') ? 'Invalid ID format' : error.message
            });
        }
    },

    searchDepartments: async (req, res) => {
        try {
            const query = req.query.q?.trim();
            if (!query) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
            }

            const results = await DepartmentService.searchDepartments(query);
            res.json({
                success: true,
                message: 'Departments search results',
                data: results
            });
        } catch (error) {
            console.error('Error in searchDepartments:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = DepartmentController;
