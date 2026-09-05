import api from './api';

export const timeOffApi = {
  getBalances: async (employeeId) => {
    // Fetch allocations for the employee and transform into balance format
    const response = await api.get('/time-off/allocations', { params: { employee_id: employeeId } });
    return response;
  },

  getRequests: async (params) => {
    return api.get('/time-off/requests', { params });
  },

  getRequest: async (id) => {
    return api.get(`/time-off/requests/${id}`);
  },

  createRequest: async (data) => {
    return api.post('/time-off/requests', data);
  },

  approveRequest: async (id) => {
    return api.post(`/time-off/requests/${id}/approve`);
  },

  rejectRequest: async (id, data) => {
    return api.post(`/time-off/requests/${id}/refuse`, data);
  },

  getAllocations: async (params) => {
    return api.get('/time-off/allocations', { params });
  },

  createAllocation: async (data) => {
    return api.post('/time-off/allocations', data);
  },

  getLeaveTypes: async () => {
    return api.get('/time-off/types');
  }
};
