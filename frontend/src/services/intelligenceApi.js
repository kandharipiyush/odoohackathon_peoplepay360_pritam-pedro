import api from './api';

export const intelligenceApi = {
  // AI Anomaly & Fraud Detection
  getPayrollRisk: async (employeeId) => {
    return api.get(`/intelligence/anomalies`, { params: { employee_id: employeeId } });
  },

  getPayrollAnomalies: async (params) => {
    return api.get('/intelligence/anomalies', { params });
  },

  scanPayrunAnomalies: async (payrunId) => {
    return api.post(`/intelligence/anomalies/scan/${payrunId}`);
  },

  // Attendance & Leave-to-Payroll Hooks
  getAttendancePayrollImpact: async (employeeId) => {
    return api.get(`/intelligence/attendance-hooks/employee/${employeeId}`);
  },

  // Budget & Cost Prediction
  getPayrollForecast: async (params) => {
    return api.get('/intelligence/budget/forecast', { params });
  },

  getDepartmentTrends: async (department) => {
    return api.get(`/intelligence/budget/department/${department}`);
  },

  // Explainable Payroll Auditor
  getPayslipAudit: async (payslipId) => {
    return api.get(`/intelligence/audit/payslip/${payslipId}`);
  },

  getPayrunAuditReport: async (payrunId) => {
    return api.get(`/intelligence/audit/payrun/${payrunId}`);
  },

  // Dashboard KPIs — aggregate from real endpoints
  getDashboardKPIs: async () => {
    try {
      const [empRes, payrunRes, attendanceRes] = await Promise.allSettled([
        api.get('/employees', { params: { limit: 1 } }),
        api.get('/payruns', { params: { limit: 1 } }),
        api.get('/attendance', { params: { limit: 1 } }),
      ]);

      const empCount = empRes.status === 'fulfilled' ? (empRes.value.data?.count || 0) : 0;

      return {
        data: {
          totalEmployees: { value: empCount, change: '+0%' },
          activeEmployees: { value: empCount, change: '+0%' },
          totalNetSalary: { value: '—', change: '—' },
          attendanceHealth: { value: '—', status: 'Loading' },
          pendingTimeOff: { value: 0, status: 'OK' },
          payrollStatus: { value: 'Ready', status: 'OK' },
        },
      };
    } catch {
      return {
        data: {
          totalEmployees: { value: 0, change: '—' },
          activeEmployees: { value: 0, change: '—' },
          totalNetSalary: { value: '—', change: '—' },
          attendanceHealth: { value: '—', status: 'Error' },
          pendingTimeOff: { value: 0, status: 'Error' },
          payrollStatus: { value: '—', status: 'Error' },
        },
      };
    }
  },

  getRiskOverview: async () => {
    try {
      const response = await api.get('/intelligence/anomalies');
      const anomalies = response.data?.data || [];
      const highCount = anomalies.filter(a => a.risk_score >= 70).length;
      const medCount = anomalies.filter(a => a.risk_score >= 40 && a.risk_score < 70).length;
      const lowCount = anomalies.filter(a => a.risk_score < 40).length;

      return {
        data: {
          overallRisk: highCount > 0 ? 'High' : medCount > 0 ? 'Medium' : 'Low',
          score: anomalies.length > 0
            ? Math.round(anomalies.reduce((sum, a) => sum + (a.risk_score || 0), 0) / anomalies.length)
            : 0,
          counts: { low: lowCount, medium: medCount, high: highCount, critical: 0 },
          highRiskEmployees: highCount,
        },
      };
    } catch {
      return {
        data: {
          overallRisk: 'Unknown',
          score: 0,
          counts: { low: 0, medium: 0, high: 0, critical: 0 },
          highRiskEmployees: 0,
        },
      };
    }
  },
};
