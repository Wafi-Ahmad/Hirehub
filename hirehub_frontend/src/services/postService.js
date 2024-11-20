import api from './api';

export const postService = {
  createPost: async (data) => {
    const formData = new FormData();
    formData.append('content', data.content);
    if (data.attachment) {
      formData.append('attachment', data.attachment);
    }
    return api.post('/posts/create/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  likePost: async (postId) => {
    return api.post(`/posts/${postId}/like/`);
  },

  createComment: async (postId, content, parentCommentId = null) => {
    const data = {
      content,
      parent_comment: parentCommentId,
    };
    return api.post(`/posts/${postId}/comments/`, data);
  },

  deleteComment: async (commentId) => {
    return api.delete(`/comments/${commentId}/delete/`);
  },

  likeComment: async (commentId) => {
    return api.post(`/comments/${commentId}/like/`);
  },
}; 