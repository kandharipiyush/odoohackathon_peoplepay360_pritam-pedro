import api from './api';

export const authApi = {
  login: async (credentials) => {
    // The api.js interceptor auto-unwraps { success, data } → data
    // So response.data will be { token, user } directly
    const response = await api.post('/auth/login', credentials);
    return response;
  },

  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response;
  },

  forgotPassword: async (data) => {
    return { data: { success: true, message: 'Password reset link sent (demo mode)' } };
  }
};
