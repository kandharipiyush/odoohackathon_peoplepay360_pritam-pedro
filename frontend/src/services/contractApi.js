import api from './api';

const mapContract = (c) => {
  if (!c) return c;
  const rawWage = parseFloat(c.wage || c.salary || 0);
  const startStr = c.startDate || (c.start_date ? String(c.start_date).split('T')[0] : '2026-01-01');
  const endStr = c.endDate || (c.end_date ? String(c.end_date).split('T')[0] : null);
  const empId = c.employeeId || (c.employee_id ? `EMP-${String(c.employee_id).padStart(3, '0')}` : 'EMP-000');
  
  return {
    ...c,
    id: c.id,
    employeeId: empId,
    employee_id: c.employee_id || c.employeeId,
    type: c.type || c.structure_name || 'Standard Full-Time',
    schedule: c.schedule || 'Standard 40h (Mon-Fri)',
    startDate: startStr,
    endDate: endStr,
    salary: rawWage,
    wage: rawWage,
    status: (c.status || 'ACTIVE').toUpperCase(),
  };
};

export const contractApi = {
  getContracts: async (params) => {
    const res = await api.get('/contracts', { params });
    if (Array.isArray(res.data)) {
      res.data = res.data.map(mapContract);
    } else {
      res.data = [];
    }
    return res;
  },

  getContract: async (id) => {
    const res = await api.get(`/contracts/${id}`);
    if (res.data) {
      res.data = mapContract(res.data);
    }
    return res;
  },

  getEmployeeContracts: async (employeeId) => {
    const res = await api.get(`/contracts/employee/${employeeId}`);
    if (Array.isArray(res.data)) {
      res.data = res.data.map(mapContract);
    } else {
      res.data = [];
    }
    return res;
  },

  createContract: async (data) => {
    const payload = {
      employee_id: data.employeeId || data.employee_id,
      wage: parseFloat(data.salary || data.wage || 0),
      start_date: data.startDate || data.start_date,
      end_date: data.endDate || data.end_date || null,
      salary_structure_id: data.salary_structure_id || 1,
      status: (data.status || 'Active').toLowerCase() === 'active' ? 'Active' : data.status,
    };
    const res = await api.post('/contracts', payload);
    if (res.data) res.data = mapContract(res.data);
    return res;
  },

  updateContract: async (id, data) => {
    const payload = {
      wage: parseFloat(data.salary || data.wage || 0),
      start_date: data.startDate || data.start_date,
      end_date: data.endDate || data.end_date || null,
      salary_structure_id: data.salary_structure_id || 1,
      status: data.status,
    };
    const res = await api.put(`/contracts/${id}`, payload);
    if (res.data) res.data = mapContract(res.data);
    return res;
  }
};
