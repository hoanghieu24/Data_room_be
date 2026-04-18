const DepartmentModel = require("../../models/Department/departmentModel");

const DepartmentService = {
    getAllDepartments: async (page = 1, limit = 20) => {
        try {
            return await DepartmentModel.getAll(page, limit);
        } catch (error) {
            console.error('Service Error in getAllDepartments:', error);
            throw new Error('Failed to retrieve departments');
        }
    },

    getDepartmentById: async (id) => {
        try {
            if (isNaN(id)) {
                throw new Error('Invalid department ID');
            }
            const department = await DepartmentModel.getById(id);
            if (!department) {
                throw new Error('Department not found');
            }
            return department;
        } catch (error) {
            console.error('Service Error in getDepartmentById:', error);
            throw error;
        }
    },

    createDepartment: async (departmentData) => {
        try {
            if (!departmentData.code || !departmentData.name) {
                throw new Error('Code and name are required');
            }

            const existing = await DepartmentModel.getByCode(departmentData.code);
            if (existing) {
                throw new Error('Department code already exists');
            }

            return await DepartmentModel.create(departmentData);
        } catch (error) {
            console.error('Service Error in createDepartment:', error);
            throw error;
        }
    },

    updateDepartment: async (id, departmentData) => {
        try {
            if (isNaN(id)) {
                throw new Error('Invalid department ID');
            }

            const department = await DepartmentModel.getById(id);
            if (!department) {
                throw new Error('Department not found');
            }

            if (departmentData.code) {
                const existing = await DepartmentModel.getByCode(departmentData.code);
                if (existing && existing.id !== id) {
                    throw new Error('Department code already exists');
                }
            }

            const updated = await DepartmentModel.update(id, departmentData);
            if (!updated) {
                throw new Error('Failed to update department');
            }

            return await DepartmentModel.getById(id);
        } catch (error) {
            console.error('Service Error in updateDepartment:', error);
            throw error;
        }
    },

    deleteDepartment: async (id) => {
        try {
            if (isNaN(id)) {
                throw new Error('Invalid department ID');
            }

            const department = await DepartmentModel.getById(id);
            if (!department) {
                throw new Error('Department not found');
            }

            const deleted = await DepartmentModel.softDelete(id);
            if (!deleted) {
                throw new Error('Failed to delete department');
            }

            return true;
        } catch (error) {
            console.error('Service Error in deleteDepartment:', error);
            throw error;
        }
    },

    searchDepartments: async (searchTerm) => {
        try {
            if (!searchTerm || typeof searchTerm !== 'string') {
                throw new Error('Search term is required');
            }
            return await DepartmentModel.search(searchTerm);
        } catch (error) {
            console.error('Service Error in searchDepartments:', error);
            throw error;
        }
    }
};

module.exports = DepartmentService;
