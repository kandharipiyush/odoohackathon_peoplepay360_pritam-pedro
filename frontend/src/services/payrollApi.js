import api from './api';

// MOCK DATA
let mockPayruns = [
  {
    id: 1,
    periodStart: '2023-11-01',
    periodEnd: '2023-11-30',
    paymentDate: '2023-12-05',
    employeeCount: 45,
    grossTotal: 250000,
    deductionsTotal: 55000,
    netTotal: 195000,
    status: 'Completed',
    createdDate: '2023-12-01',
    warnings: []
  },
  {
    id: 2,
    periodStart: '2023-12-01',
    periodEnd: '2023-12-31',
    paymentDate: '2024-01-05',
    employeeCount: 46,
    grossTotal: 260000,
    deductionsTotal: 58000,
    netTotal: 202000,
    status: 'Draft',
    createdDate: '2024-01-02',
    warnings: [
      { id: 1, employeeId: 'EMP042', type: 'Missing Attendance', description: 'No attendance records for Dec 15-20', severity: 'High' }
    ]
  }
];

let mockPayslips = [
  {
    id: 1,
    payrunId: 1,
    employeeId: 'EMP001',
    employeeName: 'Sarah Connor',
    department: 'Management',
    payslipNumber: 'PS-2023-11-001',
    periodStart: '2023-11-01',
    periodEnd: '2023-11-30',
    earnings: [
      { name: 'Basic Salary', amount: 15000 },
      { name: 'Allowances', amount: 2000 }
    ],
    deductions: [
      { name: 'Tax', amount: 3400 },
      { name: 'Insurance', amount: 600 }
    ],
    grossSalary: 17000,
    totalDeductions: 4000,
    netSalary: 13000,
    status: 'Validated',
    paymentStatus: 'Paid',
    risk: 'Low'
  }
];

export const payrollApi = {
  getPayruns: async () => {
    return new Promise(resolve => setTimeout(() => resolve({ data: mockPayruns }), 500));
  },
  
  getPayrun: async (id) => {
    return new Promise(resolve => setTimeout(() => {
      resolve({ data: mockPayruns.find(p => p.id === parseInt(id)) });
    }, 400));
  },
  
  createPayrun: async (data) => {
    return new Promise(resolve => setTimeout(() => {
      const newPayrun = {
        id: mockPayruns.length + 1,
        ...data,
        employeeCount: data.employeeIds?.length || 0,
        grossTotal: 0,
        deductionsTotal: 0,
        netTotal: 0,
        status: 'Draft',
        createdDate: new Date().toISOString().split('T')[0],
        warnings: []
      };
      mockPayruns.push(newPayrun);
      resolve({ data: newPayrun });
    }, 1000));
  },
  
  processPayrun: async (id) => {
    return new Promise(resolve => setTimeout(() => {
      const pr = mockPayruns.find(p => p.id === parseInt(id));
      if (pr) {
        pr.status = 'Processing';
        // Simulate processing finishing later
        setTimeout(() => { pr.status = 'Completed'; }, 3000);
      }
      resolve({ data: pr });
    }, 800));
  },
  
  getPayrunWarnings: async (id) => {
    return new Promise(resolve => setTimeout(() => {
      const pr = mockPayruns.find(p => p.id === parseInt(id));
      resolve({ data: pr?.warnings || [] });
    }, 400));
  },
  
  getPayslips: async (params) => {
    return new Promise(resolve => setTimeout(() => {
      let result = mockPayslips;
      if (params?.payrunId) result = result.filter(ps => ps.payrunId === parseInt(params.payrunId));
      if (params?.employeeId) result = result.filter(ps => ps.employeeId === params.employeeId);
      resolve({ data: result });
    }, 500));
  },
  
  getPayslip: async (id) => {
    return new Promise(resolve => setTimeout(() => {
      resolve({ data: mockPayslips.find(ps => ps.id === parseInt(id)) });
    }, 400));
  },
  
  downloadPayslipPdf: async (id) => {
    return new Promise(resolve => setTimeout(() => resolve({ success: true }), 800));
  },
  
  emailPayslip: async (id) => {
    return new Promise(resolve => setTimeout(() => resolve({ success: true }), 800));
  },
  
  bulkEmailPayslips: async (ids) => {
    return new Promise(resolve => setTimeout(() => resolve({ success: true, count: ids.length }), 1200));
  }
};
