const express = require('express');
const router = express.Router();
const payrunController = require('../controllers/payrunController');

// GET single payslip by ID
router.get('/:id', payrunController.getPayslipById);

module.exports = router;
