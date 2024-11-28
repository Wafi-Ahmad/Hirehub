import api from './api';

export const postService = {
  createPost: async (formData) => {
    try {
      const response = await api.post('/posts/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error in createPost:', error);
      throw error;
    }
  },

  getPosts: async (cursor = null, limit = 10) => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit);
    return api.get(`/posts/?${params.toString()}`);
  },

  deletePost: async (postId) => {
    return api.delete(`/posts/${postId}/`);
  },

  updatePost: async (postId, data) => {
    const formData = new FormData();
    formData.append('content', data.content);
    if (data.attachment) {
      formData.append('attachment', data.attachment);
    }
    return api.patch(`/posts/${postId}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};