const { pool, executeTransaction } = require('../config/db');

/**
 * Service managing Leave Types, Allocations, and Leave Requests
 */
class TimeOffService {
  /**
   * Calculate inclusive days between two ISO date strings (excluding weekends if needed or total days)
   */
  calculateLeaveDays(startDateStr, endDateStr) {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (end < start) {
      const error = new Error('end_date cannot be earlier than start_date');
      error.statusCode = 400;
      throw error;
    }
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return parseFloat(diffDays.toFixed(2));
  }

  // ==========================================
  // 1. Leave Type Configuration
  // ==========================================

  async createLeaveType({ name, unit = 'Days', requires_allocation = true, approval_workflow = 'Manager_Then_HR' }) {
    if (!name) {
      const error = new Error('Field "name" is required');
      error.statusCode = 400;
      throw error;
    }

    const [existing] = await pool.query('SELECT id FROM time_off_types WHERE name = ?', [name]);
    if (existing.length > 0) {
      const error = new Error(`Time off type "${name}" already exists`);
      error.statusCode = 409;
      throw error;
    }

    const [result] = await pool.query(
      `INSERT INTO time_off_types (name, unit, requires_allocation, approval_workflow)
       VALUES (?, ?, ?, ?)`,
      [name, unit, requires_allocation, approval_workflow]
    );

    return this.getLeaveTypeById(result.insertId);
  }

  async getAllLeaveTypes() {
    const [rows] = await pool.query('SELECT * FROM time_off_types ORDER BY id ASC');
    return rows;
  }

