import api from './api';

const connectionService = {
  sendRequest: async (receiverId) => {
    try {
      const response = await api.post(`/api/connections/send-request/${receiverId}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  handleRequest: async (requestId, action) => {
    try {
      const response = await api.post(`/api/connections/handle-request/${requestId}/`, {
        action: action
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getConnectionStatus: async (userId) => {
    try {
      const response = await api.get(`/api/connections/status/${userId}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default connectionService;