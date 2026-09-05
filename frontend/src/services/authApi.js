import api from './api';

export const authApi = {
  login: async (email, password) => {
    // In a real scenario:
    // const response = await api.post('/auth/login', { email, password });
    // return response.data;
    
    // MOCK IMPLEMENTATION FOR DEVELOPMENT
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === 'admin@peoplepay360.com' && password === 'password') {
          resolve({
            token: 'mock-jwt-token-admin',
            user: { id: 1, name: 'System Admin', email, role: 'Admin' }
          });
        } else if (email === 'hr@peoplepay360.com' && password === 'password') {
          resolve({
            token: 'mock-jwt-token-hr',
            user: { id: 2, name: 'HR Manager', email, role: 'HR Manager' }
          });
        } else if (email === 'employee@peoplepay360.com' && password === 'password') {
          resolve({
            token: 'mock-jwt-token-emp',
            user: { id: 3, name: 'Regular Employee', email, role: 'Employee' }
          });
        } else {
          reject(new Error('Invalid email or password'));
        }
      }, 1000);
    });
  },
  
  // Other potential auth endpoints:
  // logout: () => api.post('/auth/logout'),
  // getCurrentUser: () => api.get('/auth/me'),
};
