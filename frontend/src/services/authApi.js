import api from './api';

export const authApi = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    // Backend returns { success: true, data: { token, user } }
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
    // Backend does not have this endpoint yet — return a mock success
    return { data: { success: true, message: 'Password reset link sent (demo mode)' } };
  }
};
