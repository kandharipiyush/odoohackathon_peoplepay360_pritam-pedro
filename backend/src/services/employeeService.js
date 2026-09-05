const { pool } = require('../config/db');

/**
 * Service handling Employee Master Record Operations
 */
class EmployeeService {
  /**
   * Create a new employee record
   */
  async createEmployee({ first_name, last_name, email, department, manager_id = null, job_position, status = 'Active' }) {
    if (!first_name || !last_name || !email || !department || !job_position) {
      const error = new Error('Missing required fields: first_name, last_name, email, department, job_position');
      error.statusCode = 400;
      throw error;
    }

    // Check email uniqueness
    const [existing] = await pool.query('SELECT id FROM employees WHERE email = ?', [email]);
    if (existing.length > 0) {
      const error = new Error(`Employee with email "${email}" already exists`);
      error.statusCode = 409;
      throw error;
    }

    // If manager_id provided, verify manager exists
    if (manager_id) {
      const [manager] = await pool.query('SELECT id FROM employees WHERE id = ?', [manager_id]);
      if (manager.length === 0) {
        const error = new Error(`Manager with ID ${manager_id} not found`);
        error.statusCode = 404;
        throw error;
      }
    }

    const [result] = await pool.query(
      `INSERT INTO employees (first_name, last_name, email, department, manager_id, job_position, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, department, manager_id || null, job_position, status]
    );

    return this.getEmployeeById(result.insertId);
  }

  /**
   * Get all employees with optional filters and manager details
   */
  async getAllEmployees({ department, status, search, limit = 50, offset = 0 }) {
    let sql = `
      SELECT 
        e.id, e.first_name, e.last_name, e.email, e.department, 
        e.job_position, e.status, e.created_at, e.updated_at,
        e.manager_id,
        CONCAT(m.first_name, ' ', m.last_name) AS manager_name
      FROM employees e
      LEFT JOIN employees m ON e.manager_id = m.id
      WHERE 1=1
    `;
    const params = [];

    if (department) {
      sql += ' AND e.department = ?';
      params.push(department);
    }
    if (status) {
      sql += ' AND e.status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ? OR e.job_position LIKE ?)';
      const wildcard = `%${search}%`;
      params.push(wildcard, wildcard, wildcard, wildcard);
    }

    sql += ' ORDER BY e.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  /**
   * Get single employee by ID
   */
  async getEmployeeById(id) {
    const [rows] = await pool.query(
      `SELECT 
        e.id, e.first_name, e.last_name, e.email, e.department, 
        e.job_position, e.status, e.created_at, e.updated_at,
        e.manager_id,
        CONCAT(m.first_name, ' ', m.last_name) AS manager_name
      FROM employees e
      LEFT JOIN employees m ON e.manager_id = m.id
      WHERE e.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      const error = new Error(`Employee with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    return rows[0];
  }

  /**
   * Update existing employee record
   */
  async updateEmployee(id, updateData) {
    await this.getEmployeeById(id);

    const allowedFields = ['first_name', 'last_name', 'email', 'department', 'manager_id', 'job_position', 'status'];
    const fieldsToUpdate = [];
    const params = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        if (key === 'manager_id' && value) {
          if (parseInt(value, 10) === parseInt(id, 10)) {
            const error = new Error('An employee cannot be their own manager');
            error.statusCode = 400;
            throw error;
          }
          const [manager] = await pool.query('SELECT id FROM employees WHERE id = ?', [value]);
          if (manager.length === 0) {
            const error = new Error(`Manager with ID ${value} not found`);
            error.statusCode = 404;
            throw error;
          }
        }
        if (key === 'email') {
          const [existing] = await pool.query('SELECT id FROM employees WHERE email = ? AND id != ?', [value, id]);
          if (existing.length > 0) {
            const error = new Error(`Email "${value}" is already taken by another employee`);
            error.statusCode = 409;
            throw error;
          }
        }
        fieldsToUpdate.push(`\`${key}\` = ?`);
        params.push(value);
      }
    }

    if (fieldsToUpdate.length === 0) {
      return this.getEmployeeById(id);
    }

    params.push(id);
    const sql = `UPDATE employees SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    await pool.query(sql, params);

    return this.getEmployeeById(id);
  }

  /**
   * Delete employee record
   */
  async deleteEmployee(id) {
    await this.getEmployeeById(id);
    await pool.query('DELETE FROM employees WHERE id = ?', [id]);
    return { id: parseInt(id, 10), deleted: true };
  }
}

module.exports = new EmployeeService();
