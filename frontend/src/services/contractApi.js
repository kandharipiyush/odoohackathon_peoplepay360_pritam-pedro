import api from './api';

export const contractApi = {
  getContracts: async (params) => {
    return api.get('/contracts', { params });
  },

  getContract: async (id) => {
    return api.get(`/contracts/${id}`);
  },

  getEmployeeContracts: async (employeeId) => {
    return api.get(`/contracts/employee/${employeeId}`);
  },

  createContract: async (data) => {
    return api.post('/contracts', data);
  },

  updateContract: async (id, data) => {
    return api.put(`/contracts/${id}`, data);
  }
};
