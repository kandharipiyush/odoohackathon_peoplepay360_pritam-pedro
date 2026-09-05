const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// GET all employees / POST create employee
router.route('/')
  .get(employeeController.getAllEmployees)
  .post(employeeController.createEmployee);

// GET / PUT / DELETE single employee
router.route('/:id')
  .get(employeeController.getEmployeeById)
  .put(employeeController.updateEmployee)
  .delete(employeeController.deleteEmployee);

module.exports = router;
