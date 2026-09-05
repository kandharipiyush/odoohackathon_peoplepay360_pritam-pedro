const { pool } = require('../config/db');
const logger = require('../utils/logger');

/**
 * Safe Math Expression Evaluator
 * Recursive descent parser supporting +, -, *, /, (), floating point numbers, and identifiers.
 * Replaces any unsafe eval() or Function constructors.
 */
class SafeExpressionEvaluator {
  static evaluate(expression, context = {}) {
    if (!expression || typeof expression !== 'string') return 0;

    // Tokenize
    const tokens = [];
    let i = 0;
    const str = expression.trim();

    while (i < str.length) {
      const char = str[i];

      if (/\s/.test(char)) {
        i++;
        continue;
      }

      if (char === '+' || char === '-' || char === '*' || char === '/' || char === '(' || char === ')') {
        tokens.push({ type: 'OP', value: char });
        i++;
        continue;
      }

      // Numbers
      if (/[\d.]/.test(char)) {
        let numStr = '';
        while (i < str.length && /[\d.]/.test(str[i])) {
          numStr += str[i];
          i++;
        }
        tokens.push({ type: 'NUM', value: parseFloat(numStr) });
        continue;
      }

      // Identifiers (variable names like BASIC, HRA, GROSS, etc.)
      if (/[a-zA-Z_]/.test(char)) {
        let idStr = '';
        while (i < str.length && /[a-zA-Z0-9_]/.test(str[i])) {
          idStr += str[i];
          i++;
        }
        const val = context[idStr] !== undefined ? context[idStr] : 0;
        tokens.push({ type: 'NUM', value: parseFloat(val) || 0 });
        continue;
      }

      // Unknown character, skip
      i++;
    }

    let pos = 0;

    const peek = () => tokens[pos];
    const consume = () => tokens[pos++];

    const parseFactor = () => {
      let token = peek();
      if (!token) return 0;

      // Handle unary +/-
      if (token.type === 'OP' && (token.value === '+' || token.value === '-')) {
        consume();
        const sign = token.value === '-' ? -1 : 1;
        return sign * parseFactor();
      }

      if (token.type === 'OP' && token.value === '(') {
        consume(); // consume '('
        const result = parseExpression();
        if (peek() && peek().value === ')') {
          consume(); // consume ')'
        }
        return result;
      }

      if (token.type === 'NUM') {
        consume();
        return token.value;
      }

      return 0;
    };

    const parseTerm = () => {
      let left = parseFactor();
      while (peek() && peek().type === 'OP' && (peek().value === '*' || peek().value === '/')) {
        const op = consume().value;
        const right = parseFactor();
        if (op === '*') {
          left = left * right;
        } else if (op === '/') {
          left = right !== 0 ? left / right : 0;
        }
      }
      return left;
    };

    const parseExpression = () => {
      let left = parseTerm();
      while (peek() && peek().type === 'OP' && (peek().value === '+' || peek().value === '-')) {
        const op = consume().value;
        const right = parseTerm();
        if (op === '+') {
          left = left + right;
        } else if (op === '-') {
          left = left - right;
        }
      }
      return left;
    };

    const output = parseExpression();
    return isNaN(output) ? 0 : parseFloat(output.toFixed(2));
  }
}

/**
 * Sequenced Salary Calculation Engine & Payroll Intelligence Service
 */
class PayrollService {
  /**
   * Helper to count standard working weekdays (Mon-Fri) in a date range
   */
  calculateWorkingDays(startDateStr, endDateStr) {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    let count = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Monday - Friday
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count > 0 ? count : 1;
  }

  /**
   * Calculate standard progressive income tax / TDS
   * Bracket computation logic for monthly compensation:
   * 0 - 25,000: 0%
   * 25,001 - 50,000: 5%
   * 50,001 - 100,000: 1,250 + 10%
   * Above 100,000: 6,250 + 20%
   */
  calculateStandardTDS(taxableAmount) {
    const amount = Math.max(0, taxableAmount);
    if (amount <= 25000) return 0;
    if (amount <= 50000) return parseFloat(((amount - 25000) * 0.05).toFixed(2));
    if (amount <= 100000) return parseFloat((1250 + (amount - 50000) * 0.1).toFixed(2));
    return parseFloat((6250 + (amount - 100000) * 0.2).toFixed(2));
  }

