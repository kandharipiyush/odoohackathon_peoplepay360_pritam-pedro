import api from './api';

// MOCK DATA
let mockContracts = [
  {
    id: 1,
    employeeId: 3,
    type: 'Full-Time',
    startDate: '2023-06-01',
    endDate: null,
    schedule: 'Standard 40h',
    salary: 85000,
    status: 'ACTIVE'
  },
  {
    id: 2,
    employeeId: 2,
    type: 'Full-Time',
    startDate: '2021-03-10',
    endDate: null,
    schedule: 'Standard 40h',
    salary: 95000,
    status: 'ACTIVE'
  }
];

export const contractApi = {
  getContracts: async (params) => {
    // return api.get('/contracts', { params });
    return new Promise(resolve => setTimeout(() => resolve({ data: mockContracts }), 500));
  },
  getContract: async (id) => {
    // return api.get(`/contracts/${id}`);
    return new Promise(resolve => setTimeout(() => {
      resolve({ data: mockContracts.find(c => c.id === parseInt(id)) });
    }, 300));
  },
  getEmployeeContracts: async (employeeId) => {
    // return api.get(`/employees/${employeeId}/contracts`);
    return new Promise(resolve => setTimeout(() => {
      resolve({ data: mockContracts.filter(c => c.employeeId === parseInt(employeeId)) });
    }, 400));
  },
  createContract: async (data) => {
    // return api.post('/contracts', data);
    return new Promise(resolve => setTimeout(() => {
      const newContract = { ...data, id: mockContracts.length + 1 };
      mockContracts.push(newContract);
      resolve({ data: newContract });
    }, 500));
  },
  updateContract: async (id, data) => {
    // return api.put(`/contracts/${id}`, data);
    return new Promise(resolve => setTimeout(() => {
      mockContracts = mockContracts.map(c => c.id === parseInt(id) ? { ...c, ...data } : c);
      resolve({ data: mockContracts.find(c => c.id === parseInt(id)) });
    }, 500));
  }
};
