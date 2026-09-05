const { pool } = require('../config/db');
const logger = require('../utils/logger');

/**
 * Attendance & Leave-to-Payroll Hooks Service
 * Programmatically computes salary parameter adjustments based on unapproved absences,
 * late arrivals, early departures, and approved unpaid leave hours.
 */
class AttendanceHookService {
  /**
   * Helper: Parse Date to YYYY-MM-DD
   */
  toDateString(date) {
    return new Date(date).toISOString().slice(0, 10);
  }

  /**
   * Calculates comprehensive attendance and leave monetary adjustments for an employee in a pay cycle
   * @param {number} employeeId - Employee ID
   * @param {string} periodStart - Period start date (YYYY-MM-DD)
   * @param {string} periodEnd - Period end date (YYYY-MM-DD)
   */
  async calculateAttendanceAdjustments(employeeId, periodStart, periodEnd) {
    // 1. Fetch Employee and Active Contract
    const [employees] = await pool.query('SELECT id, first_name, last_name, department FROM employees WHERE id = ?', [
      employeeId,
    ]);
    if (employees.length === 0) {
      const error = new Error(`Employee ID ${employeeId} not found`);
      error.statusCode = 404;
      throw error;
    }
    const employee = employees[0];

    const [contracts] = await pool.query(
      `SELECT c.id, c.wage, c.salary_structure_id 
       FROM contracts c 
       WHERE c.employee_id = ? AND c.status = 'Active' 
         AND c.start_date <= ? AND (c.end_date IS NULL OR c.end_date >= ?)
       LIMIT 1`,
      [employeeId, periodEnd, periodStart]
    );

    if (contracts.length === 0) {
      const error = new Error(`No active contract found for employee ID ${employeeId} in period ${periodStart} to ${periodEnd}`);
      error.statusCode = 400;
      throw error;
    }
    const contract = contracts[0];
    const baseWage = parseFloat(contract.wage);

    // 2. Determine all expected business working days (Mon-Fri) in the period
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const businessDays = [];

    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays.push(this.toDateString(current));
      }
      current.setDate(current.getDate() + 1);
    }

    const standardWorkingDays = businessDays.length > 0 ? businessDays.length : 1;
    const dailyRate = parseFloat((baseWage / standardWorkingDays).toFixed(2));
    const hourlyRate = parseFloat((dailyRate / 8.0).toFixed(2)); // Standard 8h shift assumption

    // 3. Fetch all attendance logs for the period
    const [attendanceRows] = await pool.query(
      `SELECT id, check_in, check_out, worked_hours, status, exception_flag 
       FROM attendance 
       WHERE employee_id = ? 
         AND check_in >= ? 
         AND check_in <= ?`,
      [employeeId, `${periodStart} 00:00:00`, `${periodEnd} 23:59:59`]
    );

    const attendedDatesMap = new Map();
    let totalWorkedHours = 0;
    let lateMinutesTotal = 0;
    let lateArrivalsCount = 0;
    let earlyMinutesTotal = 0;
    let earlyDeparturesCount = 0;
    let overtimeHours = 0;

    attendanceRows.forEach((att) => {
      if (att.check_in) {
        const checkInDate = new Date(att.check_in);
        const dateKey = this.toDateString(checkInDate);
        attendedDatesMap.set(dateKey, att);

        const hours = parseFloat(att.worked_hours || 0);
        totalWorkedHours += hours;

        if (hours > 8.0) {
          overtimeHours += hours - 8.0;
        }

        // Standard shift start assumed at 09:00 local time
        // 15-minute grace threshold: after 09:15 is considered late
        const checkInHour = checkInDate.getHours();
        const checkInMinute = checkInDate.getMinutes();
        const checkInTotalMin = checkInHour * 60 + checkInMinute;
        const shiftStartMin = 9 * 60; // 09:00 AM

        if (checkInTotalMin > shiftStartMin + 15) {
          lateArrivalsCount++;
          lateMinutesTotal += checkInTotalMin - shiftStartMin;
        }

        // Standard shift end assumed at 17:00 local time
        if (att.check_out) {
          const checkOutDate = new Date(att.check_out);
          const checkOutTotalMin = checkOutDate.getHours() * 60 + checkOutDate.getMinutes();
          const shiftEndMin = 17 * 60; // 05:00 PM

          if (checkOutTotalMin < shiftEndMin - 15) {
            earlyDeparturesCount++;
            earlyMinutesTotal += shiftEndMin - checkOutTotalMin;
          }
        }
      }
    });

    // 4. Fetch all approved leave requests covering this period
    const [leaveRows] = await pool.query(
      `SELECT r.id, r.start_date, r.end_date, r.status, t.name AS leave_type_name, t.requires_allocation 
       FROM time_off_requests r
       JOIN time_off_types t ON r.leave_type_id = t.id
       WHERE r.employee_id = ? 
         AND r.status = 'Approved' 
         AND r.start_date <= ? 
         AND r.end_date >= ?`,
      [employeeId, periodEnd, periodStart]
    );

    const paidLeaveDates = new Set();
    const unpaidLeaveDates = new Set();

    leaveRows.forEach((l) => {
      const lStart = new Date(Math.max(new Date(l.start_date).getTime(), start.getTime()));
      const lEnd = new Date(Math.min(new Date(l.end_date).getTime(), end.getTime()));
      const iter = new Date(lStart);

      const isPaid = l.requires_allocation || !l.leave_type_name.toLowerCase().includes('unpaid');

      while (iter <= lEnd) {
        const dayStr = this.toDateString(iter);
        if (businessDays.includes(dayStr)) {
          if (isPaid) {
            paidLeaveDates.add(dayStr);
          } else {
            unpaidLeaveDates.add(dayStr);
          }
        }
        iter.setDate(iter.getDate() + 1);
      }
    });

    // 5. Detect Unapproved Absences
    // Any business day without attendance and without approved leave
    const unapprovedAbsenceDates = [];

    businessDays.forEach((bDay) => {
      const hasAttended = attendedDatesMap.has(bDay);
      const onPaidLeave = paidLeaveDates.has(bDay);
      const onUnpaidLeave = unpaidLeaveDates.has(bDay);

      if (!hasAttended && !onPaidLeave && !onUnpaidLeave) {
        unapprovedAbsenceDates.push(bDay);
      }
    });

    const unapprovedAbsentDays = unapprovedAbsenceDates.length;
    const unpaidLeaveDays = unpaidLeaveDates.size;
    const paidLeaveDays = paidLeaveDates.size;

    // 6. Monetary Calculations
    const unapprovedAbsenceDeduction = parseFloat((unapprovedAbsentDays * dailyRate).toFixed(2));
    const unpaidLeaveDeduction = parseFloat((unpaidLeaveDays * dailyRate).toFixed(2));

    // Tardiness deduction: calculated at hourly rate for net late hours beyond grace
    const tardinessDeduction = parseFloat(((lateMinutesTotal / 60.0) * hourlyRate).toFixed(2));

    // Overtime pay: 1.5x standard hourly wage rate
    const overtimePay = parseFloat((overtimeHours * hourlyRate * 1.5).toFixed(2));

    const totalDeductions = parseFloat((unapprovedAbsenceDeduction + unpaidLeaveDeduction + tardinessDeduction).toFixed(2));
    const netAdjustment = parseFloat((overtimePay - totalDeductions).toFixed(2));

    return {
      employee_id: employee.id,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      department: employee.department,
      period_start: periodStart,
      period_end: periodEnd,
      rates: {
        base_wage: baseWage,
        standard_working_days: standardWorkingDays,
        daily_rate: dailyRate,
        hourly_rate: hourlyRate,
      },
      time_metrics: {
        total_worked_hours: parseFloat(totalWorkedHours.toFixed(2)),
        attended_days: attendedDatesMap.size,
        paid_leave_days: paidLeaveDays,
        unpaid_leave_days: unpaidLeaveDays,
        unapproved_absent_days: unapprovedAbsentDays,
        unapproved_absence_dates: unapprovedAbsenceDates,
        late_arrivals_count: lateArrivalsCount,
        late_minutes_total: lateMinutesTotal,
        early_departures_count: earlyDeparturesCount,
        early_minutes_total: earlyMinutesTotal,
        overtime_hours: parseFloat(overtimeHours.toFixed(2)),
      },
      financial_adjustments: {
        unapproved_absence_deduction: unapprovedAbsenceDeduction,
        unpaid_leave_deduction: unpaidLeaveDeduction,
        tardiness_deduction: tardinessDeduction,
        total_penalties: totalDeductions,
        overtime_allowance: overtimePay,
        net_attendance_adjustment: netAdjustment,
      },
    };
  }

  /**
   * Aggregates attendance adjustments across all employees in a payrun
   */
  async getAttendanceSummaryForPayrun(payrunId) {
    const [payruns] = await pool.query('SELECT * FROM payruns WHERE id = ?', [payrunId]);
    if (payruns.length === 0) {
      const error = new Error(`Payrun ID ${payrunId} not found`);
      error.statusCode = 404;
      throw error;
    }
    const payrun = payruns[0];

    const [payslips] = await pool.query('SELECT employee_id FROM payslips WHERE payrun_id = ?', [payrunId]);

    const adjustments = [];
    let totalUnapprovedAbsenceDeductions = 0;
    let totalUnpaidLeaveDeductions = 0;
    let totalTardinessDeductions = 0;
    let totalOvertimePay = 0;

    for (const ps of payslips) {
      const adj = await this.calculateAttendanceAdjustments(
        ps.employee_id,
        payrun.period_start,
        payrun.period_end
      );
      adjustments.push(adj);

      totalUnapprovedAbsenceDeductions += adj.financial_adjustments.unapproved_absence_deduction;
      totalUnpaidLeaveDeductions += adj.financial_adjustments.unpaid_leave_deduction;
      totalTardinessDeductions += adj.financial_adjustments.tardiness_deduction;
      totalOvertimePay += adj.financial_adjustments.overtime_allowance;
    }

    return {
      payrun_id: parseInt(payrunId, 10),
      payrun_name: payrun.name,
      period_start: payrun.period_start,
      period_end: payrun.period_end,
      total_employees: adjustments.length,
      aggregate_financials: {
        total_unapproved_absence_deductions: parseFloat(totalUnapprovedAbsenceDeductions.toFixed(2)),
        total_unpaid_leave_deductions: parseFloat(totalUnpaidLeaveDeductions.toFixed(2)),
        total_tardiness_deductions: parseFloat(totalTardinessDeductions.toFixed(2)),
        total_overtime_pay: parseFloat(totalOvertimePay.toFixed(2)),
        net_attendance_impact: parseFloat(
          (totalOvertimePay - (totalUnapprovedAbsenceDeductions + totalUnpaidLeaveDeductions + totalTardinessDeductions)).toFixed(2)
        ),
      },
      employee_adjustments: adjustments,
    };
  }
}

module.exports = new AttendanceHookService();
