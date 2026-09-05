import api from './api';

const mapEmployee = (emp) => {
  if (!emp) return emp;
  return {
    ...emp,
    id: emp.id,
    employeeId: emp.employeeId || emp.employee_id || `EMP-${String(emp.id).padStart(3, '0')}`,
    firstName: emp.firstName || emp.first_name || '',
    lastName: emp.lastName || emp.last_name || '',
    department: emp.department || 'Unassigned',
    position: emp.position || emp.job_position || emp.jobPosition || 'Staff',
    status: emp.status || 'Active',
    email: emp.email || '',
    managerId: emp.manager_id || emp.managerId || null,
  };
};

export const employeeApi = {
  getEmployees: async (params) => {
    const res = await api.get('/employees', { params });
    if (Array.isArray(res.data)) {
      res.data = res.data.map(mapEmployee);
    } else {
      res.data = [];
    }
    return res;
  },

  getEmployee: async (id) => {
    const res = await api.get(`/employees/${id}`);
    if (res.data) {
      res.data = mapEmployee(res.data);
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
    };
    const res = await api.post('/employees', payload);
    if (res.data) res.data = mapEmployee(res.data);
    return res;
  },

  updateEmployee: async (id, data) => {
    const payload = {
      first_name: data.firstName || data.first_name,
      last_name: data.lastName || data.last_name,
      email: data.email,
      department: data.department,
      job_position: data.position || data.job_position,
      manager_id: data.managerId || data.manager_id || null,
      status: data.status || 'Active',
    };
    const res = await api.put(`/employees/${id}`, payload);
    if (res.data) res.data = mapEmployee(res.data);
    return res;
  },

  deactivateEmployee: async (id) => {
    return api.put(`/employees/${id}`, { status: 'Terminated' });
  }
};
