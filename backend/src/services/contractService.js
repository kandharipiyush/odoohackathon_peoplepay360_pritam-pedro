const { pool } = require('../config/db');

/**
 * Service managing employee contracts with period-binding validation
 */
class ContractService {
  /**
   * Helper: Check for overlapping active contracts for an employee
   */
  async checkOverlappingContracts(employeeId, startDate, endDate = null, excludeContractId = null) {
    const effectiveEnd = endDate || '9999-12-31';

    let sql = `
      SELECT id, start_date, end_date, wage, status
      FROM contracts
      WHERE employee_id = ?
        AND status = 'Active'
        AND (start_date <= ?)
        AND (COALESCE(end_date, '9999-12-31') >= ?)
    `;
    const params = [employeeId, effectiveEnd, startDate];

    if (excludeContractId) {
      sql += ' AND id != ?';
      params.push(excludeContractId);
    }

    const [conflicts] = await pool.query(sql, params);
    return conflicts;
  }

  /**
   * Create a new contract
   */
  async createContract({ employee_id, start_date, end_date = null, wage, salary_structure_id, status = 'Draft' }) {
    if (!employee_id || !start_date || wage === undefined || !salary_structure_id) {
      const error = new Error('Missing required fields: employee_id, start_date, wage, salary_structure_id');
      error.statusCode = 400;
      throw error;
    }

    // Validate employee exists
    const [emp] = await pool.query('SELECT id FROM employees WHERE id = ?', [employee_id]);
    if (emp.length === 0) {
      const error = new Error(`Employee with ID ${employee_id} not found`);
      error.statusCode = 404;
      throw error;
    }

    // Validate salary structure exists
    const [struct] = await pool.query('SELECT id, is_active FROM salary_structures WHERE id = ?', [salary_structure_id]);
    if (struct.length === 0) {
      const error = new Error(`Salary structure with ID ${salary_structure_id} not found`);
      error.statusCode = 404;
      throw error;
    }

    // Validate date sequence if end_date provided
    if (end_date && new Date(end_date) < new Date(start_date)) {
      const error = new Error('Contract end_date cannot be earlier than start_date');
      error.statusCode = 400;
      throw error;
    }

    // Prevent concurrent active contracts
    if (status === 'Active') {
      const conflicts = await this.checkOverlappingContracts(employee_id, start_date, end_date);
      if (conflicts.length > 0) {
        const error = new Error(
          `Cannot create active contract: Conflicts with existing active contract ID ${conflicts[0].id} (${conflicts[0].start_date} to ${conflicts[0].end_date || 'indefinite'})`
        );
        error.statusCode = 409;
        throw error;
      }
    }

    const [result] = await pool.query(
      `INSERT INTO contracts (employee_id, start_date, end_date, wage, salary_structure_id, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [employee_id, start_date, end_date || null, wage, salary_structure_id, status]
    );

    return this.getContractById(result.insertId);
  }

  /**
   * Get all contracts with optional filters
   */
  async getAllContracts({ employee_id, status, limit = 50, offset = 0 }) {
    let sql = `
      SELECT 
        c.id, c.employee_id, c.start_date, c.end_date, c.wage, 
        c.salary_structure_id, c.status, c.created_at, c.updated_at,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.department,
        s.name AS salary_structure_name
      FROM contracts c
      JOIN employees e ON c.employee_id = e.id
      JOIN salary_structures s ON c.salary_structure_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (employee_id) {
      sql += ' AND c.employee_id = ?';
      params.push(employee_id);
    }
    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY c.start_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  /**
   * Get contract by ID
   */
  async getContractById(id) {
    const [rows] = await pool.query(
      `SELECT 
        c.id, c.employee_id, c.start_date, c.end_date, c.wage, 
        c.salary_structure_id, c.status, c.created_at, c.updated_at,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.department,
        s.name AS salary_structure_name
      FROM contracts c
      JOIN employees e ON c.employee_id = e.id
      JOIN salary_structures s ON c.salary_structure_id = s.id
      WHERE c.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      const error = new Error(`Contract with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    return rows[0];
  }

  /**
   * Get contracts for a specific employee
   */
  async getContractsByEmployee(employeeId) {
    return this.getAllContracts({ employee_id: employeeId, limit: 100, offset: 0 });
  }

  /**
   * Strict period binding: Get the active contract for an employee binding to a specific date or timeframe
   */
  async getActiveContractForDate(employeeId, targetDate) {
    const checkDate = targetDate || new Date().toISOString().slice(0, 10);

    const [rows] = await pool.query(
      `SELECT 
        c.id, c.employee_id, c.start_date, c.end_date, c.wage, 
        c.salary_structure_id, c.status,
        s.name AS salary_structure_name
      FROM contracts c
      JOIN salary_structures s ON c.salary_structure_id = s.id
      WHERE c.employee_id = ?
        AND c.status = 'Active'
        AND c.start_date <= ?
        AND (c.end_date IS NULL OR c.end_date >= ?)
      LIMIT 1`,
      [employeeId, checkDate, checkDate]
    );

    if (rows.length === 0) {
      const error = new Error(`No active contract found for employee ID ${employeeId} on date ${checkDate}`);
      error.statusCode = 404;
      throw error;
    }

    return rows[0];
  }

  /**
   * Update contract details with overlap safety
   */
  async updateContract(id, updateData) {
    const existing = await this.getContractById(id);

    const targetEmployeeId = updateData.employee_id || existing.employee_id;
    const targetStartDate = updateData.start_date || existing.start_date;
    const targetEndDate = updateData.end_date !== undefined ? updateData.end_date : existing.end_date;
    const targetStatus = updateData.status || existing.status;

    if (targetEndDate && new Date(targetEndDate) < new Date(targetStartDate)) {
      const error = new Error('Contract end_date cannot be earlier than start_date');
      error.statusCode = 400;
      throw error;
    }

    // Check for overlap conflicts if active
    if (targetStatus === 'Active') {
      const conflicts = await this.checkOverlappingContracts(
        targetEmployeeId,
        targetStartDate,
        targetEndDate,
        id
      );
      if (conflicts.length > 0) {
        const error = new Error(
          `Cannot update to Active: Conflicts with existing active contract ID ${conflicts[0].id} (${conflicts[0].start_date} to ${conflicts[0].end_date || 'indefinite'})`
        );
        error.statusCode = 409;
        throw error;
      }
    }

    const allowedFields = ['start_date', 'end_date', 'wage', 'salary_structure_id', 'status'];
    const fieldsToUpdate = [];
    const params = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        fieldsToUpdate.push(`\`${key}\` = ?`);
        params.push(value);
      }
    }

    if (fieldsToUpdate.length > 0) {
      params.push(id);
      await pool.query(`UPDATE contracts SET ${fieldsToUpdate.join(', ')} WHERE id = ?`, params);
    }

    return this.getContractById(id);
  }

  /**
   * Delete contract
   */
  async deleteContract(id) {
    await this.getContractById(id);
    await pool.query('DELETE FROM contracts WHERE id = ?', [id]);
    return { id: parseInt(id, 10), deleted: true };
  }
}

module.exports = new ContractService();
