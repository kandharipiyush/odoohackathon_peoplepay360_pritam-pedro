import api from './api';

// MOCK DATA
const mockRisks = {
  '101': {
    employeeId: 101,
    riskScore: 87,
    riskLevel: 'HIGH',
    anomalies: [
      { id: 1, type: 'Salary Increase', description: 'Salary increased by 30%', severity: 'HIGH', date: '2024-01-15', status: 'Pending' },
      { id: 2, type: 'Bonus Spike', description: 'Bonus increased by 80%', severity: 'HIGH', date: '2024-01-15', status: 'Pending' }
    ]
  },
  '102': {
    employeeId: 102,
    riskScore: 12,
    riskLevel: 'LOW',
    anomalies: []
  }
};

const mockImpacts = {
  '101': {
    employeeId: 101,
    expectedDays: 22,
    attendanceDays: 20,
    approvedLeaveDays: 0,
    unresolvedDays: 2,
    overtimeHours: 4,
    estimatedPayrollImpact: 4545,
    status: 'Needs Review',
    mismatches: [
      { id: 1, type: 'Missing Attendance', description: 'Missing check-in on Jan 14' },
      { id: 2, type: 'Unresolved Working Days', description: '2 days without attendance or leave' }
    ]
  }
};

const mockForecast = {
  currentPayroll: 4250000,
  forecast: 4580000,
  budget: 4400000,
  overrun: 180000,
  status: 'Over Budget',
  historical: [3800000, 3950000, 4100000, 4250000], // past 4 months
  reasons: [
    { type: 'New Hires', impact: '+₹2.5L', description: 'Onboarded 4 new engineers' },
    { type: 'Salary Increments', impact: '+₹1.1L', description: 'Annual review adjustments' },
    { type: 'Increased Overtime', impact: '+₹0.2L', description: 'Higher overtime in logistics' }
  ]
};

const mockAudit = {
  '1': {
    payslipId: 1,
    riskScore: 87,
    riskLevel: 'HIGH',
    triggers: [
      'Salary increased by 30%',
      'Bonus increased by 80%',
      'Overtime increased by 45%'
    ],
    affectedComponents: ['Basic Salary', 'Bonus', 'Overtime'],
    recommendedAction: 'Review bonus and overtime before validating this payslip.',
    status: 'Flagged'
  }
};

export const intelligenceApi = {
  getPayrollRisk: async (employeeId) => {
    return new Promise(resolve => setTimeout(() => {
      resolve({ data: mockRisks[employeeId] || mockRisks['102'] });
    }, 600));
  },
  
  getPayrollAnomalies: async (params) => {
    return new Promise(resolve => setTimeout(() => {
      // Return all anomalies across all mock risks
      const allAnomalies = Object.values(mockRisks).flatMap(r => r.anomalies.map(a => ({...a, employeeId: r.employeeId})));
      resolve({ data: allAnomalies });
    }, 700));
  },
  
  getAttendancePayrollImpact: async (employeeId) => {
    return new Promise(resolve => setTimeout(() => {
      resolve({ data: mockImpacts[employeeId] || mockImpacts['101'] }); // default to 101 for demo
    }, 500));
  },
  
  getPayrollForecast: async (params) => {
    return new Promise(resolve => setTimeout(() => resolve({ data: mockForecast }), 800));
  },
  
  getPayslipAudit: async (payslipId) => {
    return new Promise(resolve => setTimeout(() => {
      resolve({ data: mockAudit[payslipId] || mockAudit['1'] });
    }, 600));
  }
};
