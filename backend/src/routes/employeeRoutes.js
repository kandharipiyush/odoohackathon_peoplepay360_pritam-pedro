const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// GET pending applicant registrations awaiting HR approval
router.get('/pending', employeeController.getPendingEmployees);

// Approve / Reject employee applicants
router.post('/:id/approve', employeeController.approveEmployee);
router.post('/:id/reject', employeeController.rejectEmployee);

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
