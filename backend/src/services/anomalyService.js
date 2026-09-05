const { pool } = require('../config/db');
const logger = require('../utils/logger');

/**
 * AI Anomaly & Payroll Fraud Detection Service
 * Detects wage surges, overtime spikes, irregular clock-ins, and payment discrepancies.
 */
class AnomalyService {
  constructor() {
    this.ensureTableCreated();
  }

  /**
   * Automatically ensure anomaly_logs table exists
   */
  async ensureTableCreated() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`anomaly_logs\` (
          \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
          \`payrun_id\` INT UNSIGNED NOT NULL,
          \`payslip_id\` INT UNSIGNED NULL,
          \`employee_id\` INT UNSIGNED NOT NULL,
          \`anomaly_type\` VARCHAR(100) NOT NULL,
          \`severity\` ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
          \`risk_score\` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
          \`description\` TEXT NOT NULL,
          \`details_json\` JSON NULL,
          \`status\` ENUM('Flagged', 'Reviewed', 'Dismissed', 'Resolved') NOT NULL DEFAULT 'Flagged',
          \`resolved_by\` VARCHAR(100) NULL,
          \`resolution_notes\` TEXT NULL,
          \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          INDEX \`idx_anomaly_payrun\` (\`payrun_id\`),
          INDEX \`idx_anomaly_payslip\` (\`payslip_id\`),
          INDEX \`idx_anomaly_employee\` (\`employee_id\`),
          INDEX \`idx_anomaly_severity\` (\`severity\`),
          INDEX \`idx_anomaly_status\` (\`status\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    } catch (err) {
      logger.error('Failed to verify anomaly_logs table:', { error: err.message });
    }
  }

  /**
   * Scans a single payslip for statistical anomalies and fraud indicators
   */
  async scanPayslipAnomalies(payslipId) {
    // 1. Fetch payslip with employee and contract context
    const [rows] = await pool.query(
      `SELECT 
        ps.*,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.department, e.job_position, e.email,
        c.wage AS contract_wage,
        p.period_start, p.period_end, p.name AS payrun_name
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

    const payslip = rows[0];
    const anomalies = [];
    let cumulativeRisk = 0;

    const currentGross = parseFloat(payslip.gross_amount);
    const currentNet = parseFloat(payslip.net_amount);
    const contractWage = parseFloat(payslip.contract_wage);

    // ==========================================
    // Check 1: 3-Month Historical Rolling Variance
    // ==========================================
    const [historical] = await pool.query(
      `SELECT gross_amount, net_amount, worked_days, created_at 
       FROM payslips 
       WHERE employee_id = ? AND id != ? AND status IN ('Computed', 'Audited', 'Confirmed', 'Paid')
       ORDER BY created_at DESC LIMIT 3`,
      [payslip.employee_id, payslipId]
    );

    if (historical.length > 0) {
      const sumGross = historical.reduce((acc, h) => acc + parseFloat(h.gross_amount), 0);
      const avgGross = sumGross / historical.length;

      if (avgGross > 0) {
        const spikePct = ((currentGross - avgGross) / avgGross) * 100;

        if (spikePct >= 50.0) {
          anomalies.push({
            type: 'CRITICAL_SALARY_SURGE',
            severity: 'Critical',
            risk: 45.0,
            description: `Extreme Gross Salary Spike: Current pay (₹${currentGross.toLocaleString('en-IN')}) is +${spikePct.toFixed(1)}% higher than the 3-month rolling average (₹${avgGross.toLocaleString('en-IN')}).`,
            details: { currentGross, avgGross, spikePct },
          });
          cumulativeRisk += 45;
        } else if (spikePct >= 25.0) {
          anomalies.push({
            type: 'SALARY_SURGE_WARNING',
            severity: 'High',
            risk: 25.0,
            description: `Significant Wage Spike: Current pay is +${spikePct.toFixed(1)}% higher than 3-month baseline.`,
            details: { currentGross, avgGross, spikePct },
          });
          cumulativeRisk += 25;
        } else if (spikePct <= -35.0) {
          anomalies.push({
            type: 'UNUSUAL_SALARY_DROP',
            severity: 'Medium',
            risk: 20.0,
            description: `Severe Wage Drop: Current gross is ${Math.abs(spikePct).toFixed(1)}% below historical average.`,
            details: { currentGross, avgGross, spikePct },
          });
          cumulativeRisk += 20;
        }
      }
    }

