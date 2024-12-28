import api from './api';

export const postService = {
  // Get all posts with pagination
  getPosts: async (cursor = null, limit = 10) => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit);
    return api.get(`/api/posts/?${params.toString()}`);
  },

  // Create a new post
  createPost: async (content, image = null, video = null) => {
    const formData = new FormData();
    formData.append('content', content);
    if (image) formData.append('image', image);
    if (video) formData.append('video', video);
    
    return api.post('/api/posts/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Toggle like on a post
  toggleLike: async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/like/`);
      return response.data;
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  },

  // Toggle like on a comment
  toggleCommentLike: async (commentId) => {
    try {
      const response = await api.post(`/comments/${commentId}/like/`);
      return response.data;
    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw error;
    }
  },

  // Get a single post
  getPost: async (postId) => {
    return api.get(`/api/posts/${postId}/`);
  },

  // Add delete method to postService
  async deletePost(postId) {
    return api.delete(`/api/posts/${postId}/`);
  }
};