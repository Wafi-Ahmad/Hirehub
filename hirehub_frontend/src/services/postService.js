import api from './api';

export const postService = {
  // Get paginated posts
  getPosts: async (cursor = null, limit = 10) => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit);
    return api.get(`/posts/?${params.toString()}`);
  },

  // Create a new post
  createPost: async (content, image = null, video = null) => {
    const formData = new FormData();
    formData.append('content', content);
    if (image) formData.append('image', image);
    if (video) formData.append('video', video);
    
    return api.post('/posts/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get a single post with full details
  getPost: async (postId) => {
    return api.get(`/posts/${postId}/`);
  },

  // Toggle like on a post
  toggleLike: async (postId) => {
    return api.post(`/posts/${postId}/like/`);
  },

  // Delete a post
  deletePost: async (postId) => {
    return api.delete(`/posts/${postId}/`);
  }
};