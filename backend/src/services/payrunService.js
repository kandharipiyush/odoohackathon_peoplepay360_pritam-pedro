const { pool, executeTransaction } = require('../config/db');
const payrollService = require('./payrollService');
const logger = require('../utils/logger');

/**
 * Service managing Payrun batch cycles, bulk computation workflows, and payslips
 */
class PayrunService {
  /**
   * Create a new Payrun batch container (Draft)
   */
  async createPayrun({ name, structure_id = null, period_start, period_end }) {
    if (!name || !period_start || !period_end) {
      const error = new Error('Missing required fields: name, period_start, period_end');
      error.statusCode = 400;
      throw error;
    }

    if (new Date(period_end) < new Date(period_start)) {
      const error = new Error('period_end cannot be earlier than period_start');
      error.statusCode = 400;
      throw error;
    }

    if (structure_id) {
      const [structures] = await pool.query('SELECT id FROM salary_structures WHERE id = ?', [structure_id]);
      if (structures.length === 0) {
        const error = new Error(`Salary structure ID ${structure_id} not found`);
        error.statusCode = 404;
        throw error;
      }
    }

    const [result] = await pool.query(
      `INSERT INTO payruns (name, structure_id, period_start, period_end, status)
       VALUES (?, ?, ?, ?, 'Draft')`,
      [name, structure_id || null, period_start, period_end]
    );

    return this.getPayrunById(result.insertId);
  }

  /**
   * Get all payruns with aggregated metrics (payslip counts, financial totals)
   */
  async getAllPayruns({ status, limit = 50, offset = 0 }) {
    let sql = `
      SELECT 
        p.id, p.name, p.structure_id, p.period_start, p.period_end, p.status, 
        p.created_at, p.updated_at,
        s.name AS salary_structure_name,
        COUNT(ps.id) AS total_payslips,
        COALESCE(SUM(ps.gross_amount), 0.00) AS total_gross,
        COALESCE(SUM(ps.net_amount), 0.00) AS total_net,
        COALESCE(SUM(CASE WHEN ps.risk_score > 30 THEN 1 ELSE 0 END), 0) AS high_risk_count
      FROM payruns p
      LEFT JOIN salary_structures s ON p.structure_id = s.id
      LEFT JOIN payslips ps ON p.id = ps.payrun_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    sql += ' GROUP BY p.id ORDER BY p.period_start DESC, p.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(sql, params);
    return rows.map((r) => ({
      ...r,
      total_gross: parseFloat(r.total_gross),
      total_net: parseFloat(r.total_net),
      total_payslips: parseInt(r.total_payslips, 10),
      high_risk_count: parseInt(r.high_risk_count, 10),
    }));
  }

  /**
   * Get payrun by ID with aggregated summary
   */
  async getPayrunById(id) {
    const [rows] = await pool.query(
      `SELECT 
        p.id, p.name, p.structure_id, p.period_start, p.period_end, p.status, 
        p.created_at, p.updated_at,
        s.name AS salary_structure_name,
        COUNT(ps.id) AS total_payslips,
        COALESCE(SUM(ps.gross_amount), 0.00) AS total_gross,
        COALESCE(SUM(ps.net_amount), 0.00) AS total_net,
        COALESCE(SUM(CASE WHEN ps.risk_score > 30 THEN 1 ELSE 0 END), 0) AS high_risk_count
      FROM payruns p
      LEFT JOIN salary_structures s ON p.structure_id = s.id
      LEFT JOIN payslips ps ON p.id = ps.payrun_id
      WHERE p.id = ?
      GROUP BY p.id`,
      [id]
    );

    if (rows.length === 0) {
      const error = new Error(`Payrun ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    const payrun = rows[0];
    return {
      ...payrun,
      total_gross: parseFloat(payrun.total_gross),
      total_net: parseFloat(payrun.total_net),
      total_payslips: parseInt(payrun.total_payslips, 10),
      high_risk_count: parseInt(payrun.high_risk_count, 10),
    };
  }