    // ==========================================
    // Check 2: Contract Wage Discrepancy
    // ==========================================
    if (contractWage > 0 && currentGross > contractWage * 1.6) {
      const surgeOverContract = ((currentGross - contractWage) / contractWage) * 100;
      anomalies.push({
        type: 'CONTRACT_CEILING_EXCEEDED',
        severity: 'High',
        risk: 30.0,
        description: `Gross amount exceeds base contract wage (₹${contractWage.toLocaleString('en-IN')}) by ${surgeOverContract.toFixed(1)}%.`,
        details: { contractWage, currentGross, surgeOverContract },
      });
      cumulativeRisk += 30;
    }

    // ==========================================
    // Check 3: Overtime & Impossible Shift Hours
    // ==========================================
    const [attendanceLogs] = await pool.query(
      `SELECT id, check_in, check_out, worked_hours, exception_flag 
       FROM attendance 
       WHERE employee_id = ? 
         AND check_in >= ? 
         AND check_in <= ?`,
      [payslip.employee_id, `${payslip.period_start} 00:00:00`, `${payslip.period_end} 23:59:59`]
    );

    let totalWorkedHours = 0;
    let shiftsOver14Hours = 0;
    let unclosedShifts = 0;
    let lateNightShifts = 0;

    for (const att of attendanceLogs) {
      const hrs = parseFloat(att.worked_hours || 0);
      totalWorkedHours += hrs;
      if (hrs > 14) shiftsOver14Hours++;
      if (!att.check_out) unclosedShifts++;

      if (att.check_in) {
        const checkInHour = new Date(att.check_in).getUTCHours();
        // Check-in between 00:00 and 04:00
        if (checkInHour >= 0 && checkInHour <= 4) {
          lateNightShifts++;
        }
      }
    }

    if (shiftsOver14Hours > 0) {
      anomalies.push({
        type: 'IMPOSSIBLE_SHIFT_HOURS',
        severity: 'High',
        risk: 25.0,
        description: `Detected ${shiftsOver14Hours} shift(s) exceeding 14 continuous hours in a single day.`,
        details: { shiftsOver14Hours, totalWorkedHours },
      });
      cumulativeRisk += 25;
    }

    if (unclosedShifts > 0) {
      anomalies.push({
        type: 'UNCLOSED_ATTENDANCE_SESSIONS',
        severity: 'Medium',
        risk: 15.0,
        description: `${unclosedShifts} attendance session(s) lack a clock-out timestamp.`,
        details: { unclosedShifts },
      });
      cumulativeRisk += 15;
    }

    // ==========================================
    // Check 4: Unapproved Absences & Net Collapse
    // ==========================================
    if (currentNet <= 0) {
      anomalies.push({
        type: 'NET_PAY_COLLAPSE',
        severity: 'Critical',
        risk: 50.0,
        description: `Net take-home pay is zero or negative (₹${currentNet.toFixed(2)}) due to total deductions of ₹${(currentGross - currentNet).toFixed(2)}.`,
        details: { currentGross, currentNet },
      });
      cumulativeRisk += 50;
    } else if (currentGross > 0 && currentNet < currentGross * 0.25) {
      anomalies.push({
        type: 'HEAVY_DEDUCTION_ALERT',
        severity: 'Medium',
        risk: 15.0,
        description: `Deductions consume more than 75% of total gross compensation.`,
        details: { currentGross, currentNet, deductionPct: ((currentGross - currentNet) / currentGross) * 100 },
      });
      cumulativeRisk += 15;
    }

    // ==========================================
    // Check 5: Duplicate Payment Destination Check
    // ==========================================
    // Detect duplicate bank/email patterns across different employee identities
    const [duplicateEmails] = await pool.query(
      `SELECT id, first_name, last_name, email FROM employees WHERE email = ? AND id != ?`,
      [payslip.email, payslip.employee_id]
    );

    if (duplicateEmails.length > 0) {
      anomalies.push({
        type: 'POTENTIAL_GHOST_EMPLOYEE',
        severity: 'Critical',
        risk: 60.0,
        description: `Duplicate employee credential detected: Email ${payslip.email} is shared with employee ID ${duplicateEmails[0].id}.`,
        details: { conflictEmployeeId: duplicateEmails[0].id },
      });
      cumulativeRisk += 60;
    }

    // Normalize final risk score
    const finalRiskScore = Math.min(100.0, Math.max(0.0, parseFloat(cumulativeRisk.toFixed(2))));

