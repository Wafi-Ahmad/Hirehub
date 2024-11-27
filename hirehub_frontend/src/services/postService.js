import api from './api';

export const postService = {
  createPost: async (data) => {
    const formData = new FormData();
    formData.append('content', data.content);
    if (data.attachment) {
      formData.append('attachment', data.attachment);
    }
    return api.post('/posts/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  likePost: async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/like/`);
      return response.data;
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  },

  createComment: async (postId, content) => {
    return api.post(`/comments/${postId}/comments/`, {
      content: content.trim()
    });
  },

  replyToComment: async (commentId, content) => {
    return api.post(`/comments/${commentId}/replies/`, {
      content: content.trim()
    });
  },

  deleteComment: async (commentId) => {
    return api.delete(`/comments/${commentId}/`);
  },

  likeComment: async (commentId) => {
    return api.post(`/comments/${commentId}/like/`);
  },

  getPosts: async (cursor = null, limit = 10) => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit);
    return api.get(`/posts/?${params.toString()}`);
  },

  getCommentReplies: async (commentId, cursor = null, limit = 10) => {
    try {
      const params = new URLSearchParams();
      if (cursor) {
        // Format the cursor timestamp to match backend expectation
        const cursorDate = new Date(cursor);
        params.append('cursor', cursorDate.toISOString());
      }
      params.append('limit', limit);
      
      const response = await api.get(`/comments/${commentId}/replies/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching replies:', error);
      throw error;
    }
  },
};