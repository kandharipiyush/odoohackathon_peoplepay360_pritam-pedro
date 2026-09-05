const { pool } = require('../config/db');
const logger = require('../utils/logger');

/**
 * Budget & Cost Prediction Engine
 * Projects upcoming monthly departmental labor costs, historical expenditure trends,
 * and warns management of impending budget overruns.
 */
class BudgetService {
  /**
   * Forecasts department labor costs for a future target month and detects potential budget overruns
   * @param {Object} options - { target_month, lookback_months = 3, threshold_overrun_pct = 10 }
   */
  async predictDepartmentBudgets({ target_month = null, lookback_months = 3, threshold_overrun_pct = 10 } = {}) {
    const lookback = parseInt(lookback_months, 10) || 3;
    const thresholdPct = parseFloat(threshold_overrun_pct) || 10.0;

    // Target month defaults to next calendar month (YYYY-MM)
    let forecastMonth = target_month;
    if (!forecastMonth) {
      const now = new Date();
      now.setMonth(now.getMonth() + 1);
      forecastMonth = now.toISOString().slice(0, 7);
    }

    // 1. Fetch historical monthly payroll metrics by department
    const [historicalRows] = await pool.query(
      `SELECT 
        e.department,
        DATE_FORMAT(p.period_start, '%Y-%m') AS pay_month,
        COUNT(ps.id) AS employee_count,
        COALESCE(SUM(ps.gross_amount), 0.00) AS total_gross,
        COALESCE(SUM(ps.net_amount), 0.00) AS total_net,
        COALESCE(AVG(ps.gross_amount), 0.00) AS avg_gross_per_employee
      FROM payslips ps
      JOIN employees e ON ps.employee_id = e.id
      JOIN payruns p ON ps.payrun_id = p.id
      WHERE ps.status IN ('Computed', 'Audited', 'Confirmed', 'Paid')
      GROUP BY e.department, DATE_FORMAT(p.period_start, '%Y-%m')
      ORDER BY e.department, pay_month DESC`
    );

    // Group historical rows by department
    const deptHistoryMap = new Map();
    historicalRows.forEach((row) => {
      if (!deptHistoryMap.has(row.department)) {
        deptHistoryMap.set(row.department, []);
      }
      deptHistoryMap.get(row.department).push({
        pay_month: row.pay_month,
        employee_count: parseInt(row.employee_count, 10),
        total_gross: parseFloat(row.total_gross),
        total_net: parseFloat(row.total_net),
        avg_gross_per_employee: parseFloat(row.avg_gross_per_employee),
      });
    });

    // 2. Fetch current active contracts committed per department
    const [activeContractRows] = await pool.query(
      `SELECT 
        e.department,
        COUNT(c.id) AS active_headcount,
        COALESCE(SUM(c.wage), 0.00) AS total_base_wages,
        COALESCE(AVG(c.wage), 0.00) AS avg_base_wage
      FROM contracts c
      JOIN employees e ON c.employee_id = e.id
      WHERE c.status = 'Active' AND e.status = 'Active'
      GROUP BY e.department`
    );

    const activeDeptMap = new Map();
    activeContractRows.forEach((r) => {
      activeDeptMap.set(r.department, {
        active_headcount: parseInt(r.active_headcount, 10),
        total_base_wages: parseFloat(r.total_base_wages),
        avg_base_wage: parseFloat(r.avg_base_wage),
      });
    });

    // Departments to evaluate: union of historical and currently active
    const allDepartments = Array.from(new Set([...deptHistoryMap.keys(), ...activeDeptMap.keys()]));

    const departmentForecasts = [];
    let companyTotalForecastGross = 0;
    let companyTotalHistoricalAvg = 0;
    let companyOverrunCount = 0;

    for (const dept of allDepartments) {
      const history = (deptHistoryMap.get(dept) || []).slice(0, lookback);
      const activeCommitments = activeDeptMap.get(dept) || {
        active_headcount: 0,
        total_base_wages: 0,
        avg_base_wage: 0,
      };

      // Calculate historical average gross
      let historicalAvgGross = 0;
      let historicalAvgNet = 0;
      let historicalAvgHeadcount = activeCommitments.active_headcount;
      let monthOverMonthGrowthPct = 0;

      if (history.length > 0) {
        const sumGross = history.reduce((acc, h) => acc + h.total_gross, 0);
        const sumNet = history.reduce((acc, h) => acc + h.total_net, 0);
        const sumHeadcount = history.reduce((acc, h) => acc + h.employee_count, 0);

        historicalAvgGross = parseFloat((sumGross / history.length).toFixed(2));
        historicalAvgNet = parseFloat((sumNet / history.length).toFixed(2));
        historicalAvgHeadcount = Math.round(sumHeadcount / history.length);

        if (history.length >= 2 && history[1].total_gross > 0) {
          monthOverMonthGrowthPct = parseFloat(
            (((history[0].total_gross - history[1].total_gross) / history[1].total_gross) * 100).toFixed(2)
          );
        }
      }

      // Estimate gross multiplier over base contract wage from historical data
      // (Salary rules usually expand base contract wage with allowances like HRA, Transport)
      let grossExpansionFactor = 1.25; // Default 25% allowance overhead
      if (activeCommitments.total_base_wages > 0 && historicalAvgGross > 0) {
        grossExpansionFactor = Math.max(1.0, historicalAvgGross / activeCommitments.total_base_wages);
      }

      // Projected Labor Cost = Active committed wages * gross expansion factor * trend momentum
      const momentumFactor = 1 + (monthOverMonthGrowthPct > 0 ? Math.min(monthOverMonthGrowthPct, 15) / 100 : 0);
      const projectedGross =
        activeCommitments.total_base_wages > 0
          ? parseFloat((activeCommitments.total_base_wages * grossExpansionFactor * momentumFactor).toFixed(2))
          : historicalAvgGross;

      // Projected Net = approximately 82% of projected gross based on average deductions
      const projectedNet = parseFloat((projectedGross * 0.82).toFixed(2));

      // Benchmark monthly budget ceiling: 105% of historical average baseline or active wages * 1.3
      const baselineBudgetCeiling =
        historicalAvgGross > 0
          ? parseFloat((historicalAvgGross * 1.1).toFixed(2))
          : parseFloat((activeCommitments.total_base_wages * 1.35).toFixed(2));

      const varianceAmount = parseFloat((projectedGross - baselineBudgetCeiling).toFixed(2));
      const variancePct =
        baselineBudgetCeiling > 0
          ? parseFloat(((varianceAmount / baselineBudgetCeiling) * 100).toFixed(2))
          : 0;

      // Risk classification
      let riskLevel = 'Normal';
      let riskReason = 'Projected costs are well within established budgetary tolerances.';

      if (variancePct > thresholdPct) {
        riskLevel = 'Critical Overrun';
        riskReason = `Severe budget overrun projected: Estimated payroll exceeds baseline budget by ₹${varianceAmount.toLocaleString('en-IN')} (+${variancePct}%). Review new contracts and overtime trends.`;
        companyOverrunCount++;
      } else if (variancePct > 0) {
        riskLevel = 'Warning';
        riskReason = `Moderate budget alert: Projected spend is slightly exceeding target ceiling by ${variancePct}%.`;
      }

      departmentForecasts.push({
        department: dept,
        target_month: forecastMonth,
        active_headcount: activeCommitments.active_headcount,
        historical_avg_gross: historicalAvgGross,
        historical_avg_net: historicalAvgNet,
        active_committed_base_wages: activeCommitments.total_base_wages,
        projected_gross: projectedGross,
        projected_net: projectedNet,
        budget_ceiling: baselineBudgetCeiling,
        variance_amount: varianceAmount,
        variance_pct: variancePct,
        risk_level: riskLevel,
        risk_reason: riskReason,
        historical_trend: history,
      });

      companyTotalForecastGross += projectedGross;
      companyTotalHistoricalAvg += historicalAvgGross;
    }

    return {
      target_month: forecastMonth,
      lookback_months: lookback,
      threshold_overrun_pct: thresholdPct,
      company_summary: {
        total_departments: allDepartments.length,
        departments_at_risk: companyOverrunCount,
        total_projected_gross: parseFloat(companyTotalForecastGross.toFixed(2)),
        total_historical_avg_gross: parseFloat(companyTotalHistoricalAvg.toFixed(2)),
        projected_company_growth_pct:
          companyTotalHistoricalAvg > 0
            ? parseFloat((((companyTotalForecastGross - companyTotalHistoricalAvg) / companyTotalHistoricalAvg) * 100).toFixed(2))
            : 0,
      },
      department_forecasts: departmentForecasts.sort((a, b) => b.variance_pct - a.variance_pct),
    };
  }