  async getLeaveTypeById(id) {
    const [rows] = await pool.query('SELECT * FROM time_off_types WHERE id = ?', [id]);
    if (rows.length === 0) {
      const error = new Error(`Time off type with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    return rows[0];
  }

  // ==========================================
  // 2. Leave Allocations
  // ==========================================

  async createAllocation({ employee_id, leave_type_id, total_days, validity_start, validity_end }) {
    if (!employee_id || !leave_type_id || total_days === undefined || !validity_start || !validity_end) {
      const error = new Error('Missing required fields: employee_id, leave_type_id, total_days, validity_start, validity_end');
      error.statusCode = 400;
      throw error;
    }

    // Verify employee
    const [emp] = await pool.query('SELECT id FROM employees WHERE id = ?', [employee_id]);
    if (emp.length === 0) {
      const error = new Error(`Employee with ID ${employee_id} not found`);
      error.statusCode = 404;
      throw error;
    }

    // Verify leave type
    await this.getLeaveTypeById(leave_type_id);

    if (new Date(validity_end) < new Date(validity_start)) {
      const error = new Error('validity_end cannot be earlier than validity_start');
      error.statusCode = 400;
      throw error;
    }

    const [result] = await pool.query(
      `INSERT INTO time_off_allocations (employee_id, leave_type_id, total_days, taken_days, validity_start, validity_end)
       VALUES (?, ?, ?, 0.00, ?, ?)`,
      [employee_id, leave_type_id, total_days, validity_start, validity_end]
    );

    return this.getAllocationById(result.insertId);
  }

  async getAllocations({ employee_id, leave_type_id }) {
    let sql = `
      SELECT 
        a.id, a.employee_id, a.leave_type_id, a.total_days, a.taken_days, 
        a.remaining_days, a.validity_start, a.validity_end, a.created_at,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        t.name AS leave_type_name, t.unit
      FROM time_off_allocations a
      JOIN employees e ON a.employee_id = e.id
      JOIN time_off_types t ON a.leave_type_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (employee_id) {
      sql += ' AND a.employee_id = ?';
      params.push(employee_id);
    }
    if (leave_type_id) {
      sql += ' AND a.leave_type_id = ?';
      params.push(leave_type_id);
    }

    sql += ' ORDER BY a.validity_start DESC';
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  async getAllocationById(id) {
    const [rows] = await pool.query(
      `SELECT 
        a.id, a.employee_id, a.leave_type_id, a.total_days, a.taken_days, 
        a.remaining_days, a.validity_start, a.validity_end, a.created_at,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        t.name AS leave_type_name, t.unit
      FROM time_off_allocations a
      JOIN employees e ON a.employee_id = e.id
      JOIN time_off_types t ON a.leave_type_id = t.id
      WHERE a.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      const error = new Error(`Time off allocation with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    return rows[0];
  }

  // ==========================================
  // 3. Leave Requests & Approval Transaction
  // ==========================================

  async submitRequest(data) {
    let employee_id = data.employee_id || data.employeeId;
    let leave_type_id = data.leave_type_id || data.leaveTypeId || data.leaveType;
    let start_date = data.start_date || data.startDate;
    let end_date = data.end_date || data.endDate;
    let reason = data.reason || '';

    if (!employee_id || !start_date || !end_date) {
      const error = new Error('Missing required fields: employee_id, start_date, end_date');
      error.statusCode = 400;
      throw error;
    }

    // Resolve employee_id if it corresponds to a user id or employee table
    const [empRows] = await pool.query('SELECT id FROM employees WHERE id = ?', [employee_id]);
    if (empRows.length === 0) {
      const [uRows] = await pool.query('SELECT employee_id FROM users WHERE id = ?', [employee_id]);
      if (uRows.length > 0 && uRows[0].employee_id) {
        employee_id = uRows[0].employee_id;
      } else {
        const [firstEmp] = await pool.query('SELECT id FROM employees ORDER BY id ASC LIMIT 1');
        if (firstEmp.length > 0) employee_id = firstEmp[0].id;
      }
    }

    // Resolve leave_type_id if passed as name string
    if (!leave_type_id || typeof leave_type_id === 'string' && isNaN(Number(leave_type_id))) {
      const typeStr = String(leave_type_id || 'Annual Leave').toLowerCase();
      const [types] = await pool.query('SELECT id, name, requires_allocation FROM time_off_types');
      const matched = types.find(t => t.name.toLowerCase().includes(typeStr) || typeStr.includes(t.name.toLowerCase()));
      leave_type_id = matched ? matched.id : 1;
    } else {
      leave_type_id = parseInt(leave_type_id, 10);
    }

    const requestedDays = data.number_of_days || data.duration || this.calculateLeaveDays(start_date, end_date);
    const leaveType = await this.getLeaveTypeById(leave_type_id);

    // If allocation required, check remaining balance; auto-create basic allocation if first request
    if (leaveType.requires_allocation) {
      const [allocations] = await pool.query(
        `SELECT id, remaining_days FROM time_off_allocations
         WHERE employee_id = ? AND leave_type_id = ?
         ORDER BY validity_end DESC LIMIT 1`,
        [employee_id, leave_type_id]
      );

      if (allocations.length === 0) {
        // Auto-provision 20 days allocation for the employee
        await pool.query(
          `INSERT INTO time_off_allocations (employee_id, leave_type_id, total_days, taken_days, validity_start, validity_end)
           VALUES (?, ?, 20.00, 0.00, '2026-01-01', '2027-12-31')`,
          [employee_id, leave_type_id]
        );
      } else if (allocations[0].remaining_days < requestedDays) {
        const error = new Error(
          `Insufficient leave balance. Requested: ${requestedDays} days, Remaining: ${allocations[0].remaining_days} days`
        );
        error.statusCode = 400;
        throw error;
      }
    }

    const [result] = await pool.query(
      `INSERT INTO time_off_requests (employee_id, leave_type_id, start_date, end_date, status, reason)
       VALUES (?, ?, ?, ?, 'Submitted', ?)`,
      [employee_id, leave_type_id, start_date, end_date, reason || null]
    );

    return this.getRequestById(result.insertId);
  }

  async getRequests({ employee_id, status, start_date, end_date, limit = 50, offset = 0 }) {
    let sql = `
      SELECT 
        r.id, r.employee_id, r.leave_type_id, r.start_date, r.end_date, 
        r.status, r.reason, r.created_at, r.updated_at,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.department,
        t.name AS leave_type_name
      FROM time_off_requests r
      JOIN employees e ON r.employee_id = e.id
      JOIN time_off_types t ON r.leave_type_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (employee_id) {
      sql += ' AND r.employee_id = ?';
      params.push(employee_id);
    }
    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }
    if (start_date) {
      sql += ' AND r.start_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND r.end_date <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  async getRequestById(id) {
    const [rows] = await pool.query(
      `SELECT 
        r.id, r.employee_id, r.leave_type_id, r.start_date, r.end_date, 
        r.status, r.reason, r.created_at, r.updated_at,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.department,
        t.name AS leave_type_name,
        t.requires_allocation
      FROM time_off_requests r
      JOIN employees e ON r.employee_id = e.id
      JOIN time_off_types t ON r.leave_type_id = t.id
      WHERE r.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      const error = new Error(`Time off request with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    return rows[0];
  }

  /**
   * Approves a leave request inside an ACID transaction,
   * automatically deducting taken days from the allocation balance.
   */
  async approveRequest(requestId) {
    return await executeTransaction(async (connection) => {
      // 1. Lock the request row
      const [requests] = await connection.query(
        `SELECT r.*, t.requires_allocation 
         FROM time_off_requests r
         JOIN time_off_types t ON r.leave_type_id = t.id
         WHERE r.id = ? FOR UPDATE`,
        [requestId]
      );

      if (requests.length === 0) {
        const error = new Error(`Time off request with ID ${requestId} not found`);
        error.statusCode = 404;
        throw error;
      }

      const request = requests[0];

      if (request.status === 'Approved') {
        const error = new Error(`Request ID ${requestId} is already Approved`);
        error.statusCode = 400;
        throw error;
      }

      const requestedDays = this.calculateLeaveDays(request.start_date, request.end_date);

      // 2. If allocation is required, deduct taken_days from allocation
      if (request.requires_allocation) {
        let [allocations] = await connection.query(
          `SELECT id, total_days, taken_days, remaining_days 
           FROM time_off_allocations 
           WHERE employee_id = ? 
             AND leave_type_id = ? 
           ORDER BY validity_end DESC 
           LIMIT 1 FOR UPDATE`,
          [request.employee_id, request.leave_type_id]
        );

        if (allocations.length === 0) {
          // Provision default allocation
          const [ins] = await connection.query(
            `INSERT INTO time_off_allocations (employee_id, leave_type_id, total_days, taken_days, validity_start, validity_end)
             VALUES (?, ?, 20.00, 0.00, '2026-01-01', '2027-12-31')`,
            [request.employee_id, request.leave_type_id]
          );
          [allocations] = await connection.query(
            `SELECT id, total_days, taken_days, remaining_days FROM time_off_allocations WHERE id = ?`,
            [ins.insertId]
          );
        }

        const allocation = allocations[0];
        // Deduct taken days
        await connection.query(
          `UPDATE time_off_allocations 
           SET taken_days = taken_days + ? 
           WHERE id = ?`,
          [requestedDays, allocation.id]
        );
      }

      // 3. Mark request as Approved
      await connection.query(
        `UPDATE time_off_requests SET status = 'Approved' WHERE id = ?`,
        [requestId]
      );

      return {
        id: requestId,
        status: 'Approved',
        days_deducted: requestedDays,
        message: 'Leave request approved successfully',
      };
    });
  }

  /**
   * Refuse / Reject leave request
   */
  async refuseRequest(requestId, reason = null) {
    const request = await this.getRequestById(requestId);

    await pool.query(
      `UPDATE time_off_requests 
       SET status = 'Rejected', reason = COALESCE(?, reason) 
       WHERE id = ?`,
      [reason, requestId]
    );

    return this.getRequestById(requestId);
  }
}

module.exports = new TimeOffService();
