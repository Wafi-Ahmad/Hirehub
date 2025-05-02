import api from './api';

export const cvService = {
  // Upload CV file only
  uploadCV: async (file) => {
    try {
      const formData = new FormData();
      formData.append('cv_file', file);
      
      const response = await api.post('/cv/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('CV upload error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Parse an uploaded CV without updating profile
  parseCV: async () => {
    try {
      const response = await api.get('/cv/parse/');
      return response.data;
    } catch (error) {
      console.error('CV parsing error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Parse an already uploaded CV to update profile
  // This version assumes the CV is already on the server for the user
  parseAndUpdateProfile: async () => { // Removed file parameter
    try {
      // Log the request type
      console.log('Sending parse and update request (POST, no file data)');
      
      // Send a standard POST request without FormData or specific Content-Type
      // api.js defaults to 'application/json', which is fine for this trigger
      const response = await api.post('/cv/parse-and-update/'); // Removed formData and headers
      
      return response.data;
    } catch (error) {
      // Log detailed error information
      console.error('CV parse and update error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }
};

export default cvService; 