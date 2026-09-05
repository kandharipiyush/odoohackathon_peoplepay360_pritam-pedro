import api from './api';

export const attendanceApi = {
  getAttendance: async (params) => {
    return api.get('/attendance', { params });
  },

  getEmployeeAttendance: async (employeeId) => {
    return api.get('/attendance', { params: { employee_id: employeeId } });
  },

  checkIn: async (data) => {
    return api.post('/attendance/check-in', data);
  },

  checkOut: async (data) => {
    return api.post('/attendance/check-out', data);
  },

  getExceptions: async (params) => {
    return api.get('/attendance', { params: { ...params, exception_flag: true } });
  },

  reviewException: async (id, data) => {
    return api.patch(`/attendance/${id}/exception`, data);
  }
};
