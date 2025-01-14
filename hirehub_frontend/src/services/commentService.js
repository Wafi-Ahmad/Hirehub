import api from './api';

export const commentService = {
  // Get comments for a post
  getComments: async (postId, cursor = null) => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    return api.get(`/comments/post/${postId}/?${params.toString()}`);
  },
  // Create a new comment
  createComment: async (postId, content) => {
    return api.post(`/comments/post/${postId}/`, {
      content: content.trim()
    });
  },

  // Update a comment or reply
  updateComment: async (commentId, content) => {
    return api.put(`/comments/${commentId}/`, {
      content: content.trim()
    });
  },

  // Delete a comment or reply
  deleteComment: async (commentId) => {
    console.log('Sending delete request for comment/reply:', commentId);
    return api.delete(`/comments/${commentId}/`);
  },

  // Get replies for a comment
  getReplies: async (commentId, cursor = null, limit = 10) => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit);
    return api.get(`/comments/${commentId}/replies/?${params.toString()}`);
  },

  // Create a reply to a comment
  createReply: async (commentId, content) => {
    return api.post(`/comments/${commentId}/replies/`, {
      content: content.trim()
    });
  },

  // Toggle like on a comment
  toggleLike: async (commentId) => {
    return api.post(`/comments/${commentId}/like/`);
  }
};