    // Persist anomaly logs to database
    if (anomalies.length > 0) {
      // Clear old unreviewed flags for this payslip to prevent duplicates
      await pool.query('DELETE FROM anomaly_logs WHERE payslip_id = ? AND status = "Flagged"', [payslipId]);

      for (const a of anomalies) {
        await pool.query(
          `INSERT INTO anomaly_logs 
           (payrun_id, payslip_id, employee_id, anomaly_type, severity, risk_score, description, details_json, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Flagged')`,
          [
            payslip.payrun_id,
            payslipId,
            payslip.employee_id,
            a.type,
            a.severity,
            a.risk,
            a.description,
            JSON.stringify(a.details || {}),
          ]
        );
      }

      // Update payslip record with new risk score and audit notes
      const existingAudit =
        typeof payslip.audit_reasons_json === 'string'
          ? JSON.parse(payslip.audit_reasons_json || '{}')
          : payslip.audit_reasons_json || {};

      existingAudit.audit_reasons = anomalies.map((a) => a.description);
      existingAudit.ai_anomaly_scan_at = new Date().toISOString();

      await pool.query(
        `UPDATE payslips 
         SET risk_score = ?, audit_reasons_json = ? 
         WHERE id = ?`,
        [finalRiskScore, JSON.stringify(existingAudit), payslipId]
      );
    }

    return {
      payslip_id: payslipId,
      employee_id: payslip.employee_id,
      employee_name: payslip.employee_name,
      risk_score: finalRiskScore,
      anomaly_count: anomalies.length,
      anomalies,
    };
  }

  /**
   * Batch scans an entire payrun for anomalies and fraud patterns
   */
  async scanPayrunAnomalies(payrunId) {
    const [payslips] = await pool.query('SELECT id FROM payslips WHERE payrun_id = ?', [payrunId]);

    if (payslips.length === 0) {
      const error = new Error(`No payslips found under Payrun ID ${payrunId}`);
      error.statusCode = 404;
      throw error;
    }

    const results = [];
    let highRiskCount = 0;

    for (const p of payslips) {
      const scan = await this.scanPayslipAnomalies(p.id);
      results.push(scan);
      if (scan.risk_score > 30.0) highRiskCount++;
    }

    return {
      payrun_id: parseInt(payrunId, 10),
      total_payslips_scanned: payslips.length,
      flagged_payslips_count: results.filter((r) => r.anomaly_count > 0).length,
      high_risk_count: highRiskCount,
      scan_results: results,
    };
  }

  /**
   * Retrieves logged anomalies with multi-filter support
   */
  async getAnomalyLogs({ payrun_id, employee_id, severity, status, limit = 50, offset = 0 }) {
    let sql = `
      SELECT 
        al.id, al.payrun_id, al.payslip_id, al.employee_id, al.anomaly_type,
        al.severity, al.risk_score, al.description, al.details_json, al.status,
        al.resolved_by, al.resolution_notes, al.created_at,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.department, e.job_position,
        p.name AS payrun_name
      FROM anomaly_logs al
      JOIN employees e ON al.employee_id = e.id
      JOIN payruns p ON al.payrun_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (payrun_id) {
      sql += ' AND al.payrun_id = ?';
      params.push(payrun_id);
    }
    if (employee_id) {
      sql += ' AND al.employee_id = ?';
      params.push(employee_id);
    }
    if (severity) {
      sql += ' AND al.severity = ?';
      params.push(severity);
    }
    if (status) {
      sql += ' AND al.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY al.risk_score DESC, al.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(sql, params);

    return rows.map((r) => ({
      ...r,
      risk_score: parseFloat(r.risk_score),
      details_json: typeof r.details_json === 'string' ? JSON.parse(r.details_json) : r.details_json,
    }));
  }

  /**
   * Reconcile/Resolve a flagged anomaly
   */
  async resolveAnomaly(anomalyId, { status = 'Resolved', resolution_notes = '', resolved_by = 'HR Auditor' }) {
    const [rows] = await pool.query('SELECT id FROM anomaly_logs WHERE id = ?', [anomalyId]);
    if (rows.length === 0) {
      const error = new Error(`Anomaly log ID ${anomalyId} not found`);
      error.statusCode = 404;
      throw error;
    }

    await pool.query(
      `UPDATE anomaly_logs 
       SET status = ?, resolution_notes = ?, resolved_by = ? 
       WHERE id = ?`,
      [status, resolution_notes, resolved_by, anomalyId]
    );

    const [updated] = await pool.query('SELECT * FROM anomaly_logs WHERE id = ?', [anomalyId]);
    return updated[0];
  }
}

module.exports = new AnomalyService();
