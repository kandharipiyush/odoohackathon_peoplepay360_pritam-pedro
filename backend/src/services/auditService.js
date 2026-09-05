const { pool } = require('../config/db');
const logger = require('../utils/logger');

/**
 * Explainable Payroll Auditor Service
 * Translates sequenced salary rule executions into plain-English human-readable justifications,
 * step-by-step arithmetic derivations, and auditor compliance reports.
 */
class AuditService {
  formatCurrency(val) {
    return '$' + (parseFloat(val) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /**
   * Generates a plain-English, step-by-step audit justification explaining how net pay was derived
   * @param {number} payslipId - ID of the payslip
   */
  async generatePayslipAudit(payslipId) {
    const [rows] = await pool.query(
      `SELECT 
        ps.*,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.department, e.job_position, e.email,
        c.wage AS contract_wage,
        p.name AS payrun_name, p.period_start, p.period_end, p.status AS payrun_status,
        s.name AS salary_structure_name
      FROM payslips ps
      JOIN employees e ON ps.employee_id = e.id
      JOIN contracts c ON ps.contract_id = c.id
      JOIN payruns p ON ps.payrun_id = p.id
      LEFT JOIN salary_structures s ON c.salary_structure_id = s.id
      WHERE ps.id = ?`,
      [payslipId]
    );

    if (rows.length === 0) {
      const error = new Error(`Payslip ID ${payslipId} not found`);
      error.statusCode = 404;
      throw error;
    }

    const payslip = rows[0];
    const auditData =
      typeof payslip.audit_reasons_json === 'string'
        ? JSON.parse(payslip.audit_reasons_json || '{}')
        : payslip.audit_reasons_json || {};

    const breakdown = auditData.salary_breakdown || [];
    const metrics = auditData.metrics || {};
    const anomalyReasons = auditData.audit_reasons || [];

    const contractWage = parseFloat(payslip.contract_wage);
    const grossAmount = parseFloat(payslip.gross_amount);
    const netAmount = parseFloat(payslip.net_amount);
    const totalDeductions = parseFloat((grossAmount - netAmount).toFixed(2));
    const workedDays = parseFloat(payslip.worked_days || metrics.worked_days || 0);
    const standardDays = metrics.standard_working_days || 22;
    const prorationPct = metrics.proration_factor ? (metrics.proration_factor * 100).toFixed(1) : '100.0';

    // Partition rules
    const basicRules = breakdown.filter((b) => b.category === 'Basic');
    const allowanceRules = breakdown.filter((b) => b.category === 'Allowance');
    const deductionRules = breakdown.filter((b) => b.category === 'Deduction');

    const totalBasic = basicRules.reduce((acc, r) => acc + parseFloat(r.amount), 0);
    const totalAllowances = allowanceRules.reduce((acc, r) => acc + parseFloat(r.amount), 0);
    const totalWithholdings = deductionRules.reduce((acc, r) => acc + parseFloat(r.amount), 0);

    // ==========================================
    // 1. Build Step-by-Step Narrative
    // ==========================================
    const steps = [];

    // Step 1: Base Wage & Attendance Proration
    let step1 = `Employee has a contracted monthly base wage of ${this.formatCurrency(contractWage)}. `;
    if (metrics.unpaid_leave_days > 0 || workedDays < standardDays) {
      step1 += `During this cycle, the employee worked ${workedDays} of ${standardDays} standard business days (${metrics.unpaid_leave_days || 0} unpaid leave days recorded), resulting in an attendance proration factor of ${prorationPct}%.`;
    } else {
      step1 += `The employee fulfilled all ${workedDays} required business days (100% full attendance schedule). No unapproved absence penalties were assessed.`;
    }
    steps.push({
      step_number: 1,
      title: 'Contract Binding & Attendance Schedule',
      narrative: step1,
      impact_amount: contractWage,
    });

    // Step 2: Basic Salary & Allowances (Gross Earnings)
    const allowanceList = allowanceRules.map((a) => `${a.name} (${this.formatCurrency(a.amount)})`).join(', ');
    const step2 = `Basic salary was calculated at ${this.formatCurrency(totalBasic)}. Additional allowances accrued: ${allowanceList || 'None'}. This brings total Gross Earnings to ${this.formatCurrency(grossAmount)}.`;
    steps.push({
      step_number: 2,
      title: 'Gross Earnings Accrual',
      narrative: step2,
      impact_amount: grossAmount,
    });

    // Step 3: Deductions & Statutory Withholdings
    const deductionList = deductionRules.map((d) => `${d.name} (${this.formatCurrency(d.amount)})`).join(', ');
    const step3 = `Statutory withholdings and payroll deductions applied: ${deductionList || 'None'}. Total deductions amounted to ${this.formatCurrency(totalDeductions)}.`;
    steps.push({
      step_number: 3,
      title: 'Deductions & Withholdings',
      narrative: step3,
      impact_amount: -totalDeductions,
    });

    // Step 4: Final Net Take-Home Calculation
    const formulaEquation = `Gross Earnings (${this.formatCurrency(grossAmount)}) - Total Deductions (${this.formatCurrency(totalDeductions)}) = Net Take-Home Pay (${this.formatCurrency(netAmount)})`;
    const step4 = `Final Net Salary was derived as: ${formulaEquation}.`;
    steps.push({
      step_number: 4,
      title: 'Net Salary Settlement',
      narrative: step4,
      impact_amount: netAmount,
    });

    // ==========================================
    // 2. Risk & Audit Assessment Summary
    // ==========================================
    const riskScore = parseFloat(payslip.risk_score || 0);
    let auditStatus = 'Approved / Clean';
    if (riskScore > 50) {
      auditStatus = 'Flagged for High-Priority Manual Review';
    } else if (riskScore > 20) {
      auditStatus = 'Elevated Risk / Discrepancy Caution';
    }

    const plainEnglishSummary = `For ${payslip.employee_name} (${payslip.job_position}, ${payslip.department}), monthly compensation was determined under the "${payslip.salary_structure_name || 'Standard'}" structure. Starting from a base wage of ${this.formatCurrency(contractWage)}, gross earnings reached ${this.formatCurrency(grossAmount)} after allowances (${allowanceRules.map((a) => a.code).join('+') || 'N/A'}). After applying ${this.formatCurrency(totalDeductions)} in deductions (${deductionRules.map((d) => d.code).join('+') || 'N/A'}), the final take-home pay is ${this.formatCurrency(netAmount)}. ${anomalyReasons.length > 0 ? 'Auditor note: ' + anomalyReasons.join('. ') : 'All calculations verified clean.'}`;

    return {
      payslip_id: payslip.id,
      employee_id: payslip.employee_id,
      employee_name: payslip.employee_name,
      department: payslip.department,
      job_position: payslip.job_position,
      payrun_name: payslip.payrun_name,
      period: `${payslip.period_start} to ${payslip.period_end}`,
      audit_status: auditStatus,
      risk_score: riskScore,
      plain_english_summary: plainEnglishSummary,
      formula_equation: formulaEquation,
      step_by_step_narrative: steps,
      financial_breakdown: {
        contract_base_wage: contractWage,
        gross_earnings: grossAmount,
        total_basic: totalBasic,
        total_allowances: totalAllowances,
        total_deductions: totalDeductions,
        net_payable: netAmount,
        items: breakdown,
      },
      attendance_metrics: metrics,
      ai_anomaly_flags: anomalyReasons,
    };
  }

  /**
   * Generates a comprehensive payroll audit report for an entire payrun batch
   * @param {number} payrunId - Payrun ID
   */
  async generatePayrunAuditReport(payrunId) {
    const [payrunRows] = await pool.query(
      `SELECT p.*, s.name AS structure_name 
       FROM payruns p 
       LEFT JOIN salary_structures s ON p.structure_id = s.id 
       WHERE p.id = ?`,
      [payrunId]
    );

    if (payrunRows.length === 0) {
      const error = new Error(`Payrun ID ${payrunId} not found`);
      error.statusCode = 404;
      throw error;
    }
    const payrun = payrunRows[0];

    const [payslips] = await pool.query(
      `SELECT 
        ps.id, ps.employee_id, ps.gross_amount, ps.net_amount, ps.risk_score, ps.status, ps.audit_reasons_json,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        e.department
       FROM payslips ps
       JOIN employees e ON ps.employee_id = e.id
       WHERE ps.payrun_id = ?
       ORDER BY ps.risk_score DESC`,
      [payrunId]
    );

    let totalGross = 0;
    let totalNet = 0;
    let highRiskCount = 0;
    let cleanCount = 0;
    const flaggedItems = [];

    payslips.forEach((ps) => {
      const gross = parseFloat(ps.gross_amount);
      const net = parseFloat(ps.net_amount);
      const risk = parseFloat(ps.risk_score);

      totalGross += gross;
      totalNet += net;

      if (risk > 30.0) {
        highRiskCount++;
        const audit = typeof ps.audit_reasons_json === 'string' ? JSON.parse(ps.audit_reasons_json || '{}') : ps.audit_reasons_json || {};
        flaggedItems.push({
          payslip_id: ps.id,
          employee_name: ps.employee_name,
          department: ps.department,
          gross: gross,
          net: net,
          risk_score: risk,
          reasons: audit.audit_reasons || [],
        });
      } else {
        cleanCount++;
      }
    });

    const averageRiskScore = payslips.length > 0 ? parseFloat((payslips.reduce((acc, p) => acc + parseFloat(p.risk_score), 0) / payslips.length).toFixed(2)) : 0;

    let disbursementReadiness = 'READY FOR PAYMENT APPROVAL';
    if (highRiskCount > 0) {
      disbursementReadiness = `BLOCKED: ${highRiskCount} payslip(s) require manual auditor sign-off before payout.`;
    }

    return {
      payrun_id: payrun.id,
      payrun_name: payrun.name,
      status: payrun.status,
      period: `${payrun.period_start} to ${payrun.period_end}`,
      executive_summary: {
        total_employees: payslips.length,
        total_gross_disbursement: parseFloat(totalGross.toFixed(2)),
        total_net_disbursement: parseFloat(totalNet.toFixed(2)),
        total_statutory_withholdings: parseFloat((totalGross - totalNet).toFixed(2)),
        average_risk_score: averageRiskScore,
        clean_payslips_count: cleanCount,
        flagged_payslips_count: highRiskCount,
        disbursement_readiness: disbursementReadiness,
      },
      high_risk_flagged_payslips: flaggedItems,
    };
  }
}

module.exports = new AuditService();
