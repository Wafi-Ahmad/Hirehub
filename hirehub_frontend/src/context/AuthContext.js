import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refresh');
      if (!refresh) throw new Error('No refresh token');

      const response = await axios.post('http://localhost:8000/api/token/refresh/', {
        refresh: refresh
      });

      if (response.data.access) {
        localStorage.setItem('token', response.data.access);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  const isTokenExpired = (token) => {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= expiry - 60000; // Check 1 minute before expiry
    } catch (error) {
      return true;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const refresh = localStorage.getItem('refresh');

        if (!token || !refresh) {
          setLoading(false);
          return;
        }

        if (isTokenExpired(token)) {
          const refreshed = await refreshToken();
          if (!refreshed) {
            logout();
            setLoading(false);
            return;
          }
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
        const response = await api.get('/users/update-basic-info/');

        if (response.data) {
          setUser({
            id: response.data.id,
            email: response.data.email,
            userType: response.data.user_type,
            firstName: response.data.first_name,
            lastName: response.data.last_name
          });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (error.response?.status === 401) {
          const refreshed = await refreshToken();
          if (!refreshed) {
            logout();
          }
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    let refreshInterval;

    if (isAuthenticated) {
      refreshInterval = setInterval(async () => {
        const token = localStorage.getItem('token');
        if (isTokenExpired(token)) {
          const refreshed = await refreshToken();
          if (!refreshed) {
            logout();
          }
        }
      }, 240000); // Check every 4 minutes
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isAuthenticated]);

  const login = async (userData) => {
    try {
      setUser(userData);
      setIsAuthenticated(true);
      api.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      isAuthenticated, 
      loading,
      login,
      logout,
      refreshToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 