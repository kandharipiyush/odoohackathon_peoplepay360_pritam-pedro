import api from './api';

export const employeeApi = {
  getEmployees: async (params) => {
    return api.get('/employees', { params });
  },

  getEmployee: async (id) => {
    return api.get(`/employees/${id}`);
  },

  createEmployee: async (data) => {
    return api.post('/employees', data);
  },

  updateEmployee: async (id, data) => {
    return api.put(`/employees/${id}`, data);
  },

  deactivateEmployee: async (id) => {
    return api.put(`/employees/${id}`, { status: 'Terminated' });
  }
};
