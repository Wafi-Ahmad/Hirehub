import api from './api';

export const postService = {
  // Get paginated posts
  getPosts: async (cursor = null, limit = 10, userId = null, followed_only = false) => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    if (limit && limit !== 'null') params.append('limit', limit);
    params.append('followed_only', followed_only.toString());

    // If userId is provided, use the user-specific endpoint
    const endpoint = userId ? `/posts/user/${userId}/` : '/posts/';
    return api.get(`${endpoint}?${params.toString()}`);
  },

  // Create a new post
  createPost: async (postData) => {
    const formData = new FormData();
    formData.append('content', postData.content || '');
    
    if (postData.image) {
      formData.append('image', postData.image);
      console.log('Appending image to form data:', postData.image); // Debug log
    }
    if (postData.video) {
      formData.append('video', postData.video);
      console.log('Appending video to form data:', postData.video); // Debug log
    }
    
    const response = await api.post('/posts/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Create post response:', response.data); // Debug log
    return response;
  },

  // Edit an existing post
  editPost: async (postId, postData) => {
    const formData = new FormData();
    formData.append('content', postData.content || '');
    
    // Always send the media deletion state
    formData.append('remove_media', postData.isMediaDeleted ? 'true' : 'false');
    
    // Only append new media if we're not deleting and have new files
    if (!postData.isMediaDeleted) {
      if (postData.image) {
        console.log('Appending new image to form data:', postData.image);
        formData.append('image', postData.image);
      }
      if (postData.video) {
        console.log('Appending new video to form data:', postData.video);
        formData.append('video', postData.video);
      }
    }

    console.log('Editing post with data:', {
      content: postData.content || '',
      isMediaDeleted: postData.isMediaDeleted,
      hasImage: !!postData.image,
      hasVideo: !!postData.video,
      imageType: postData.image ? postData.image.type : null,
      imageSize: postData.image ? postData.image.size : null
    });

    // Log all form data entries for debugging
    console.log('Form data entries:');
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    const response = await api.patch(`/posts/${postId}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Edit post response:', response.data);

    // If media was deleted, ensure the response reflects this
    if (postData.isMediaDeleted && response.data) {
      response.data = {
        ...response.data,
        media_type: 'none',
        media_urls: {}
      };
    }

    return response;
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