import api from './api';

const mapAttendance = (a) => {
  if (!a) return a;
  const checkInDate = a.check_in ? new Date(a.check_in) : null;
  const checkOutDate = a.check_out ? new Date(a.check_out) : null;
  
  let formattedIn = a.checkIn;
  if (!formattedIn && checkInDate) {
    formattedIn = checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  let formattedOut = a.checkOut;
  if (!formattedOut && checkOutDate) {
    formattedOut = checkOutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  let dateStr = a.date;
  if (!dateStr && checkInDate) {
    dateStr = checkInDate.toISOString().split('T')[0];
  }

  const empId = a.employeeId || (a.employee_id ? `EMP-${String(a.employee_id).padStart(3, '0')}` : 'EMP-000');
  const worked = parseFloat(a.workedHours || a.worked_hours || 0);

  return {
    ...a,
    id: a.id,
    employeeId: empId,
    employee_id: a.employee_id,
    date: dateStr || 'Today',
    checkIn: formattedIn,
    checkOut: formattedOut,
    workedHours: worked,
    status: a.status === 'CHECKED_IN' || a.status === 'CHECKED_OUT' ? a.status : (checkInDate ? (checkOutDate ? 'CHECKED_OUT' : 'CHECKED_IN') : 'ABSENT'),
    exception: a.exception || (a.exception_flag ? (a.status || 'Manual Exception') : null),
  };
};

export const attendanceApi = {
  getAttendance: async (params) => {
    const res = await api.get('/attendance', { params });
    if (Array.isArray(res.data)) {
      res.data = res.data.map(mapAttendance);
    } else {
      res.data = [];
    }
    return res;
  },

  getEmployeeAttendance: async (employeeId) => {
    const res = await api.get('/attendance', { params: { employee_id: employeeId } });
    if (Array.isArray(res.data)) {
      res.data = res.data.map(mapAttendance);
    } else {
      res.data = [];
    }
    return res;
  },

  checkIn: async (data) => {
    const payload = {
      employee_id: data.employee_id || data.employeeId,
      check_in_time: data.check_in_time || data.checkInTime || null,
    };
    const res = await api.post('/attendance/check-in', payload);
    if (res.data) res.data = mapAttendance(res.data);
    return res;
  },

  checkOut: async (data) => {
    const payload = {
      employee_id: data.employee_id || data.employeeId,
      check_out_time: data.check_out_time || data.checkOutTime || null,
    };
    const res = await api.post('/attendance/check-out', payload);
    if (res.data) res.data = mapAttendance(res.data);
    return res;
  },

  getExceptions: async (params) => {
    const res = await api.get('/attendance', { params: { ...params, exception_flag: true } });
    if (Array.isArray(res.data)) {
      res.data = res.data.map(mapAttendance);
    } else {
      res.data = [];
    }
    return res;
  },

  reviewException: async (id, data) => {
    const res = await api.patch(`/attendance/${id}/exception`, data);
    if (res.data) res.data = mapAttendance(res.data);
    return res;
  }
};
