import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const PostContext = createContext();

export const PostProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(null);

  const fetchPosts = useCallback(async (nextCursor = null) => {
    try {
      setLoading(true);
      const response = await api.get('/posts/', {
        params: { cursor: nextCursor }
      });
      
      const { posts: newPosts, next_cursor } = response.data;
      
      setPosts(prev => nextCursor ? [...prev, ...newPosts] : newPosts);
      setCursor(next_cursor);
      setHasMore(!!next_cursor);
      setError(null);
    } catch (err) {
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

      // Add new post to the beginning of the posts array
      setPosts(prevPosts => [response.data, ...prevPosts]);
      toast.success('Post created successfully!');
      return response.data;
    } catch (err) {
      toast.error('Failed to create post');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePost = async (postId, updates) => {
    try {
      // For likes and comments, we just update the local state
      // without making a PUT request to the backend
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
      toast.success('Post deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete post');
      throw err;
    }
  };

  return (
    <PostContext.Provider
      value={{
        posts,
        loading,
        error,
        hasMore,
        cursor,
        fetchPosts,
        createPost,
        updatePost,
        deletePost
      }}
    >
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