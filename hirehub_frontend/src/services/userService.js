import api from './api';

export const userService = {
  // Get user profile stats
  getProfileStats: async () => {
    return api.get('/users/followers-following/');
  },

  // Get user profile
  getProfile: async (userId) => {
    return api.get(`/users/view-profile/${userId}/`);
  },

  // Get own profile
  getOwnProfile: async () => {
    return api.get('/users/view-profile/me/');
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
  }
};
