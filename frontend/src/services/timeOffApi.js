import api from './api';

export const timeOffApi = {
  getBalances: async (employeeId) => {
    const res = await api.get('/time-off/allocations', { params: { employee_id: employeeId } });
    const rawAllocations = Array.isArray(res.data) ? res.data : [];
    
    // Transform DB allocations list into key-value map expected by TimeOff view
    const balances = {
      'Annual Leave': { remaining: 20, used: 0, allocated: 20 },
      'Sick Leave': { remaining: 10, used: 0, allocated: 10 },
      'Unpaid Leave': { remaining: 'Unlimited', used: 0, allocated: 'N/A' },
    };

    rawAllocations.forEach(alloc => {
      const typeName = alloc.leave_type_name || alloc.name || 'Annual Leave';
      const allocated = parseFloat(alloc.total_days || 0);
      const used = parseFloat(alloc.taken_days || 0);
      balances[typeName] = {
        allocated,
        used,
        remaining: Math.max(0, allocated - used)
      };
    });

    res.data = balances;
    return res;
  },

  getRequests: async (params) => {
    const res = await api.get('/time-off/requests', { params });
    const raw = Array.isArray(res.data) ? res.data : [];
    
    res.data = raw.map(r => ({
      ...r,
      id: r.id,
      leaveType: r.leave_type_name || r.leaveType || 'Paid Leave',
      startDate: r.start_date ? String(r.start_date).split('T')[0] : r.startDate,
      endDate: r.end_date ? String(r.end_date).split('T')[0] : r.endDate,
      duration: parseFloat(r.number_of_days || r.duration || 1),
      submittedDate: r.created_at ? String(r.created_at).split('T')[0] : 'Recently',
      status: r.status || 'Pending'
    }));
    return res;
  },

  getRequest: async (id) => {
    const res = await api.get(`/time-off/requests/${id}`);
    if (res.data) {
      const r = res.data;
      res.data = {
        ...r,
        id: r.id,
        leaveType: r.leave_type_name || r.leaveType || 'Paid Leave',
        startDate: r.start_date ? String(r.start_date).split('T')[0] : r.startDate,
        endDate: r.end_date ? String(r.end_date).split('T')[0] : r.endDate,
        duration: parseFloat(r.number_of_days || r.duration || 1),
        submittedDate: r.created_at ? String(r.created_at).split('T')[0] : 'Recently',
        status: r.status || 'Pending'
      };
    }
    return res;
  },

  createRequest: async (data) => {
    const payload = {
      employee_id: data.employeeId || data.employee_id,
      leave_type_id: data.leave_type_id || data.leaveTypeId || data.leaveType,
      leaveType: data.leaveType || data.leave_type,
      start_date: data.startDate || data.start_date,
      end_date: data.endDate || data.end_date,
      duration: parseFloat(data.duration || data.number_of_days || 1),
      number_of_days: parseFloat(data.duration || data.number_of_days || 1),
      reason: data.reason || '',
    };
    return api.post('/time-off/requests', payload);
  },

  approveRequest: async (id) => {
    return api.post(`/time-off/requests/${id}/approve`);
  },

  rejectRequest: async (id, data) => {
    return api.post(`/time-off/requests/${id}/refuse`, data);
  },

  getAllocations: async (params) => {
    const res = await api.get('/time-off/allocations', { params });
    const raw = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    res.data = raw.map(a => ({
      ...a,
      id: a.id,
      employeeId: a.employee_id ? `EMP-${a.employee_id}` : (a.employeeId || 'EMP-001'),
      rawEmployeeId: a.employee_id || a.employeeId,
      employeeName: a.employee_name || `${a.first_name || ''} ${a.last_name || ''}`.trim() || `Employee ${a.employee_id || ''}`,
      leaveType: a.leave_type_name || a.leaveType || 'Annual Leave',
      allocatedDays: parseFloat(a.total_days ?? a.allocatedDays ?? 0),
      usedDays: parseFloat(a.taken_days ?? a.usedDays ?? 0),
      remainingDays: Math.max(0, parseFloat(a.total_days ?? a.allocatedDays ?? 0) - parseFloat(a.taken_days ?? a.usedDays ?? 0)),
      validUntil: a.validity_end ? String(a.validity_end).split('T')[0] : (a.validUntil || '2026-12-31')
    }));
    return res;
  },

  createAllocation: async (data) => {
    const payload = {
      employee_id: data.employeeId || data.employee_id,
      leave_type_id: data.leave_type_id || 1,
      total_days: parseFloat(data.allocatedDays || data.total_days || 0),
      validity_start: data.validity_start || '2026-01-01',
      validity_end: data.validity_end || '2026-12-31',
    };
    return api.post('/time-off/allocations', payload);
  },

  getLeaveTypes: async () => {
    return api.get('/time-off/types');
  }
};
