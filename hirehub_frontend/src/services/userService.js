import api from './api';

export const userService = {
  // Get connection recommendations
  getConnectionRecommendations: async (limit = 5) => {
    try {
      const response = await api.get('/users/recommendations/', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
  },

  // Follow a user
  followUser: async (userId) => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      const response = await api.post(`/users/follow/${userId}/`);
      return response;
    } catch (error) {
      console.error('Follow/unfollow error:', error);
      throw error;
    }
  },

  // Get user profile stats (followers/following)
  getProfileStats: async (userId = null) => {
    const endpoint = userId ? `/users/${userId}/followers-following/` : '/users/me/followers-following/';
    return api.get(endpoint);
  },

  // Get user profile
  getProfile: async (userId) => {
    return api.get(`/users/profile/${userId}/`);
  },

  // Get own profile
  getOwnProfile: async () => {
    return api.get('/users/profile/me/');
  },

  // Update user profile
  updateProfile: async (data) => {
    const formData = new FormData();
    
    // Add basic info
    if (data.first_name) formData.append('first_name', data.first_name);
    if (data.last_name) formData.append('last_name', data.last_name);
    if (data.title) formData.append('title', data.title);
    if (data.bio) formData.append('bio', data.bio);
    
    // Add media
    if (data.profile_picture) formData.append('profile_picture', data.profile_picture);
    if (data.cover_photo) formData.append('cover_photo', data.cover_photo);
    
    return api.patch('/users/update-profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Logout user
  logout: async () => {
    const refresh = localStorage.getItem('refresh');
    return api.post('/users/logout/', { refresh_token: refresh });
  },

  // Cancel a pending follow request (only for private profiles with pending requests)
  cancelFollowRequest: async (userId) => {
    try {
      const response = await api.post(`/users/${userId}/cancel-follow-request/`);
      return response;
    } catch (error) {
      console.error('Cancel follow request error:', error);
      throw error;
    }
  },

  handleFollowRequest: async (notificationId, action) => {
    try {
      const response = await api.post(`/users/follow-request/${notificationId}/`, { action });
      return response;
    } catch (error) {
      throw error;
    }
  },

  getNotifications: async () => {
    try {
      const response = await api.get('/users/notifications/');
      return response;
    } catch (error) {
      throw error;
    }
  },

  deleteAccount: async () => {
    try {
      const response = await api.delete('/users/delete-account/');
      return response;
    } catch (error) {
      throw error;
    }
  },

  getFollowersFollowing: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/followers-following/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching followers/following:', error);
      throw error;
    }
  }
};
