const { pool } = require('../config/db');

/**
 * Service managing employee attendance and worked hours tracking
 */
class AttendanceService {
  /**
   * Helper: Format Date to MySQL DATETIME string
   */
  toMySQLDateTime(date = new Date()) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  /**
   * Record employee clock-in
   */
  async checkIn(employeeId, customCheckInTime = null) {
    if (!employeeId) {
      const error = new Error('Field "employee_id" is required');
      error.statusCode = 400;
      throw error;
    }

    // Verify employee exists and is Active
    const [employees] = await pool.query('SELECT id, status FROM employees WHERE id = ?', [employeeId]);
    if (employees.length === 0) {
      const error = new Error(`Employee with ID ${employeeId} not found`);
      error.statusCode = 404;
      throw error;
    }

    // Check if there is already an unclosed check-in for this employee
    const [openSessions] = await pool.query(
      `SELECT id, check_in FROM attendance 
       WHERE employee_id = ? AND check_out IS NULL 
       ORDER BY check_in DESC LIMIT 1`,
      [employeeId]
    );

    if (openSessions.length > 0) {
      const error = new Error(
        `Employee ID ${employeeId} already has an open check-in session (ID: ${openSessions[0].id}, time: ${openSessions[0].check_in}). Please check-out first.`
      );
      error.statusCode = 409;
      throw error;
    }

    const checkInTime = customCheckInTime ? this.toMySQLDateTime(new Date(customCheckInTime)) : this.toMySQLDateTime();

    const [result] = await pool.query(
      `INSERT INTO attendance (employee_id, check_in, status, exception_flag)
       VALUES (?, ?, 'Present', FALSE)`,
      [employeeId, checkInTime]
    );

    return this.getAttendanceById(result.insertId);
  }

  /**
   * Record employee clock-out and calculate worked hours
   */
  async checkOut(employeeId, customCheckOutTime = null) {
    if (!employeeId) {
      const error = new Error('Field "employee_id" is required');
      error.statusCode = 400;
      throw error;
    }

    // Locate the latest active check-in record without a check-out
    const [activeRecords] = await pool.query(
      `SELECT id, check_in FROM attendance 
       WHERE employee_id = ? AND check_out IS NULL 
       ORDER BY check_in DESC LIMIT 1`,
      [employeeId]
    );

    if (activeRecords.length === 0) {
      const error = new Error(`No active check-in record found for employee ID ${employeeId}`);
      error.statusCode = 404;
      throw error;
    }

    const record = activeRecords[0];
    const checkInDate = new Date(record.check_in);
    const checkOutDate = customCheckOutTime ? new Date(customCheckOutTime) : new Date();

    if (checkOutDate <= checkInDate) {
      const error = new Error('Check-out timestamp must be after check-in timestamp');
      error.statusCode = 400;
      throw error;
    }

    // Calculate worked hours (rounded to 2 decimal places)
    const diffMs = checkOutDate.getTime() - checkInDate.getTime();
    const workedHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    // Determine status & exceptions
    let status = 'Present';
    let exceptionFlag = false;

    if (workedHours > 12.0) {
      // Unusually long shift, flag for manager audit
      exceptionFlag = true;
      status = 'Overtime';
    } else if (workedHours >= 8.5) {
      status = 'Overtime';
    } else if (workedHours < 4.0) {
      status = 'Half_Day';
      exceptionFlag = true;
    }

    const checkOutFormatted = this.toMySQLDateTime(checkOutDate);

    await pool.query(
      `UPDATE attendance 
       SET check_out = ?, worked_hours = ?, status = ?, exception_flag = ? 
       WHERE id = ?`,
      [checkOutFormatted, workedHours, status, exceptionFlag, record.id]
    );

    return this.getAttendanceById(record.id);
  }

  /**
   * Get attendance records with multi-dimensional filtering
   */
  async getAttendanceRecords({ employee_id, start_date, end_date, status, exception_flag, limit = 50, offset = 0 }) {
    let sql = `
      SELECT 
        a.id, a.employee_id, a.check_in, a.check_out, a.worked_hours, 
        a.status, a.exception_flag, a.created_at,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.department
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (employee_id) {
      sql += ' AND a.employee_id = ?';
      params.push(employee_id);
    }
    if (start_date) {
      sql += ' AND a.check_in >= ?';
      params.push(`${start_date} 00:00:00`);
    }
    if (end_date) {
      sql += ' AND a.check_in <= ?';
      params.push(`${end_date} 23:59:59`);
    }
    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    if (exception_flag !== undefined) {
      sql += ' AND a.exception_flag = ?';
      params.push(exception_flag === 'true' || exception_flag === true ? 1 : 0);
    }

    sql += ' ORDER BY a.check_in DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  /**
   * Get all pending attendance exceptions requiring manager review
   */
  async getAttendanceExceptions({ limit = 50, offset = 0 } = {}) {
    const [rows] = await pool.query(
      `SELECT 
        a.id, a.employee_id, a.check_in, a.check_out, a.worked_hours, 
        a.status, a.exception_flag, a.created_at,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.department, e.job_position
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE a.exception_flag = 1 OR a.status IN ('Late', 'Half_Day', 'Absent')
      ORDER BY a.check_in DESC 
      LIMIT ? OFFSET ?`,
      [parseInt(limit, 10), parseInt(offset, 10)]
    );
    return rows;
  }

  /**
   * Get single attendance record
   */
  async getAttendanceById(id) {
    const [rows] = await pool.query(
      `SELECT 
        a.id, a.employee_id, a.check_in, a.check_out, a.worked_hours, 
        a.status, a.exception_flag, a.created_at,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.department
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE a.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      const error = new Error(`Attendance record with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    return rows[0];
  }

  /**
   * Manual exception logging and manager correction endpoint
   */
  async logManualException(id, { worked_hours, status, exception_flag, notes, action, comment }) {
    const existing = await this.getAttendanceById(id);

    let finalStatus = existing.status;
    let finalExceptionFlag = existing.exception_flag;
    let finalWorkedHours = existing.worked_hours;

    if (worked_hours !== undefined) {
      finalWorkedHours = parseFloat(worked_hours) || 0;
    }

    const reviewAction = (action || status || '').toUpperCase();

    if (reviewAction === 'RESOLVED' || reviewAction === 'APPROVE' || reviewAction === 'APPROVED') {
      finalExceptionFlag = 0;
      finalStatus = (finalWorkedHours && finalWorkedHours > 8.0) ? 'Overtime' : 'Present';
    } else if (reviewAction === 'REJECT' || reviewAction === 'REJECTED') {
      finalExceptionFlag = 0; // Exception closed
      if (existing.status === 'Present') {
        finalStatus = 'Absent';
      } else {
        finalStatus = existing.status; // Preserve 'Late', 'Half_Day', etc.
      }
    } else if (status) {
      const validStatuses = ['Present', 'Late', 'Early_Departure', 'Overtime', 'Absent', 'Half_Day'];
      const matched = validStatuses.find(s => s.toLowerCase() === status.toLowerCase());
      if (matched) {
        finalStatus = matched;
      }
    }

    if (exception_flag !== undefined) {
      finalExceptionFlag = (exception_flag === true || exception_flag === 1 || exception_flag === '1') ? 1 : 0;
    }

    await pool.query(
      `UPDATE attendance 
       SET worked_hours = ?, status = ?, exception_flag = ? 
       WHERE id = ?`,
      [finalWorkedHours, finalStatus, finalExceptionFlag, id]
    );

    return this.getAttendanceById(id);
  }
}

module.exports = new AttendanceService();
