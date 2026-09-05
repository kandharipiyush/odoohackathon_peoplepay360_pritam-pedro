const payrunService = require('../services/payrunService');
const payrollService = require('../services/payrollService');

class PayrunController {
  // ==========================================
  // Payrun Batch Container Endpoints
  // ==========================================

  async createPayrun(req, res, next) {
    try {
      const payrun = await payrunService.createPayrun(req.body);
      return res.status(201).json({
        success: true,
        message: 'Payrun batch created successfully in Draft status',
        data: payrun,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllPayruns(req, res, next) {
    try {
      const { status, limit, offset } = req.query;
      const payruns = await payrunService.getAllPayruns({ status, limit, offset });
      return res.status(200).json({
        success: true,
        count: payruns.length,
        data: payruns,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPayrunById(req, res, next) {
    try {
      const payrun = await payrunService.getPayrunById(req.params.id);
      return res.status(200).json({
        success: true,
        data: payrun,
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePayrun(req, res, next) {
    try {
      const updated = await payrunService.updatePayrun(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Payrun updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePayrun(req, res, next) {
    try {
      const result = await payrunService.deletePayrun(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Payrun deleted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Bulk Computation & Workflow Endpoints
  // ==========================================

  async computePayrun(req, res, next) {
    try {
      const result = await payrunService.computePayrun(req.params.id);
      return res.status(200).json({
        success: true,
        message: `Successfully computed ${result.employees_processed} payslips for payrun batch`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async validatePayrun(req, res, next) {
    try {
      const payrun = await payrunService.validatePayrun(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Payrun validated and confirmed for payroll disbursement',
        data: payrun,
      });
    } catch (error) {
      next(error);
    }
  }

  async markPayrunAsPaid(req, res, next) {
    try {
      const payrun = await payrunService.markPayrunAsPaid(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Payrun marked as Paid and all payslips finalized',
        data: payrun,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Payslips Queries
  // ==========================================

  async getPayslipsForPayrun(req, res, next) {
    try {
      const { limit, offset, search } = req.query;
      const payslips = await payrunService.getPayslipsForPayrun(req.params.id, {
        limit,
        offset,
        search,
      });
      return res.status(200).json({
        success: true,
        count: payslips.length,
        data: payslips,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPayslipById(req, res, next) {
    try {
      const payslip = await payrunService.getPayslipById(req.params.id);
      return res.status(200).json({
        success: true,
        data: payslip,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Single Employee Calculation Preview Endpoint
  // ==========================================

  async previewSalaryCalculation(req, res, next) {
    try {
      const { employee_id, period_start, period_end, structure_id } = req.body;
      if (!employee_id || !period_start || !period_end) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: employee_id, period_start, period_end',
        });
      }

      const preview = await payrollService.calculateSalaryForEmployee(
        employee_id,
        period_start,
        period_end,
        structure_id || null
      );

      return res.status(200).json({
        success: true,
        data: preview,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PayrunController();
