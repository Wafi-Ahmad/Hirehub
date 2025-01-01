import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { userService } from '../services/userService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const userStr = localStorage.getItem('user');
      const userId = localStorage.getItem('userId');
      console.log('Initial user data from localStorage:', { userStr, userId });
      
      if (!userStr || userStr === '{}' || !userId) {
        console.log('No valid user data found in localStorage');
        return null;
      }

      const userData = JSON.parse(userStr);
      if (!userData || !userData.id || userData.id.toString() !== userId) {
        console.log('Invalid or mismatched user data:', { userData, userId });
        return null;
      }

      // Ensure profile picture has full URL
      if (userData.profile_picture && !userData.profile_picture.startsWith('http')) {
        userData.profile_picture = `http://localhost:8000${userData.profile_picture}`;
      }

      // Ensure userType is normalized
      if (userData.user_type && !userData.userType) {
        userData.userType = userData.user_type;
      }

      console.log('Successfully loaded user data:', userData);
      return userData;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  });

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

  // Update localStorage whenever user state changes
  useEffect(() => {
    console.log('User state changed:', user);
    if (user && user.id) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userId', user.id);
      setIsAuthenticated(true);
    } else {
      // Only clear if we're explicitly setting user to null
      if (user === null) {
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
      }
      setIsAuthenticated(false);
    }
  }, [user]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const refresh = localStorage.getItem('refresh');
        const userId = localStorage.getItem('userId');

        console.log('InitAuth - Stored tokens and userId:', { token: !!token, refresh: !!refresh, userId });

        if (!token || !refresh || !userId) {
          console.log('Missing required auth data');
          setLoading(false);
          return;
        }

        if (isTokenExpired(token)) {
          console.log('Token expired, attempting refresh');
          const refreshed = await refreshToken();
          if (!refreshed) {
            console.log('Token refresh failed');
            logout();
            setLoading(false);
            return;
          }
        }

        // console.log('Fetching user data from API');
        api.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
        // read user from localStorage  
        // let userData = localStorage.getItem('user')
        //   console.log('Received user data from API:', userData);
        //   setUser(userData);
        //   localStorage.setItem('user', JSON.stringify(userData));
          let userData = JSON.parse(localStorage.getItem("user"))
          setIsAuthenticated(true);
          setUser(userData)
        
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

  const login = async (loginResponse) => {
    try {
      console.log('Login function called with:', loginResponse);
      
      // Validate login response structure
      if (!loginResponse?.id || !loginResponse?.user || !loginResponse?.access) {
        console.error('Invalid login response structure:', {
          hasId: !!loginResponse?.id,
          hasUser: !!loginResponse?.user,
          hasAccess: !!loginResponse?.access,
          response: loginResponse
        });
        throw new Error('Invalid login response data');
      }
      
      // Process user data
      const userData = {
        id: loginResponse.id,
        ...loginResponse.user,
        profile_picture: loginResponse.user.profile_picture 
          ? `http://localhost:8000${loginResponse.user.profile_picture}`
          : null,
        userType: loginResponse.user.user_type
      };
      
      console.log('Processed user data:', userData);
      
      // Store auth data
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userId', loginResponse.id.toString());
      localStorage.setItem('token', loginResponse.access);
      localStorage.setItem('refresh', loginResponse.refresh);
      
      // Update API client
      api.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.access}`;
      
      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      
      console.log('Login successful, state updated');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await userService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
      // Reset auth state
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated,
      login,
      logout,
      refreshToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;