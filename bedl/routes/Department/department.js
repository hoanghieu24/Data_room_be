const express = require('express');
const router = express.Router();
const DepartmentController = require('../../controllers/Department/departmentController');

router.get('/search', DepartmentController.searchDepartments);
router.get('/', DepartmentController.getAllDepartments);
router.get('/:id', DepartmentController.getDepartmentById);
router.post('/', DepartmentController.createDepartment);
router.put('/:id', DepartmentController.updateDepartment);
router.delete('/:id', DepartmentController.deleteDepartment);

module.exports = router;
