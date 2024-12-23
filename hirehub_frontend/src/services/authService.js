import api from './api';

export const authService = {
  register: async (userData) => {
    const response = await api.post('/users/register/', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/users/login/', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/users/logout/');
    return response.data;
  }
}; 