  /**
   * Update payrun details (name, structure, periods)
   */
  async updatePayrun(id, { name, structure_id, period_start, period_end }) {
    const payrun = await this.getPayrunById(id);

    if (payrun.status === 'Paid') {
      const error = new Error('Cannot modify a Payrun that has already been Paid');
      error.statusCode = 400;
      throw error;
    }

    const fields = [];
    const params = [];

    if (name) {
      fields.push('name = ?');
      params.push(name);
    }
    if (structure_id !== undefined) {
      fields.push('structure_id = ?');
      params.push(structure_id || null);
    }
    if (period_start) {
      fields.push('period_start = ?');
      params.push(period_start);
    }
    if (period_end) {
      fields.push('period_end = ?');
      params.push(period_end);
    }

    if (fields.length > 0) {
      params.push(id);
      await pool.query(`UPDATE payruns SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    return this.getPayrunById(id);
  }

  /**
   * Delete payrun and its payslips
   */
  async deletePayrun(id) {
    const payrun = await this.getPayrunById(id);

    if (payrun.status === 'Paid') {
      const error = new Error('Cannot delete a Payrun that has already been marked as Paid');
      error.statusCode = 400;
      throw error;
    }

    await pool.query('DELETE FROM payruns WHERE id = ?', [id]);
    return { id: parseInt(id, 10), deleted: true };
  }

  /**
   * Bulk Computation Endpoint: Filters eligible employees, iterates salary calculation engine,
   * and writes payslips wrapped in an ACID transaction.
   */
  async computePayrun(payrunId) {
    return await executeTransaction(async (connection) => {
      // 1. Lock payrun record FOR UPDATE
      const [payrunRows] = await connection.query(
        'SELECT * FROM payruns WHERE id = ? FOR UPDATE',
        [payrunId]
      );

      if (payrunRows.length === 0) {
        const error = new Error(`Payrun ID ${payrunId} not found`);
        error.statusCode = 404;
        throw error;
      }

      const payrun = payrunRows[0];

      if (payrun.status === 'Paid' || payrun.status === 'Validated') {
        const error = new Error(
          `Cannot recompute payrun in "${payrun.status}" status. Only "Draft" or "Computed" payruns can be computed.`
        );
        error.statusCode = 400;
        throw error;
      }

      // 2. Identify eligible employees who have an active contract covering this period
      let employeeSql = `
        SELECT DISTINCT e.id AS employee_id, c.id AS contract_id, c.salary_structure_id
        FROM employees e
        JOIN contracts c ON e.id = c.employee_id
        WHERE e.status = 'Active'
          AND c.status = 'Active'
          AND c.start_date <= ?
          AND (c.end_date IS NULL OR c.end_date >= ?)
      `;
      const employeeParams = [payrun.period_end, payrun.period_start];

      if (payrun.structure_id) {
        employeeSql += ' AND c.salary_structure_id = ?';
        employeeParams.push(payrun.structure_id);
      }

      const [eligibleEmployees] = await connection.query(employeeSql, employeeParams);

      if (eligibleEmployees.length === 0) {
        const error = new Error(
          `No active employees with qualifying contracts found for payrun period (${payrun.period_start} to ${payrun.period_end})`
        );
        error.statusCode = 400;
        throw error;
      }

      // 3. Clear previous draft/computed payslips for this payrun
      await connection.query('DELETE FROM payslips WHERE payrun_id = ?', [payrunId]);

      // 4. Iterate and compute each employee via the calculation engine
      const computedPayslips = [];
      let totalGross = 0;
      let totalNet = 0;
      let highRiskCount = 0;

      for (const emp of eligibleEmployees) {
        const calculation = await payrollService.calculateSalaryForEmployee(
          emp.employee_id,
          payrun.period_start,
          payrun.period_end,
          payrun.structure_id || emp.salary_structure_id,
          connection
        );

        const auditJson = JSON.stringify({
          audit_reasons: calculation.audit_reasons,
          salary_breakdown: calculation.salary_breakdown,
          metrics: calculation.metrics,
        });

        const [insertResult] = await connection.query(
          `INSERT INTO payslips (
             payrun_id, employee_id, contract_id, worked_days, 
             gross_amount, net_amount, risk_score, audit_reasons_json, status
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Computed')`,
          [
            payrunId,
            calculation.employee_id,
            calculation.contract_id,
            calculation.metrics.worked_days,
            calculation.gross_amount,
            calculation.net_amount,
            calculation.risk_score,
            auditJson,
          ]
        );

        totalGross += calculation.gross_amount;
        totalNet += calculation.net_amount;
        if (calculation.risk_score > 30) highRiskCount++;

        computedPayslips.push({
          payslip_id: insertResult.insertId,
          employee_id: calculation.employee_id,
          employee_name: calculation.employee_name,
          worked_days: calculation.metrics.worked_days,
          gross_amount: calculation.gross_amount,
          net_amount: calculation.net_amount,
          risk_score: calculation.risk_score,
          audit_reasons: calculation.audit_reasons,
        });
      }

      // 5. Update Payrun Status to Computed
      await connection.query(
        `UPDATE payruns SET status = 'Computed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [payrunId]
      );

      logger.info(`Payrun ID ${payrunId} successfully computed`, {
        employeesComputed: computedPayslips.length,
        totalGross: totalGross.toFixed(2),
        totalNet: totalNet.toFixed(2),
        highRiskCount,
      });

      return {
        id: parseInt(payrunId, 10),
        payrun_id: parseInt(payrunId, 10),
        name: payrun.name,
        period_start: payrun.period_start,
        period_end: payrun.period_end,
        status: 'Computed',
        employees_processed: computedPayslips.length,
        employee_count: computedPayslips.length,
        total_gross: parseFloat(totalGross.toFixed(2)),
        total_net: parseFloat(totalNet.toFixed(2)),
        gross_amount: parseFloat(totalGross.toFixed(2)),
        net_amount: parseFloat(totalNet.toFixed(2)),
        high_risk_count: highRiskCount,
        payslips: computedPayslips,
      };
    });
  }

  /**
   * Validate Payrun: Transition from Computed -> Validated
   */
  async validatePayrun(id) {
    const payrun = await this.getPayrunById(id);

    if (payrun.status !== 'Computed') {
      const error = new Error(`Cannot validate payrun in status "${payrun.status}". Must be in "Computed" status.`);
      error.statusCode = 400;
      throw error;
    }

    await pool.query(
      `UPDATE payruns SET status = 'Validated', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
    await pool.query(
      `UPDATE payslips SET status = 'Audited' WHERE payrun_id = ? AND status = 'Computed'`,
      [id]
    );

    return this.getPayrunById(id);
  }

  /**
   * Pay/Disburse Payrun: Transition from Validated -> Paid
   */
  async markPayrunAsPaid(id) {
    const payrun = await this.getPayrunById(id);

    await pool.query(
      `UPDATE payruns SET status = 'Paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
    await pool.query(
      `UPDATE payslips SET status = 'Paid' WHERE payrun_id = ?`,
      [id]
    );

    return this.getPayrunById(id);
  }

  /**
   * Retrieve all payslips for a specific payrun
   */
  async getPayslipsForPayrun(payrunId, { limit = 100, offset = 0, search }) {
    await this.getPayrunById(payrunId);

    let sql = `
      SELECT 
        ps.id, ps.payrun_id, ps.employee_id, ps.contract_id, ps.worked_days,
        ps.gross_amount, ps.net_amount, ps.risk_score, ps.audit_reasons_json, ps.status,
        ps.created_at, ps.updated_at,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.department, e.job_position, e.email,
        c.wage AS contract_wage
      FROM payslips ps
      JOIN employees e ON ps.employee_id = e.id
      JOIN contracts c ON ps.contract_id = c.id
      WHERE ps.payrun_id = ?
    `;
    const params = [payrunId];

    if (search) {
      sql += ' AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ? OR e.department LIKE ?)';
      const wildcard = `%${search}%`;
      params.push(wildcard, wildcard, wildcard, wildcard);
    }

    sql += ' ORDER BY ps.risk_score DESC, ps.net_amount DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(sql, params);

    return rows.map((row) => ({
      ...row,
      gross_amount: parseFloat(row.gross_amount),
      net_amount: parseFloat(row.net_amount),
      worked_days: parseFloat(row.worked_days),
      risk_score: parseFloat(row.risk_score),
      contract_wage: parseFloat(row.contract_wage),
      audit_reasons_json:
        typeof row.audit_reasons_json === 'string'
          ? JSON.parse(row.audit_reasons_json)
          : row.audit_reasons_json,
    }));
  }

  /**
   * Retrieve single payslip by ID with full calculation breakdown
   */
  async getPayslipById(payslipId) {
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
      const error = new Error(`Payslip ID ${payslipId} not found`);
      error.statusCode = 404;
      throw error;
    }

    const row = rows[0];
    return {
      ...row,
      gross_amount: parseFloat(row.gross_amount),
      net_amount: parseFloat(row.net_amount),
      worked_days: parseFloat(row.worked_days),
      risk_score: parseFloat(row.risk_score),
      contract_wage: parseFloat(row.contract_wage),
      audit_reasons_json:
        typeof row.audit_reasons_json === 'string'
          ? JSON.parse(row.audit_reasons_json)
          : row.audit_reasons_json,
    };
  }
}

module.exports = new PayrunService();
