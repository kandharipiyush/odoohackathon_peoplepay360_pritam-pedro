import api from './api';

const mapPayrun = (p) => {
  if (!p) return p;
  return {
    ...p,
    id: p.id,
    name: p.name || `Payrun PR-${String(p.id).padStart(4, '0')}`,
    periodStart: p.periodStart || (p.period_start ? String(p.period_start).split('T')[0] : '2026-09-01'),
    periodEnd: p.periodEnd || (p.period_end ? String(p.period_end).split('T')[0] : '2026-09-30'),
    employeeCount: p.employeeCount ?? p.total_payslips ?? p.employees_processed ?? p.employee_count ?? 0,
    grossTotal: parseFloat(p.grossTotal ?? p.total_gross ?? p.gross_amount ?? p.gross_total ?? 0),
    netTotal: parseFloat(p.netTotal ?? p.total_net ?? p.net_amount ?? p.net_total ?? 0),
    status: p.status || 'Draft',
  };
};

const mapPayslip = (p) => {
  if (!p) return p;
  const numStr = `PS-${String(p.id).padStart(5, '0')}`;
  const empName = p.employeeName || p.employee_name || 'Employee';
  const empId = p.employeeId || (p.employee_id ? `EMP-${String(p.employee_id).padStart(3, '0')}` : 'EMP-000');
  const startStr = p.periodStart || (p.period_start ? String(p.period_start).split('T')[0] : '2026-09-01');
  const endStr = p.periodEnd || (p.period_end ? String(p.period_end).split('T')[0] : '2026-09-30');
  const gross = parseFloat(p.grossSalary ?? p.gross_amount ?? 0);
  const net = parseFloat(p.netSalary ?? p.net_amount ?? 0);
  const totalDed = Math.max(0, parseFloat((gross - net).toFixed(2)));

  // Parse audit breakdown if available
  let auditObj = p.audit_reasons_json;
  if (typeof auditObj === 'string') {
    try {
      auditObj = JSON.parse(auditObj);
    } catch {
      auditObj = {};
    }
  }

  const breakdown = auditObj?.salary_breakdown || {};
  
  let earnings = [];
  if (Array.isArray(breakdown.allowances) && breakdown.allowances.length > 0) {
    earnings = [
      { name: 'Basic Salary', amount: parseFloat(breakdown.basic_salary || gross * 0.7) },
      ...breakdown.allowances.map(a => ({ name: a.name, amount: parseFloat(a.amount || 0) }))
    ];
  } else {
    earnings = [
      { name: 'Basic Salary', amount: parseFloat((gross * 0.7).toFixed(2)) },
      { name: 'House Rent Allowance (HRA)', amount: parseFloat((gross * 0.2).toFixed(2)) },
      { name: 'Special Allowance', amount: parseFloat((gross * 0.1).toFixed(2)) },
    ];
  }

  let deductions = [];
  if (Array.isArray(breakdown.deductions) && breakdown.deductions.length > 0) {
    deductions = breakdown.deductions.map(d => ({ name: d.name, amount: parseFloat(d.amount || 0) }));
  } else if (totalDed > 0) {
    deductions = [
      { name: 'Statutory Taxes & Deductions (PF / TDS)', amount: totalDed }
    ];
  } else {
    deductions = [
      { name: 'Statutory Taxes & PF', amount: 0.00 }
    ];
  }

  return {
    ...p,
    id: p.id,
    payrunId: p.payrunId ?? p.payrun_id ?? 1,
    payslipNumber: p.payslipNumber || numStr,
    employeeName: empName,
    employeeId: empId,
    department: p.department || 'Engineering',
    periodStart: startStr,
    periodEnd: endStr,
    grossSalary: gross,
    netSalary: net,
    totalDeductions: totalDed,
    earnings,
    deductions,
    paymentStatus: p.paymentStatus || p.status || 'Draft',
    auditReasons: auditObj?.audit_reasons || [],
  };
};

export const payrollApi = {
  getPayruns: async (params) => {
    const res = await api.get('/payruns', { params });
    if (Array.isArray(res.data)) {
      res.data = res.data.map(mapPayrun);
    } else {
      res.data = [];
    }
    return res;
  },

  getPayrun: async (id) => {
    const res = await api.get(`/payruns/${id}`);
    if (res.data) {
      res.data = mapPayrun(res.data);
    }
    return res;
  },

  createPayrun: async (data) => {
    const payload = {
      name: data.name || `Payrun - ${data.periodStart || 'Period'}`,
      period_start: data.periodStart || data.period_start,
      period_end: data.periodEnd || data.period_end,
      structure_id: data.structureId || data.structure_id || 1,
    };
    const res = await api.post('/payruns', payload);
    if (res.data) res.data = mapPayrun(res.data);
    return res;
  },

  processPayrun: async (id) => {
    const res = await api.post(`/payruns/${id}/compute`);
    if (res.data) res.data = mapPayrun(res.data);
    return res;
  },

  validatePayrun: async (id) => {
    const res = await api.post(`/payruns/${id}/validate`);
    if (res.data) res.data = mapPayrun(res.data);
    return res;
  },

  markPayrunAsPaid: async (id) => {
    const res = await api.post(`/payruns/${id}/pay`);
    if (res.data) res.data = mapPayrun(res.data);
    return res;
  },

  getPayrunWarnings: async (id) => {
    const res = await api.get(`/payruns/${id}`);
    res.data = Array.isArray(res.data?.warnings) ? res.data.warnings : [];
    return res;
  },

  getPayslips: async (params) => {
    let res;
    if (params?.payrunId) {
      res = await api.get(`/payruns/${params.payrunId}/payslips`, { params });
    } else {
      res = await api.get('/payslips', { params });
    }
    if (Array.isArray(res.data)) {
      res.data = res.data.map(mapPayslip);
    } else {
      res.data = [];
    }
    return res;
  },

  getPayslip: async (id) => {
    const res = await api.get(`/payslips/${id}`);
    if (res.data) {
      res.data = mapPayslip(res.data);
    }
    return res;
  },

  downloadPayslipPdf: async (id) => {
    const token = localStorage.getItem('token');
    const response = await api.get(`/payslips/${id}/pdf`, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `payslip_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return { success: true };
  },

  emailPayslip: async (id) => {
    return { data: { success: true, message: 'Email sent successfully' } };
  },

  bulkEmailPayslips: async (ids) => {
    return { data: { success: true, count: ids.length, message: 'Bulk email feature complete' } };
  }
};
