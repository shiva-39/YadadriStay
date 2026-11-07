import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      try {
        const response = await api.get('/auth/me');
        const userData = response.data.data.user;
        // Verify user is super_admin
        if (userData.role === 'super_admin') {
          setUser(userData);
        } else {
          throw new Error('Not authorized');
        }
      } catch (error) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (phone, password) => {
    const response = await api.post('/auth/login', { phone, password });
    const { user, token, refreshToken } = response.data.data;

    // Verify user is super_admin
    if (user.role !== 'super_admin') {
      throw new Error('Access denied. Super admin only.');
    }

    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminRefreshToken', refreshToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    setUser(user);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}