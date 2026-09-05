const anomalyService = require('../services/anomalyService');
const attendanceHookService = require('../services/attendanceHookService');
const budgetService = require('../services/budgetService');
const auditService = require('../services/auditService');

class IntelligenceController {
  // ==========================================
  // 1. AI Anomaly & Fraud Detection Endpoints
  // ==========================================

  async scanPayrunAnomalies(req, res, next) {
    try {
      const result = await anomalyService.scanPayrunAnomalies(req.params.payrunId);
      return res.status(200).json({
        success: true,
        message: `Scanned ${result.total_payslips_scanned} payslips. Flagged ${result.flagged_payslips_count} potential anomalies.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async scanPayslipAnomalies(req, res, next) {
    try {
      const result = await anomalyService.scanPayslipAnomalies(req.params.payslipId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAnomalyLogs(req, res, next) {
    try {
      const { payrun_id, employee_id, severity, status, limit, offset } = req.query;
      const logs = await anomalyService.getAnomalyLogs({
        payrun_id,
        employee_id,
        severity,
        status,
        limit,
        offset,
      });
      return res.status(200).json({
        success: true,
        count: logs.length,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }

  async resolveAnomaly(req, res, next) {
    try {
      const { status, resolution_notes, resolved_by } = req.body;
      const updated = await anomalyService.resolveAnomaly(req.params.id, {
        status,
        resolution_notes,
        resolved_by: resolved_by || (req.user ? req.user.email : 'HR Auditor'),
      });
      return res.status(200).json({
        success: true,
        message: 'Anomaly status updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // 2. Attendance & Leave-to-Payroll Hooks
  // ==========================================

  async getEmployeeAttendanceAdjustments(req, res, next) {
    try {
      const { employeeId } = req.params;
      let { period_start, period_end } = req.query;

      if (!period_start || !period_end) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
        period_start = `${year}-${month}-01`;
        period_end = `${year}-${month}-${lastDay}`;
      }

      const adjustments = await attendanceHookService.calculateAttendanceAdjustments(
        employeeId,
        period_start,
        period_end
      );

      return res.status(200).json({
        success: true,
        data: adjustments,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCompanyAttendanceAdjustments(req, res, next) {
    try {
      let { period_start, period_end } = req.query;
      const adjustments = await attendanceHookService.getCompanyAttendanceAdjustments({
        period_start,
        period_end,
      });
      return res.status(200).json({
        success: true,
        data: adjustments,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPayrunAttendanceSummary(req, res, next) {
    try {
      const summary = await attendanceHookService.getAttendanceSummaryForPayrun(req.params.payrunId);
      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // 3. Budget & Cost Prediction Endpoints
  // ==========================================

  async getBudgetForecast(req, res, next) {
    try {
      const { target_month, lookback_months, threshold_overrun_pct } = req.query;
      const forecast = await budgetService.predictDepartmentBudgets({
        target_month,
        lookback_months,
        threshold_overrun_pct,
      });
      return res.status(200).json({
        success: true,
        data: forecast,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDepartmentHistoricalTrends(req, res, next) {
    try {
      const { department } = req.params;
      const { months } = req.query;
      const trends = await budgetService.getDepartmentHistoricalTrends(department, months);
      return res.status(200).json({
        success: true,
        data: trends,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // 4. Explainable Payroll Auditor Endpoints
  // ==========================================

  async getPayslipAudit(req, res, next) {
    try {
      const audit = await auditService.generatePayslipAudit(req.params.id);
      return res.status(200).json({
        success: true,
        data: audit,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPayrunAuditReport(req, res, next) {
    try {
      const report = await auditService.generatePayrunAuditReport(req.params.payrunId);
      return res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
}

const controller = new IntelligenceController();

// Bind methods
controller.scanPayrunAnomalies = controller.scanPayrunAnomalies.bind(controller);
controller.scanPayslipAnomalies = controller.scanPayslipAnomalies.bind(controller);
controller.getAnomalyLogs = controller.getAnomalyLogs.bind(controller);
controller.resolveAnomaly = controller.resolveAnomaly.bind(controller);
controller.getEmployeeAttendanceAdjustments = controller.getEmployeeAttendanceAdjustments.bind(controller);
controller.getCompanyAttendanceAdjustments = controller.getCompanyAttendanceAdjustments.bind(controller);
controller.getPayrunAttendanceSummary = controller.getPayrunAttendanceSummary.bind(controller);
controller.getBudgetForecast = controller.getBudgetForecast.bind(controller);
controller.getDepartmentHistoricalTrends = controller.getDepartmentHistoricalTrends.bind(controller);
controller.getPayslipAudit = controller.getPayslipAudit.bind(controller);
controller.getPayrunAuditReport = controller.getPayrunAuditReport.bind(controller);

module.exports = controller;
