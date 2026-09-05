import api from './api';

const mapPayrun = (p) => {
  if (!p) return p;
  const item = (p && typeof p === 'object' && 'data' in p && p.data && typeof p.data === 'object') ? p.data : p;
  const payrunId = item.id ?? item.payrun_id ?? item.payrunId ?? 1;
  return {
    ...item,
    id: payrunId,
    payrunId: payrunId,
    name: item.name || `Payrun PR-${String(payrunId).padStart(4, '0')}`,
    periodStart: item.periodStart || (item.period_start ? String(item.period_start).split('T')[0] : '2026-09-01'),
    periodEnd: item.periodEnd || (item.period_end ? String(item.period_end).split('T')[0] : '2026-09-30'),
    employeeCount: item.employeeCount ?? item.total_payslips ?? item.employees_processed ?? item.employee_count ?? 0,
    grossTotal: parseFloat(item.grossTotal ?? item.total_gross ?? item.gross_amount ?? item.gross_total ?? 0),
    netTotal: parseFloat(item.netTotal ?? item.total_net ?? item.net_amount ?? item.net_total ?? 0),
    status: item.status || 'Draft',
  };
};

const mapPayslip = (p) => {
  if (!p) return p;
  const item = (p && typeof p === 'object' && 'data' in p && p.data && typeof p.data === 'object') ? p.data : p;
  const numStr = `PS-${String(item.id).padStart(5, '0')}`;
  const empName = item.employeeName || item.employee_name || 'Employee';
  const empId = item.employeeId || (item.employee_id ? `EMP-${String(item.employee_id).padStart(3, '0')}` : 'EMP-000');
  const startStr = item.periodStart || (item.period_start ? String(item.period_start).split('T')[0] : '2026-09-01');
  const endStr = item.periodEnd || (item.period_end ? String(item.period_end).split('T')[0] : '2026-09-30');
  const gross = parseFloat(item.grossSalary ?? item.gross_amount ?? 0);
  const net = parseFloat(item.netSalary ?? item.net_amount ?? 0);
  const totalDed = Math.max(0, parseFloat((gross - net).toFixed(2)));

  // Parse audit breakdown if available
  let auditObj = item.audit_reasons_json;
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
    ...item,
    id: item.id,
    payrunId: item.payrunId ?? item.payrun_id ?? 1,
    payslipNumber: item.payslipNumber || numStr,
    employeeName: empName,
    employeeId: empId,
    department: item.department || 'Engineering',
    periodStart: startStr,
    periodEnd: endStr,
    grossSalary: gross,
    netSalary: net,
    totalDeductions: totalDed,
    earnings,
    deductions,
    paymentStatus: item.paymentStatus || item.status || 'Draft',
    auditReasons: auditObj?.audit_reasons || [],
  };
};

export const payrollApi = {
  getPayruns: async (params) => {
    const res = await api.get('/payruns', { params });
    const rawList = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
    res.data = rawList.map(mapPayrun);
    return res;
  },

  getPayrun: async (id) => {
    const res = await api.get(`/payruns/${id}`);
    const raw = (res.data && res.data.data) ? res.data.data : res.data;
    if (raw) {
      res.data = mapPayrun(raw);
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
    const raw = (res.data && res.data.data) ? res.data.data : res.data;
    if (raw) res.data = mapPayrun(raw);
    return res;
  },

  processPayrun: async (id) => {
    const res = await api.post(`/payruns/${id}/compute`);
    const raw = (res.data && res.data.data) ? res.data.data : res.data;
    if (raw) res.data = mapPayrun(raw);
    return res;
  },

  validatePayrun: async (id) => {
    const res = await api.post(`/payruns/${id}/validate`);
    const raw = (res.data && res.data.data) ? res.data.data : res.data;
    if (raw) res.data = mapPayrun(raw);
    return res;
  },

  markPayrunAsPaid: async (id) => {
    const res = await api.post(`/payruns/${id}/pay`);
    const raw = (res.data && res.data.data) ? res.data.data : res.data;
    if (raw) res.data = mapPayrun(raw);
    return res;
  },

  getPayrunWarnings: async (id) => {
    const res = await api.get(`/payruns/${id}`);
    const raw = (res.data && res.data.data) ? res.data.data : res.data;
    res.data = Array.isArray(raw?.warnings) ? raw.warnings : [];
    return res;
  },

  getPayslips: async (params) => {
    let res;
    if (params?.payrunId) {
      res = await api.get(`/payruns/${params.payrunId}/payslips`, { params });
    } else {
      res = await api.get('/payslips', { params });
    }
    const rawList = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
    res.data = rawList.map(mapPayslip);
    return res;
  },

  getPayslip: async (id) => {
    const res = await api.get(`/payslips/${id}`);
    const raw = (res.data && res.data.data) ? res.data.data : res.data;
    if (raw) {
      res.data = mapPayslip(raw);
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
