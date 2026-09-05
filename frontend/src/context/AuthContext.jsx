import React, { createContext, useState, useEffect, useContext } from 'react';
import { authApi } from '../services/authApi';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token and user on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        // Corrupted stored user — clear it
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    
    // Listen for unauthorized events to trigger logout
    const handleUnauthorized = () => logout();
    window.addEventListener('unauthorized', handleUnauthorized);

    setLoading(false);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authApi.login({ email, password });
      
      // Backend returns: { data: { success: true, data: { token, user } } }
      // Axios wraps in response.data, so we get: response.data = { success, data: { token, user } }
      const responseData = response.data;
      
      // Handle both envelope formats for robustness
      let tokenValue, userData;
      if (responseData.data && responseData.data.token) {
        // Standard backend envelope: { success: true, data: { token, user } }
        tokenValue = responseData.data.token;
        userData = responseData.data.user;
      } else if (responseData.token) {
        // Flat format fallback
        tokenValue = responseData.token;
        userData = responseData.user;
      } else {
        return { success: false, error: 'Unexpected response format from server' };
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
