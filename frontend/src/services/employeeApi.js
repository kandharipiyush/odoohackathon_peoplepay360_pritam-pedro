import api from './api';

// MOCK DATA
let mockEmployees = [
  {
    id: 1,
    employeeId: 'EMP001',
    firstName: 'Sarah',
    lastName: 'Connor',
    email: 'admin@peoplepay360.com',
    phone: '555-0101',
    department: 'Management',
    position: 'CEO',
    manager: null,
    joiningDate: '2020-01-15',
    status: 'Active'
  },
  {
    id: 2,
    employeeId: 'EMP002',
    firstName: 'John',
    lastName: 'Smith',
    email: 'hr@peoplepay360.com',
    phone: '555-0102',
    department: 'Human Resources',
    position: 'HR Manager',
    manager: 'EMP001',
    joiningDate: '2021-03-10',
    status: 'Active'
  },
  {
    id: 3,
    employeeId: 'EMP003',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'employee@peoplepay360.com',
    phone: '555-0103',
    department: 'Engineering',
    position: 'Software Engineer',
    manager: 'EMP001',
    joiningDate: '2023-06-01',
    status: 'Active'
  }
];

export const employeeApi = {
  getEmployees: async () => {
    // return api.get('/employees');
    return new Promise(resolve => setTimeout(() => resolve({ data: mockEmployees }), 500));
  },
  getEmployee: async (id) => {
    // return api.get(`/employees/${id}`);
    return new Promise(resolve => setTimeout(() => {
      const emp = mockEmployees.find(e => e.id === parseInt(id));
      resolve({ data: emp });
    }, 300));
  },
  createEmployee: async (data) => {
    // return api.post('/employees', data);
    return new Promise(resolve => setTimeout(() => {
      const newEmp = { ...data, id: mockEmployees.length + 1 };
      mockEmployees.push(newEmp);
      resolve({ data: newEmp });
    }, 500));
  },
  updateEmployee: async (id, data) => {
    // return api.put(`/employees/${id}`, data);
    return new Promise(resolve => setTimeout(() => {
      mockEmployees = mockEmployees.map(e => e.id === parseInt(id) ? { ...e, ...data } : e);
      resolve({ data: mockEmployees.find(e => e.id === parseInt(id)) });
    }, 500));
  },
  deactivateEmployee: async (id) => {
    // return api.put(`/employees/${id}/deactivate`);
    return new Promise(resolve => setTimeout(() => {
      mockEmployees = mockEmployees.map(e => e.id === parseInt(id) ? { ...e, status: 'Inactive' } : e);
      resolve({ success: true });
    }, 500));
  }
};
