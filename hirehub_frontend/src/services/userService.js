import api from './api';

export const userService = {
  // Follow a user
  followUser: async (userId) => {
    return api.post(`/users/follow/${userId}/`);
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
  }
};
