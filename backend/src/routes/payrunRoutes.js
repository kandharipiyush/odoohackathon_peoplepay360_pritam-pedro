const express = require('express');
const router = express.Router();
const payrunController = require('../controllers/payrunController');

// Payrun collection routes
router.route('/')
  .get(payrunController.getAllPayruns)
  .post(payrunController.createPayrun);

// Single employee calculation preview (without saving)
router.post('/preview-calculation', payrunController.previewSalaryCalculation);

const payslipController = require('../controllers/payslipController');

// Individual payslip retrieval and PDF generation by payslip ID
router.get('/payslips/:id', payrunController.getPayslipById);
router.get('/payslips/:id/pdf', payslipController.getPayslipPDF);

// Single payrun routes
router.route('/:id')
  .get(payrunController.getPayrunById)
  .put(payrunController.updatePayrun)
  .delete(payrunController.deletePayrun);

// Bulk computation endpoint
router.all('/:id/compute', (req, res, next) => {
  if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
    return payrunController.computePayrun(req, res, next);
  }
  next();
});

// Workflow state transition endpoints
router.all('/:id/validate', (req, res, next) => {
  if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
    return payrunController.validatePayrun(req, res, next);
  }
  next();
});

router.all('/:id/pay', (req, res, next) => {
  if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
    return payrunController.markPayrunAsPaid(req, res, next);
  }
  next();
});

// Payslips list under a payrun
router.get('/:id/payslips', payrunController.getPayslipsForPayrun);

module.exports = router;
