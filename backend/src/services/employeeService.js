const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * Service handling Employee Master Record Operations
 */
class EmployeeService {
  /**
   * Create a new employee record and optional user credentials
   */
  async createEmployee({ 
    first_name, last_name, email, department, manager_id = null, job_position, status = 'Active',
    role = 'Employee', password = null, wage = 75000, creator_role = null
  }) {
    if (!first_name || !last_name || !email || !department || !job_position) {
      const error = new Error('Missing required fields: first_name, last_name, email, department, job_position');
      error.statusCode = 400;
      throw error;
    }

    // Check email uniqueness in employees and users
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

    // Only Admin can assign privileged HR roles
    let assignedRole = 'Employee';
    const privilegedRoles = ['Admin', 'HR_Manager', 'HR_Payroll_Manager', 'Finance_Auditor'];
    const roleDbMap = {
      'Admin': 'Admin',
      'HR Manager': 'HR_Manager',
      'HR_Manager': 'HR_Manager',
      'HR Payroll Manager': 'HR_Payroll_Manager',
      'HR_Payroll_Manager': 'HR_Payroll_Manager',
      'Finance Auditor': 'Finance_Auditor',
      'Finance_Auditor': 'Finance_Auditor',
      'Employee': 'Employee'
    };
    const targetDbRole = roleDbMap[role] || 'Employee';

    if (privilegedRoles.includes(targetDbRole)) {
      if (creator_role !== 'Admin') {
        assignedRole = 'Employee'; // Non-admin cannot create HR/Admin accounts
      } else {
        assignedRole = targetDbRole;
      }
    } else {
      assignedRole = 'Employee';
    }

    const [result] = await pool.query(
      `INSERT INTO employees (first_name, last_name, email, department, manager_id, job_position, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, department, manager_id || null, job_position, status]
    );

    const empId = result.insertId;

    // If password provided or creating user account
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      await pool.query(
        `INSERT INTO users (employee_id, email, password_hash, role, is_active)
         VALUES (?, ?, ?, ?, TRUE)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role), is_active = TRUE`,
        [empId, email, password_hash, assignedRole]
      );
    }

    // Auto-create active contract and allocations
    try {
      await pool.query(
        `INSERT IGNORE INTO contracts (employee_id, start_date, wage, salary_structure_id, status)
         VALUES (?, CURDATE(), ?, 1, 'Active')`,
        [empId, parseFloat(wage) || 75000]
      );
      await pool.query(
        `INSERT IGNORE INTO time_off_allocations (employee_id, leave_type_id, total_days, taken_days, validity_start, validity_end)
         VALUES (?, 1, 20.00, 0.00, '2026-01-01', '2026-12-31'),
                (?, 2, 10.00, 0.00, '2026-01-01', '2026-12-31')`,
        [empId, empId]
      );
    } catch {
      // Reference tables populated
    }

    return this.getEmployeeById(empId);
  }

  /**
   * Get all pending applicants awaiting HR review
   */
  async getPendingEmployees() {
    const [rows] = await pool.query(`
      SELECT 
        e.id, e.first_name, e.last_name, e.email, e.department, 
        e.job_position AS preferred_position, e.status, e.created_at,
        u.id AS user_id, u.role, u.is_active
      FROM employees e
      LEFT JOIN users u ON u.employee_id = e.id
      WHERE e.status = 'Pending Approval' OR u.is_active = FALSE
      ORDER BY e.created_at DESC
    `);
    return rows;
  }

  /**
   * HR / Admin approves employee applicant and sets official position, department, manager, and starting contract
   */
  async approveEmployee(id, { job_position, department, manager_id = null, role = 'Employee', wage = 75000, allocated_days = 20, approver_role = null }) {
    const employee = await this.getEmployeeById(id);

    const finalPosition = job_position || employee.job_position || 'Software Developer';
    const finalDept = department || employee.department || 'Engineering';

    let finalRole = 'Employee';
    if (approver_role === 'Admin' && ['Admin', 'HR_Manager', 'HR_Payroll_Manager', 'Finance_Auditor'].includes(role)) {
      finalRole = role;
    }

    // 1. Update employee record to Active
    await pool.query(
      `UPDATE employees 
       SET status = 'Active', job_position = ?, department = ?, manager_id = ?
       WHERE id = ?`,
      [finalPosition, finalDept, manager_id || null, id]
    );

    // 2. Activate user credentials
    await pool.query(
      `UPDATE users 
       SET is_active = TRUE, role = ?
       WHERE employee_id = ?`,
      [finalRole, id]
    );

    // 3. Create or update starting active contract
    await pool.query(
      `INSERT INTO contracts (employee_id, start_date, wage, salary_structure_id, status)
       VALUES (?, CURDATE(), ?, 1, 'Active')
       ON DUPLICATE KEY UPDATE wage = VALUES(wage), status = 'Active'`,
      [id, parseFloat(wage) || 75000]
    );

    // 4. Create initial leave allocations
    await pool.query(
      `INSERT INTO time_off_allocations (employee_id, leave_type_id, total_days, taken_days, validity_start, validity_end)
       VALUES (?, 1, ?, 0.00, '2026-01-01', '2026-12-31')
       ON DUPLICATE KEY UPDATE total_days = VALUES(total_days)`,
      [id, parseFloat(allocated_days) || 20]
    );

    return this.getEmployeeById(id);
  }

  /**
   * Reject / Decline employee applicant
   */
  async rejectEmployee(id) {
    await this.getEmployeeById(id);
    await pool.query(`UPDATE employees SET status = 'Terminated' WHERE id = ?`, [id]);
    await pool.query(`UPDATE users SET is_active = FALSE WHERE employee_id = ?`, [id]);
    return { id, rejected: true, message: 'Applicant registration declined' };
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

    if (fieldsToUpdate.length > 0) {
      params.push(id);
      const sql = `UPDATE employees SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
      await pool.query(sql, params);
    }

    try {
      if (updateData.email) {
        await pool.query('UPDATE users SET email = ? WHERE employee_id = ?', [updateData.email, id]);
      }
      if (updateData.status) {
        const isActive = updateData.status === 'Active';
        await pool.query('UPDATE users SET is_active = ? WHERE employee_id = ?', [isActive, id]);
      }
    } catch {
      // User sync optional
    }

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
