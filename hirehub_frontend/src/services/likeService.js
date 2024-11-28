import api from './api';

export const likeService = {
  // Like/unlike a post
  togglePostLike: async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/like/`);
      return response.data;
    } catch (error) {
      console.error('Error toggling post like:', error);
      throw error;
    }
  },

  // Like/unlike a comment
  toggleCommentLike: async (commentId) => {
    try {
      const response = await api.post(`/comments/${commentId}/like/`);
      return response.data;
    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw error;
    }
  },
}; 