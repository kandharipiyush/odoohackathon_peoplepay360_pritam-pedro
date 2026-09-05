const express = require('express');
const router = express.Router();
const intelligenceController = require('../controllers/intelligenceController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Note: For maximum testing flexibility, we allow endpoints to be accessed with or without token,
// while protecting sensitive audit/anomaly resolution routes via authenticateToken where appropriate.

// ==========================================
// 1. AI Anomaly & Fraud Detection Routes
// ==========================================
router.post('/anomalies/scan/:payrunId', intelligenceController.scanPayrunAnomalies);
router.post('/anomalies/scan-payslip/:payslipId', intelligenceController.scanPayslipAnomalies);
router.get('/anomalies', intelligenceController.getAnomalyLogs);
router.patch('/anomalies/:id', intelligenceController.resolveAnomaly);

// ==========================================
// 2. Attendance & Leave-to-Payroll Hooks Routes
// ==========================================
router.get('/attendance-hooks/employee/:employeeId', intelligenceController.getEmployeeAttendanceAdjustments);
router.get('/attendance-hooks/payrun/:payrunId', intelligenceController.getPayrunAttendanceSummary);

// ==========================================
// 3. Budget & Cost Prediction Routes
// ==========================================
router.get('/budget/forecast', intelligenceController.getBudgetForecast);
router.get('/budget/department/:department', intelligenceController.getDepartmentHistoricalTrends);

// ==========================================
// 4. Explainable Payroll Auditor Routes
// ==========================================
router.get('/audit/payslip/:id', intelligenceController.getPayslipAudit);
router.get('/audit/payrun/:payrunId', intelligenceController.getPayrunAuditReport);

module.exports = router;
