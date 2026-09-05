import api from './api';

// MOCK DATA
let mockUsers = [
  { id: 1, email: 'admin@peoplepay360.com', password: 'password', role: 'Admin', firstName: 'Sarah', lastName: 'Connor' },
  { id: 2, email: 'hr@peoplepay360.com', password: 'password', role: 'HR Manager', firstName: 'John', lastName: 'Smith' },
  { id: 3, email: 'payroll@peoplepay360.com', password: 'password', role: 'HR Payroll Manager', firstName: 'Alice', lastName: 'Johnson' },
  { id: 4, email: 'employee@peoplepay360.com', password: 'password', role: 'Employee', firstName: 'Jane', lastName: 'Doe' }
];

export const authApi = {
  login: async (credentials) => {
    // return api.post('/auth/login', credentials);
    return new Promise((resolve, reject) => setTimeout(() => {
      const user = mockUsers.find(u => u.email === credentials.email && u.password === credentials.password);
      if (user) {
        // Return mock JWT and user data
        resolve({ data: { token: 'mock-jwt-token-123', user } });
      } else {
        reject(new Error('Invalid email or password'));
      }
    }, 800));
  },
  
  register: async (data) => {
    // return api.post('/auth/register', data);
    return new Promise((resolve, reject) => setTimeout(() => {
      if (mockUsers.some(u => u.email === data.email)) {
        reject(new Error('Email already registered'));
      } else {
        const newUser = { 
          id: mockUsers.length + 1, 
          email: data.email, 
          password: data.password, // In real app, never send back password
          role: data.role || 'Employee', // Real backend verifies role
          firstName: data.firstName, 
          lastName: data.lastName 
        };
        mockUsers.push(newUser);
        resolve({ data: { success: true, message: 'Registration successful' } });
      }
    }, 1000));
  },
  
  logout: async () => {
    // return api.post('/auth/logout');
    return new Promise(resolve => setTimeout(() => resolve({ success: true }), 300));
  },
  
  getCurrentUser: async () => {
    // return api.get('/auth/me');
    return new Promise(resolve => setTimeout(() => {
      // For mock, just return the first user if called, though Context handles it usually via stored user
      resolve({ data: mockUsers[0] });
    }, 300));
  },
  
  forgotPassword: async (data) => {
    // return api.post('/auth/forgot-password', data);
    return new Promise((resolve, reject) => setTimeout(() => {
      const user = mockUsers.find(u => u.email === data.email);
      if (user) resolve({ data: { success: true, message: 'Password reset link sent' } });
      else reject(new Error('Email not found'));
    }, 1000));
  }
};
