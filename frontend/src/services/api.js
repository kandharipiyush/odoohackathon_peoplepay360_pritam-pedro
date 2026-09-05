import axios from 'axios';

// Base URL configured via Vite env or defaulting to local Express backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and unwrap standard backend response envelope { success: true, data: ... }
api.interceptors.response.use(
  (response) => {
    // If backend returns standard envelope { success: true, data: ... }, unwrap data into response.data
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    const { response } = error;

    if (response) {
      // Unpack descriptive error message from server response envelope
      const serverMessage = response.data?.error || response.data?.message;
      if (serverMessage && typeof serverMessage === 'string') {
        error.message = serverMessage;
      }

      // 401 Unauthorized: token expired or missing
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('unauthorized'));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
