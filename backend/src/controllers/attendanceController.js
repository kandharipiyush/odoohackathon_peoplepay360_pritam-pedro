const attendanceService = require('../services/attendanceService');

class AttendanceController {
  async checkIn(req, res, next) {
    try {
      const { employee_id, check_in_time } = req.body;
      const record = await attendanceService.checkIn(employee_id, check_in_time);
      return res.status(201).json({
        success: true,
        message: 'Employee checked in successfully',
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkOut(req, res, next) {
    try {
      const { employee_id, check_out_time } = req.body;
      const record = await attendanceService.checkOut(employee_id, check_out_time);
      return res.status(200).json({
        success: true,
        message: 'Employee checked out successfully',
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAttendanceRecords(req, res, next) {
    try {
      const { employee_id, start_date, end_date, status, exception_flag, limit, offset } = req.query;
      const records = await attendanceService.getAttendanceRecords({
        employee_id,
        start_date,
        end_date,
        status,
        exception_flag,
        limit,
        offset,
      });
      return res.status(200).json({
        success: true,
        count: records.length,
        data: records,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAttendanceExceptions(req, res, next) {
    try {
      const { limit, offset } = req.query;
      const records = await attendanceService.getAttendanceExceptions({ limit, offset });
      return res.status(200).json({
        success: true,
        count: records.length,
        data: records,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAttendanceById(req, res, next) {
    try {
      const record = await attendanceService.getAttendanceById(req.params.id);
      return res.status(200).json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  async logManualException(req, res, next) {
    try {
      const { worked_hours, status, exception_flag, notes, action, comment } = req.body;
      const updated = await attendanceService.logManualException(req.params.id, {
        worked_hours,
        status,
        exception_flag,
        notes,
        action,
        comment,
      });
      return res.status(200).json({
        success: true,
        message: 'Attendance record manually updated and reconciled',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AttendanceController();
