const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');

// GET all contracts / POST create contract
router.route('/')
  .get(contractController.getAllContracts)
  .post(contractController.createContract);

// GET / PUT / DELETE single contract
router.route('/:id')
  .get(contractController.getContractById)
  .put(contractController.updateContract)
  .delete(contractController.deleteContract);

// GET contracts by employee
router.get('/employee/:employeeId', contractController.getContractsByEmployee);

// GET active contract for period / date binding
router.get('/employee/:employeeId/active', contractController.getActiveContractForDate);

module.exports = router;
