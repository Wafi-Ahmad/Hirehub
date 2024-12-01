import axios from 'axios';

const connectionService = {
  sendRequest: async (receiverId) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/send-request/${receiverId}/`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  handleRequest: async (requestId, action) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/handle-request/${requestId}/`,
        { action }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get connection status with a user
  getConnectionStatus: async (userId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/connection-status/${userId}/`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default connectionService; 