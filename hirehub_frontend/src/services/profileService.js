import api from './api';

export const profileService = {
  getProfile: async (userId = null) => {
    try {
      const endpoint = userId ? `/users/profile/${userId}` : '/users/profile/me';
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateProfile: async (formData) => {
    try {
      // Convert formData to FormData object if it's not already
      const form = formData instanceof FormData ? formData : new FormData();
      
      // If formData is not already FormData, append each field
      if (!(formData instanceof FormData)) {
        Object.keys(formData).forEach(key => {
          if (formData[key] !== null && formData[key] !== undefined) {
            if (key === 'skills' && Array.isArray(formData[key])) {
              form.append(key, JSON.stringify(formData[key]));
            } else {
              form.append(key, formData[key]);
            }
          }
        });
      }

      const response = await api.patch('/users/update-basic-info/', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getFollowData: async (userId = null) => {
    try {
      // If no userId provided, get current user's ID from localStorage
      if (!userId) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          userId = user.id;
        }
      }
      
      if (!userId) {
        throw new Error('No user ID available');
      }
      console.log(`getting follow data for ${userId}`);
      const endpoint = `/users/${userId}/followers-following`;
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUserPosts: async (userId = null, cursor = null, limit = 10) => {
    try {
      // If no userId provided, get current user's ID from localStorage
      if (!userId) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          userId = user.id;
        }
      }
      
      if (!userId) {
        throw new Error('No user ID available');
      }

      const endpoint = `/posts/user/${userId}/`;
      const params = { cursor, limit };
      const response = await api.get(endpoint, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updatePrivacySettings: async (settings) => {
    try {
      const response = await api.put('/users/privacy-settings/', settings);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default profileService;
