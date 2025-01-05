import api from './api';

export const commentService = {
  // Get comments for a post
  getComments: async (postId, cursor = null) => {
    const params = cursor ? { cursor } : {};
    return api.get(`/posts/post/${postId}/`, { params });
  },
  
  // Create a comment
  createComment: async (postId, content) => {
    return api.post(`/posts/post/${postId}/`, { content });
  },

  // Delete a comment
  deleteComment: async (commentId) => {
    try {
      const response = await api.delete(`/posts/${commentId}/`);
      return response;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },

  // Get replies for a comment
  getReplies: async (commentId, cursor = null) => {
    const params = cursor ? { cursor } : {};
    return api.get(`/posts/${commentId}/replies/`, { params });
  },

  // Create a reply to a comment
  createReply: async (commentId, content) => {
    return api.post(`/posts/${commentId}/replies/`, { content });
  },

  // Toggle like on a comment or reply
  toggleLike: async (commentId) => {
    // The URL structure is /api/posts/<comment_id>/like/ from comment_urls.py
    // The /api prefix is already added by api.js
    return api.post(`/posts/${commentId}/like/`, {});
  }
};