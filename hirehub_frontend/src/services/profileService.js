import api from './api';

const profileService = {
  // Get current user's profile
  getCurrentProfile: async () => {
    try {
      const response = await api.get('/users/update-basic-info/');
      return response.data;
    } catch (error) {
      console.error('Error fetching current profile:', error);
      throw error;
    }
  },

  // Get specific user's profile
  getUserProfile: async (userId) => {
    try {
      const response = await api.get(`/users/view-profile/${userId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Get follow data
  getFollowData: async () => {
    try {
      const response = await api.get('/users/followers-following/');
      return response.data;
    } catch (error) {
      console.error('Error fetching follow data:', error);
      throw error;
    }
  },

  // Update profile
  updateProfile: async (data) => {
    try {
      const response = await api.put('/users/update-basic-info/', data);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
};

export default profileService; 