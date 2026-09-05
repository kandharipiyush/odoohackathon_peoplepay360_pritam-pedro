import api from './api';

const mapEmployee = (emp) => {
  if (!emp) return emp;
  const item = (emp && typeof emp === 'object' && 'data' in emp && emp.data && typeof emp.data === 'object') ? emp.data : emp;
  return {
    ...item,
    id: item.id,
    employeeId: item.employeeId || item.employee_id || `EMP-${String(item.id).padStart(3, '0')}`,
    firstName: item.firstName || item.first_name || '',
    lastName: item.lastName || item.last_name || '',
    department: item.department || 'Unassigned',
    position: item.position || item.job_position || item.jobPosition || 'Staff',
    job_position: item.job_position || item.position || 'Staff',
    status: item.status || 'Active',
    email: item.email || '',
    phone: item.phone || '',
    managerId: item.manager_id || item.managerId || null,
  };
};

export const employeeApi = {
  getEmployees: async (params) => {
    const res = await api.get('/employees', { params });
    const rawList = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
    res.data = rawList.map(mapEmployee);
    return res;
  },

  getEmployee: async (id) => {
    const res = await api.get(`/employees/${id}`);
    const raw = (res.data && res.data.data) ? res.data.data : res.data;
    if (raw) {
      res.data = mapEmployee(raw);
    }
    return res;
  },

  createEmployee: async (data) => {
    const payload = {
      first_name: data.firstName || data.first_name,
      last_name: data.lastName || data.last_name,
      email: data.email,
      department: data.department,
      job_position: data.position || data.job_position,
      manager_id: data.managerId || data.manager_id || null,
      status: data.status || 'Active',
      role: data.role || 'Employee',
      password: data.password || null,
      wage: data.wage || 75000,
    };
    const res = await api.post('/employees', payload);
    const raw = (res.data && res.data.data) ? res.data.data : res.data;
    if (raw) res.data = mapEmployee(raw);
    return res;
  },

  getPendingEmployees: async () => {
    const res = await api.get('/employees/pending');
    const rawList = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
    res.data = rawList.map(mapEmployee);
    return res;
  },

  approveEmployee: async (id, data) => {
    const payload = {
      job_position: data.position || data.job_position,
      department: data.department,
      manager_id: data.managerId || data.manager_id || null,
      role: data.role || 'Employee',
      wage: data.wage || 75000,
      allocated_days: data.allocatedDays || 20,
    };
    return api.post(`/employees/${id}/approve`, payload);
  },

  rejectEmployee: async (id) => {
    return api.post(`/employees/${id}/reject`);
  },

  updateEmployee: async (id, data) => {
    const payload = {
      first_name: data.firstName || data.first_name,
      last_name: data.lastName || data.last_name,
      email: data.email,
      phone: data.phone,
      department: data.department,
      job_position: data.position || data.job_position,
      manager_id: data.managerId || data.manager_id || null,
      status: data.status || 'Active',
    };
    const res = await api.put(`/employees/${id}`, payload);
    const raw = (res.data && res.data.data) ? res.data.data : res.data;
    if (raw) res.data = mapEmployee(raw);
    return res;
  },

  deactivateEmployee: async (id) => {
    return api.put(`/employees/${id}`, { status: 'Terminated' });
  }
};
