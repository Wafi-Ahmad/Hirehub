import api from './api';

export const commentService = {
  // Get comments for a post
  getComments: async (postId, cursor = null, limit = 10) => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit);
    return api.get(`/comments/${postId}/comments/?${params.toString()}`);
  },

  // Create a new comment
  createComment: async (postId, content) => {
    return api.post(`/comments/${postId}/comments/`, {
      content: content.trim()
    });
  },

  // Delete a comment
  deleteComment: async (commentId) => {
    return api.delete(`/comments/${commentId}/`);
  },

  // Get replies for a comment
  getReplies: async (commentId, cursor = null, limit = 10) => {
    const params = new URLSearchParams();
    if (cursor) {
      const cursorDate = new Date(cursor);
      params.append('cursor', cursorDate.toISOString());
    }
    params.append('limit', limit);
    return api.get(`/comments/${commentId}/replies/?${params.toString()}`);
  },

  // Create a reply to a comment
  createReply: async (commentId, content) => {
    return api.post(`/comments/${commentId}/replies/`, {
      content: content.trim()
    });
  },
}; 