  /**
   * Executes a single salary rule dynamically based on computation type
   * @param {Object} rule - Salary rule record
   * @param {number} contractWage - Base wage on contract
   * @param {Object} context - Computed values of prior sequenced rules
   * @param {number} prorationFactor - Working days proration (0.0 to 1.0)
   */
  evaluateRule(rule, contractWage, context, prorationFactor = 1.0) {
    const compType = rule.computation_type;
    const rawVal = rule.computation_value ? rule.computation_value.trim() : '';

    switch (compType) {
      case 'Fixed': {
        const parsed = parseFloat(rawVal) || 0;
        return parseFloat((parsed * prorationFactor).toFixed(2));
      }

      case 'Percentage': {
        // Patterns supported:
        // "100.00% of Contract Wage" | "40.00% of BASIC" | "12% of BASIC" | "15%"
        const match = rawVal.match(/^([\d.]+)\s*%(?:\s+of\s+([A-Za-z0-9_]+(?:\s+[A-Za-z0-9_]+)*))?/i);
        if (match) {
          const percentage = parseFloat(match[1]) / 100.0;
          const targetRef = match[2] ? match[2].trim().toUpperCase() : 'CONTRACT WAGE';

          let baseAmount = contractWage;
          if (targetRef === 'CONTRACT WAGE' || targetRef === 'WAGE') {
            baseAmount = contractWage;
          } else if (context[targetRef] !== undefined) {
            baseAmount = context[targetRef];
          } else if (context['BASIC'] !== undefined) {
            baseAmount = context['BASIC'];
          }

          return parseFloat((baseAmount * percentage * prorationFactor).toFixed(2));
        }

        // Fallback simple numeric percentage of contract wage
        const simpleNum = parseFloat(rawVal);
        if (!isNaN(simpleNum)) {
          return parseFloat((contractWage * (simpleNum / 100.0) * prorationFactor).toFixed(2));
        }
        return 0;
      }

      case 'Formula': {
        // Evaluate mathematical formula against context containing previously evaluated rules
        return SafeExpressionEvaluator.evaluate(rawVal, context);
      }

      case 'SQL_Formula':
      case 'Python_Code': {
        if (rawVal.toUpperCase().includes('STANDARD_BRACKET_CALC') || rawVal.toUpperCase().includes('TAX')) {
          const taxableBase = context['GROSS'] || context['BASIC'] || contractWage;
          return this.calculateStandardTDS(taxableBase);
        }

        // Attempt formula evaluation if valid math expression provided
        return SafeExpressionEvaluator.evaluate(rawVal, context);
      }

      default:
        return 0;
    }
  }

  /**
   * Fetch historical 3-month rolling payslips to assess AI Anomaly & Fraud Risk
   */
  async assessAnomalyAndRisk(employeeId, currentGross, currentNet, attendedDays, unpaidLeaveDays, db = pool) {
    const auditReasons = [];
    let riskScore = 0.0;

    // 1. Fetch up to 3 recent previous payslips for baseline comparison
    const [historical] = await db.query(
      `SELECT gross_amount, net_amount, worked_days, created_at 
       FROM payslips 
       WHERE employee_id = ? AND status IN ('Computed', 'Audited', 'Confirmed', 'Paid')
       ORDER BY created_at DESC LIMIT 3`,
      [employeeId]
    );

    if (historical.length > 0) {
      const sumGross = historical.reduce((acc, p) => acc + parseFloat(p.gross_amount), 0);
      const avgGross = sumGross / historical.length;

      if (avgGross > 0) {
        const variancePct = ((currentGross - avgGross) / avgGross) * 100;
        if (variancePct > 25.0) {
          auditReasons.push(
            `Unusual salary spike: Gross compensation is ${variancePct.toFixed(1)}% higher than 3-month rolling average (${avgGross.toFixed(2)})`
          );
          riskScore += 35.0;
        } else if (variancePct < -30.0) {
          auditReasons.push(
            `Significant wage drop: Gross compensation is ${Math.abs(variancePct).toFixed(1)}% below 3-month rolling average (${avgGross.toFixed(2)})`
          );
          riskScore += 20.0;
        }
      }
    }

    // 2. Unpaid leave impact audit
    if (unpaidLeaveDays > 3) {
      auditReasons.push(
        `High unpaid leave count: ${unpaidLeaveDays} unpaid leave days deducted from payable period`
      );
      riskScore += 15.0;
    }

    // 3. Negative or zero net amount warning
    if (currentNet <= 0) {
      auditReasons.push(
        `Zero/Negative Net Pay: Total deductions (${(currentGross - currentNet).toFixed(2)}) exceed or equal gross earnings (${currentGross.toFixed(2)})`
      );
      riskScore += 50.0;
    }

    // 4. Low attendance anomaly
    if (attendedDays === 0 && unpaidLeaveDays === 0) {
      auditReasons.push('Zero attendance clock-in records found for this period; default contract schedule applied');
      riskScore += 5.0;
    }

    // Cap risk score between 0 and 100
    riskScore = Math.min(100.0, Math.max(0.0, parseFloat(riskScore.toFixed(2))));

    return {
      riskScore,
      auditReasons,
    };
  }

