import React, { createContext, useState, useEffect, useContext } from 'react';
import { authApi } from '../services/authApi';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }

    const handleUnauthorized = () => logout();
    window.addEventListener('unauthorized', handleUnauthorized);

    setLoading(false);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authApi.login({ email, password });

      // After the api.js interceptor unwraps { success, data } → data,
      // response.data is { token, user } directly.
      // But handle both shapes defensively:
      const payload = response.data;
      let tokenValue, userData;

      if (payload && payload.token) {
        // Unwrapped shape: { token, user }
        tokenValue = payload.token;
        userData = payload.user;
      } else if (payload && payload.data && payload.data.token) {
        // Non-unwrapped shape fallback: { success, data: { token, user } }
        tokenValue = payload.data.token;
        userData = payload.data.user;
      } else {
        return { success: false, error: 'Unexpected response format' };
      }

      setToken(tokenValue);
      setCurrentUser(userData);
      localStorage.setItem('token', tokenValue);
      localStorage.setItem('user', JSON.stringify(userData));

      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Login failed';
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = {
    currentUser,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
