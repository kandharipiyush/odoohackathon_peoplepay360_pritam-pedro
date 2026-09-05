const { pool } = require('../config/db');
const pdfService = require('../services/pdfService');
const logger = require('../utils/logger');

class PayslipController {
  /**
   * Helper: Fetches complete payslip record with employee, contract, and payrun joins
   */
  async fetchPayslipData(payslipId) {
    const [rows] = await pool.query(
      `SELECT 
        ps.id, ps.payrun_id, ps.employee_id, ps.contract_id, ps.worked_days,
        ps.gross_amount, ps.net_amount, ps.risk_score, ps.audit_reasons_json, ps.status,
        ps.created_at, ps.updated_at,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.department, e.job_position, e.email,
        c.wage AS contract_wage,
        p.name AS payrun_name, p.period_start, p.period_end
      FROM payslips ps
      JOIN employees e ON ps.employee_id = e.id
      JOIN contracts c ON ps.contract_id = c.id
      JOIN payruns p ON ps.payrun_id = p.id
      WHERE ps.id = ?`,
      [payslipId]
    );

    if (rows.length === 0) {
      const error = new Error(`Payslip with ID ${payslipId} not found`);
      error.statusCode = 404;
      throw error;
    }

    return rows[0];
  }

  /**
   * GET /api/payslips/:id
   * Retrieve single payslip with parsed JSON audit and breakdown
   */
  async getPayslipById(req, res, next) {
    try {
      const row = await this.fetchPayslipData(req.params.id);
      const payslip = {
        ...row,
        gross_amount: parseFloat(row.gross_amount),
        net_amount: parseFloat(row.net_amount),
        worked_days: parseFloat(row.worked_days),
        risk_score: parseFloat(row.risk_score),
        contract_wage: parseFloat(row.contract_wage),
        audit_reasons_json:
          typeof row.audit_reasons_json === 'string'
            ? JSON.parse(row.audit_reasons_json || '{}')
            : row.audit_reasons_json,
      };

      return res.status(200).json({
        success: true,
        data: payslip,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payslips/:id/pdf
   * Protected endpoint generating and streaming official branded PDF payslip
   */
  async getPayslipPDF(req, res, next) {
    try {
      const payslipId = req.params.id;
      const payslip = await this.fetchPayslipData(payslipId);

      const safeName = (payslip.employee_name || 'employee').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Payslip_${safeName}_${payslip.period_start || 'period'}.pdf`;

      // Set headers for PDF streaming inline in browser with attachment filename fallback
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      logger.info('Streaming payslip PDF:', {
        payslipId,
        employee: payslip.employee_name,
        requestedBy: req.user ? req.user.email : 'system',
      });

      await pdfService.generatePayslipPDF(payslip, res);
    } catch (error) {
      // If headers already sent, pass to global error handler
      if (res.headersSent) {
        return next(error);
      }
      next(error);
    }
  }

  /**
   * GET /api/payslips
   * Optional query for listing payslips with filters
   */
  async getAllPayslips(req, res, next) {
    try {
      const { employee_id, payrun_id, status, limit = 50, offset = 0 } = req.query;

      let sql = `
        SELECT 
          ps.id, ps.payrun_id, ps.employee_id, ps.contract_id, ps.worked_days,
          ps.gross_amount, ps.net_amount, ps.risk_score, ps.status,
          ps.created_at, ps.updated_at,
          CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
          e.department, e.job_position,
          p.name AS payrun_name, p.period_start, p.period_end
        FROM payslips ps
        JOIN employees e ON ps.employee_id = e.id
        JOIN payruns p ON ps.payrun_id = p.id
        WHERE 1=1
      `;
      const params = [];

      if (employee_id) {
        sql += ' AND ps.employee_id = ?';
        params.push(employee_id);
      }
      if (payrun_id) {
        sql += ' AND ps.payrun_id = ?';
        params.push(payrun_id);
      }
      if (status) {
        sql += ' AND ps.status = ?';
        params.push(status);
      }

      sql += ' ORDER BY ps.id DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit, 10), parseInt(offset, 10));

      const [rows] = await pool.query(sql, params);

      return res.status(200).json({
        success: true,
        count: rows.length,
        data: rows.map((r) => ({
          ...r,
          gross_amount: parseFloat(r.gross_amount),
          net_amount: parseFloat(r.net_amount),
          worked_days: parseFloat(r.worked_days),
          risk_score: parseFloat(r.risk_score),
        })),
      });
    } catch (error) {
      next(error);
    }
  }
}

const controller = new PayslipController();
// Bind methods to ensure correct 'this' context when used as route callbacks
controller.getPayslipById = controller.getPayslipById.bind(controller);
controller.getPayslipPDF = controller.getPayslipPDF.bind(controller);
controller.getAllPayslips = controller.getAllPayslips.bind(controller);

module.exports = controller;
