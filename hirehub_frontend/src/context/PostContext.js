import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { profileService } from '../services/profileService';

const PostContext = createContext();

export const PostProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const clearPosts = useCallback(() => {
    setPosts([]);
    setCursor(null);
    setHasMore(true);
    setCurrentUserId(null);
    setError(null);
  }, []);

  const fetchPosts = useCallback(async (nextCursor = null, userId = null) => {
    try {
      setLoading(true);
      let responseData;
      
      if (userId) {
        // Fetch user-specific posts
        const response = await profileService.getUserPosts(userId, nextCursor);
        responseData = response;
      } else {
        // Fetch posts from followed users and own posts
        console.log('Fetching posts with params:', { cursor: nextCursor, followed_only: true });
        const response = await api.get('/posts/', {
          params: { 
            cursor: nextCursor,
            followed_only: true  // New parameter to indicate we want only followed users' posts
          }
        });
        console.log('API Response:', response.data);
        responseData = response.data;
      }
      
      const { posts: newPosts, next_cursor } = responseData;
      
      // Always set posts directly, don't append if it's the initial fetch
      if (!nextCursor) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
      
      setCursor(next_cursor);
      setHasMore(!!next_cursor);
      setError(null);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to fetch posts');
      toast.error('Error loading posts');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPost = async (postData) => {
    try {
      setLoading(true);
      const formData = new FormData();
      
      // Append text content
      formData.append('content', postData.content);
      
      // Append media files if they exist
      if (postData.image) {
        formData.append('image', postData.image);
      }
      if (postData.video) {
        formData.append('video', postData.video);
      }

      const response = await api.post('/posts/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setPosts(prevPosts => [response.data, ...prevPosts]);
      toast.success('Post created successfully!');
      return response.data;
    } catch (err) {
      console.error('Error creating post:', err);
      toast.error('Failed to create post');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePost = async (postId, updates) => {
    try {
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, ...updates } : post
        )
      );
      return true;
    } catch (err) {
      toast.error('Failed to update post');
      throw err;
    }
  };

  const deletePost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}/`);
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      toast.success('Post deleted successfully');
    } catch (err) {
      console.error('Error deleting post:', err);
      toast.error('Failed to delete post');
      throw err;
    }
  };

  return (
    <PostContext.Provider value={{
      posts,
      loading,
      error,
      hasMore,
      cursor,
      fetchPosts,
      createPost,
      updatePost,
      deletePost,
      clearPosts,
    }}>
      {children}
    </PostContext.Provider>
  );
};

export const usePost = () => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePost must be used within a PostProvider');
  }
  return context;
};

export default PostContext;