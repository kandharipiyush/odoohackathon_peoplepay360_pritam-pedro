import api from './api';

// MOCK DATA
let mockRequests = [
  {
    id: 1,
    employeeId: 3,
    leaveType: 'Annual Leave',
    startDate: '2023-12-20',
    endDate: '2023-12-24',
    duration: 5,
    reason: 'Family vacation',
    status: 'Pending',
    submittedDate: '2023-11-15'
  }
];

let mockBalances = [
  {
    employeeId: 3,
    balances: {
      'Annual Leave': { allocated: 20, used: 5, pending: 5, remaining: 10 },
      'Sick Leave': { allocated: 10, used: 2, pending: 0, remaining: 8 }
    }
  }
];

let mockAllocations = [
  {
    id: 1,
    employeeId: 3,
    leaveType: 'Annual Leave',
    allocatedDays: 20,
    usedDays: 5,
    validFrom: '2023-01-01',
    validUntil: '2023-12-31',
    status: 'Active'
  }
];

export const timeOffApi = {
  getBalances: async (employeeId) => {
    // return api.get(`/time-off/balances/${employeeId}`);
    return new Promise(resolve => setTimeout(() => {
      const b = mockBalances.find(b => b.employeeId === parseInt(employeeId));
      resolve({ data: b ? b.balances : {} });
    }, 300));
  },
  getRequests: async (params) => {
    // return api.get('/time-off/requests', { params });
    return new Promise(resolve => setTimeout(() => {
      let filtered = mockRequests;
      if (params?.employeeId) {
        filtered = filtered.filter(r => r.employeeId === parseInt(params.employeeId));
      }
      resolve({ data: filtered });
    }, 400));
  },
  getRequest: async (id) => {
    // return api.get(`/time-off/requests/${id}`);
    return new Promise(resolve => setTimeout(() => {
      resolve({ data: mockRequests.find(r => r.id === parseInt(id)) });
    }, 300));
  },
  createRequest: async (data) => {
    // return api.post('/time-off/requests', data);
    return new Promise(resolve => setTimeout(() => {
      const newReq = { 
        ...data, 
        id: mockRequests.length + 1, 
        status: 'Pending',
        submittedDate: new Date().toISOString().split('T')[0]
      };
      mockRequests.push(newReq);
      resolve({ data: newReq });
    }, 500));
  },
  approveRequest: async (id) => {
    // return api.put(`/time-off/requests/${id}/approve`);
    return new Promise(resolve => setTimeout(() => {
      const req = mockRequests.find(r => r.id === parseInt(id));
      if (req) req.status = 'Approved';
      resolve({ data: req });
    }, 500));
  },
  rejectRequest: async (id, data) => {
    // return api.put(`/time-off/requests/${id}/reject`, data);
    return new Promise(resolve => setTimeout(() => {
      const req = mockRequests.find(r => r.id === parseInt(id));
      if (req) {
        req.status = 'Rejected';
        req.rejectionReason = data.reason;
      }
      resolve({ data: req });
    }, 500));
  },
  getAllocations: async (params) => {
    // return api.get('/time-off/allocations', { params });
    return new Promise(resolve => setTimeout(() => {
      resolve({ data: mockAllocations });
    }, 400));
  },
  createAllocation: async (data) => {
    // return api.post('/time-off/allocations', data);
    return new Promise(resolve => setTimeout(() => {
      const newAlloc = { ...data, id: mockAllocations.length + 1, status: 'Active', usedDays: 0 };
      mockAllocations.push(newAlloc);
      resolve({ data: newAlloc });
    }, 500));
  }
};