  /**
   * Main Engine: Calculates salary for a single employee for a specific pay period
   * @param {number} employeeId - ID of employee
   * @param {string} periodStart - Period start date (YYYY-MM-DD)
   * @param {string} periodEnd - Period end date (YYYY-MM-DD)
   * @param {number|null} requestedStructureId - Optional salary structure override
   * @param {Object} db - Pool or leased transaction connection
   */
  async calculateSalaryForEmployee(employeeId, periodStart, periodEnd, requestedStructureId = null, db = pool) {
    // 1. Fetch Employee Record
    const [employees] = await db.query(
      `SELECT id, first_name, last_name, email, department, job_position, status 
       FROM employees WHERE id = ?`,
      [employeeId]
    );

    if (employees.length === 0) {
      const error = new Error(`Employee ID ${employeeId} not found`);
      error.statusCode = 404;
      throw error;
    }
    const employee = employees[0];

    // 2. Fetch Active Contract binding strictly to the pay period
    const [contracts] = await db.query(
      `SELECT c.id, c.employee_id, c.start_date, c.end_date, c.wage, c.salary_structure_id, c.status,
              s.name AS salary_structure_name
       FROM contracts c
       JOIN salary_structures s ON c.salary_structure_id = s.id
       WHERE c.employee_id = ?
         AND c.status = 'Active'
         AND c.start_date <= ?
         AND (c.end_date IS NULL OR c.end_date >= ?)
       ORDER BY c.start_date DESC LIMIT 1`,
      [employeeId, periodEnd, periodStart]
    );

    if (contracts.length === 0) {
      const error = new Error(
        `Employee ${employee.first_name} ${employee.last_name} (ID: ${employeeId}) has no active contract for period ${periodStart} to ${periodEnd}`
      );
      error.statusCode = 400;
      throw error;
    }
    const contract = contracts[0];
    const contractWage = parseFloat(contract.wage);
    const structureId = requestedStructureId || contract.salary_structure_id;

    // 3. Attendance Analysis for the period
    const [attendanceRows] = await db.query(
      `SELECT id, check_in, check_out, worked_hours, status, exception_flag
       FROM attendance
       WHERE employee_id = ? 
         AND check_in >= ? 
         AND check_in <= ?`,
      [employeeId, `${periodStart} 00:00:00`, `${periodEnd} 23:59:59`]
    );

    // Count distinct attended days
    const attendedDatesSet = new Set();
    let totalWorkedHours = 0;
    let hasAttendanceExceptions = false;

    attendanceRows.forEach((att) => {
      if (att.check_in) {
        attendedDatesSet.add(new Date(att.check_in).toISOString().slice(0, 10));
      }
      totalWorkedHours += parseFloat(att.worked_hours || 0);
      if (att.exception_flag) hasAttendanceExceptions = true;
    });

    const attendedDays = attendedDatesSet.size;

    // 4. Approved Time-off Requests Analysis for the period
    const [leaveRows] = await db.query(
      `SELECT r.id, r.start_date, r.end_date, r.status, t.name AS leave_type_name, t.requires_allocation
       FROM time_off_requests r
       JOIN time_off_types t ON r.leave_type_id = t.id
       WHERE r.employee_id = ?
         AND r.status = 'Approved'
         AND r.start_date <= ?
         AND r.end_date >= ?`,
      [employeeId, periodEnd, periodStart]
    );

    let paidLeaveDays = 0;
    let unpaidLeaveDays = 0;

    leaveRows.forEach((leave) => {
      // Calculate overlap between [leave.start_date, leave.end_date] and [periodStart, periodEnd]
      const oStart = new Date(Math.max(new Date(leave.start_date).getTime(), new Date(periodStart).getTime()));
      const oEnd = new Date(Math.min(new Date(leave.end_date).getTime(), new Date(periodEnd).getTime()));
      let days = 0;
      if (oEnd >= oStart) {
        days = Math.ceil(Math.abs(oEnd - oStart) / (1000 * 60 * 60 * 24)) + 1;
      }

      if (leave.requires_allocation || !leave.leave_type_name.toLowerCase().includes('unpaid')) {
        paidLeaveDays += days;
      } else {
        unpaidLeaveDays += days;
      }
    });

    // 5. Work Days & Proration Calculation
    const standardWorkingDays = this.calculateWorkingDays(periodStart, periodEnd);

    // If attendance logs exist, worked_days is attended days + paid leave days;
    // Otherwise fallback to standard working days minus unpaid leave days
    let workedDays = 0;
    let prorationFactor = 1.0;

    if (attendanceRows.length > 0) {
      workedDays = attendedDays + paidLeaveDays;
      prorationFactor = standardWorkingDays > 0 ? Math.min(1.0, Math.max(0.0, workedDays / standardWorkingDays)) : 1.0;
    } else {
      workedDays = Math.max(0, standardWorkingDays - unpaidLeaveDays);
      prorationFactor = standardWorkingDays > 0 ? Math.min(1.0, Math.max(0.0, workedDays / standardWorkingDays)) : 1.0;
    }

    // 6. Fetch Salary Rules in Strict Sequence Order
    const [rules] = await db.query(
      `SELECT id, structure_id, name, code, category, sequence, computation_type, computation_value
       FROM salary_rules
       WHERE structure_id = ?
       ORDER BY sequence ASC`,
      [structureId]
    );

    if (rules.length === 0) {
      const error = new Error(`Salary structure ID ${structureId} has no configured salary rules`);
      error.statusCode = 400;
      throw error;
    }

    // 7. Sequenced Execution of Salary Rules
    // Context dictionary holds computed outputs accessible by subsequent formulas
    const context = {
      WAGE: contractWage,
      CONTRACT_WAGE: contractWage,
      WORKED_DAYS: workedDays,
      STANDARD_DAYS: standardWorkingDays,
      PRORATION_FACTOR: prorationFactor,
    };

    const breakdownLines = [];
    let grossTotal = 0;
    let deductionsTotal = 0;

    for (const rule of rules) {
      const computedAmount = this.evaluateRule(rule, contractWage, context, prorationFactor);
      const roundedAmount = parseFloat(computedAmount.toFixed(2));

      // Store in context by rule code
      context[rule.code] = roundedAmount;

      breakdownLines.push({
        rule_id: rule.id,
        sequence: rule.sequence,
        code: rule.code,
        name: rule.name,
        category: rule.category,
        computation_type: rule.computation_type,
        computation_value: rule.computation_value,
        amount: roundedAmount,
      });

      // Track categories
      if (rule.category === 'Basic' || rule.category === 'Allowance') {
        grossTotal += roundedAmount;
      } else if (rule.category === 'Deduction') {
        deductionsTotal += roundedAmount;
      }
    }

    // Determine definitive Gross and Net amounts
    const grossAmount =
      context['GROSS'] !== undefined ? parseFloat(context['GROSS'].toFixed(2)) : parseFloat(grossTotal.toFixed(2));

    const netAmount =
      context['NET'] !== undefined
        ? parseFloat(context['NET'].toFixed(2))
        : parseFloat(Math.max(0, grossAmount - deductionsTotal).toFixed(2));

    // 8. AI Anomaly & Fraud Risk Assessment
    const { riskScore, auditReasons } = await this.assessAnomalyAndRisk(
      employeeId,
      grossAmount,
      netAmount,
      attendedDays,
      unpaidLeaveDays,
      db
    );

    if (hasAttendanceExceptions) {
      auditReasons.push('Flagged attendance exceptions exist in this pay cycle (e.g. missing clock-out or irregular shift)');
    }

    return {
      employee_id: employee.id,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      department: employee.department,
      job_position: employee.job_position,
      contract_id: contract.id,
      salary_structure_id: structureId,
      contract_wage: contractWage,
      metrics: {
        standard_working_days: standardWorkingDays,
        attended_days: attendedDays,
        paid_leave_days: paidLeaveDays,
        unpaid_leave_days: unpaidLeaveDays,
        worked_days: parseFloat(workedDays.toFixed(2)),
        total_worked_hours: parseFloat(totalWorkedHours.toFixed(2)),
        proration_factor: parseFloat(prorationFactor.toFixed(4)),
      },
      gross_amount: grossAmount,
      net_amount: netAmount,
      risk_score: riskScore,
      audit_reasons: auditReasons,
      salary_breakdown: breakdownLines,
    };
  }
}

module.exports = new PayrollService();