  /**
   * Retrieves detailed historical payroll time-series trends for a specific department
   */
  async getDepartmentHistoricalTrends(department, months = 6) {
    const limit = parseInt(months, 10) || 6;

    const [rows] = await pool.query(
      `SELECT 
        DATE_FORMAT(p.period_start, '%Y-%m') AS pay_month,
        p.name AS payrun_name,
        COUNT(ps.id) AS headcount,
        COALESCE(SUM(ps.gross_amount), 0.00) AS total_gross,
        COALESCE(SUM(ps.net_amount), 0.00) AS total_net,
        COALESCE(AVG(ps.gross_amount), 0.00) AS avg_gross,
        COALESCE(SUM(ps.risk_score > 30), 0) AS high_risk_payslips
      FROM payslips ps
      JOIN employees e ON ps.employee_id = e.id
      JOIN payruns p ON ps.payrun_id = p.id
      WHERE e.department = ?
      GROUP BY p.id, pay_month, p.name
      ORDER BY p.period_start DESC
      LIMIT ?`,
      [department, limit]
    );

    return {
      department,
      months_analyzed: rows.length,
      history: rows.map((r) => ({
        ...r,
        total_gross: parseFloat(r.total_gross),
        total_net: parseFloat(r.total_net),
        avg_gross: parseFloat(r.avg_gross),
        headcount: parseInt(r.headcount, 10),
      })),
    };
  }
}

module.exports = new BudgetService();
