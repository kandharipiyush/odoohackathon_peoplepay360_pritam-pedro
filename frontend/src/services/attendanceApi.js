import api from './api';

// MOCK DATA
let mockAttendance = [
  {
    id: 1,
    employeeId: 3,
    date: new Date().toISOString().split('T')[0], // Today
    checkIn: '09:05',
    checkOut: null,
    workedHours: null,
    expectedHours: 8,
    overtime: 0,
    status: 'CHECKED_IN',
    exception: 'Late Arrival'
  },
  {
    id: 2,
    employeeId: 2,
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:50',
    checkOut: '17:10',
    workedHours: 8.3,
    expectedHours: 8,
    overtime: 0.3,
    status: 'CHECKED_OUT',
    exception: null
  }
];

export const attendanceApi = {
  getAttendance: async (params) => {
    // return api.get('/attendance', { params });
    return new Promise(resolve => setTimeout(() => resolve({ data: mockAttendance }), 400));
  },
  getEmployeeAttendance: async (employeeId) => {
    // return api.get(`/employees/${employeeId}/attendance`);
    return new Promise(resolve => setTimeout(() => {
      resolve({ data: mockAttendance.filter(a => a.employeeId === parseInt(employeeId)) });
    }, 300));
  },
  checkIn: async (data) => {
    // return api.post('/attendance/check-in', data);
    return new Promise(resolve => setTimeout(() => {
      const newRecord = {
        id: mockAttendance.length + 1,
        employeeId: data.employeeId,
        date: new Date().toISOString().split('T')[0],
        checkIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        checkOut: null,
        status: 'CHECKED_IN',
        expectedHours: 8
      };
      mockAttendance.push(newRecord);
      resolve({ data: newRecord });
    }, 500));
  },
  checkOut: async (data) => {
    // return api.post('/attendance/check-out', data);
    return new Promise(resolve => setTimeout(() => {
      const record = mockAttendance.find(a => a.employeeId === data.employeeId && a.status === 'CHECKED_IN');
      if (record) {
        record.checkOut = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        record.status = 'CHECKED_OUT';
        record.workedHours = 8; // mock calculation
      }
      resolve({ data: record });
    }, 500));
  },
  getExceptions: async (params) => {
    // return api.get('/attendance/exceptions', { params });
    return new Promise(resolve => setTimeout(() => {
      resolve({ data: mockAttendance.filter(a => a.exception) });
    }, 400));
  },
  reviewException: async (id, data) => {
    // return api.put(`/attendance/exceptions/${id}/review`, data);
    return new Promise(resolve => setTimeout(() => {
      const record = mockAttendance.find(a => a.id === parseInt(id));
      if (record) {
        record.exception = null; // Resolved
      }
      resolve({ data: record });
    }, 500));
  }
};
