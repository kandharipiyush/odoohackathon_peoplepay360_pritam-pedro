const express = require('express');
const router = express.Router();
const payslipController = require('../controllers/payslipController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// GET all payslips with optional filtering
router.get('/', authenticateToken, payslipController.getAllPayslips);

// GET /api/payslips/:id/pdf - Protected PDF download & streaming endpoint
router.get(
  '/:id/pdf',
  authenticateToken,
  authorizeRole('Admin', 'HR Manager', 'HR Payroll Manager', 'Finance Auditor', 'Employee'),
  payslipController.getPayslipPDF
);

// GET single payslip details by ID
router.get('/:id', authenticateToken, payslipController.getPayslipById);

module.exports = router;
