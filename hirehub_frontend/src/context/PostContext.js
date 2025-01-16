import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { postService } from '../services/postService';

const PostContext = createContext();

export const PostProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [followedOnly, setFollowedOnly] = useState(true);

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
      const response = await postService.getPosts(nextCursor, 10, userId, followedOnly);
      const { posts: newPosts, next_cursor } = response.data;
      
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
  }, [followedOnly]);

  const toggleFollowedOnly = useCallback(() => {
    setFollowedOnly(prev => !prev);
    clearPosts();
  }, [clearPosts]);

  const createPost = async (postData) => {
    try {
      setLoading(true);
      const response = await postService.createPost(postData);
      setPosts(prevPosts => [response.data, ...prevPosts]);
      toast.success('Post created successfully!');
      return response.data;
    } catch (err) {
      console.error('Error creating post:', err);
      toast.error(err.response?.data?.message || 'Failed to create post');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePost = useCallback(async (postId, updates) => {
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
  }, []);

  const deletePost = async (postId) => {
    try {
      await postService.deletePost(postId);
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      toast.success('Post deleted successfully');
    } catch (err) {
      console.error('Error deleting post:', err);
      toast.error('Failed to delete post');
      throw err;
    }
  };

  const removePost = (postId) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  return (
    <PostContext.Provider
      value={{
        posts,
        loading,
        error,
        hasMore,
        cursor,
        followedOnly,
        fetchPosts,
        clearPosts,
        createPost,
        updatePost,
        removePost,
        deletePost,
        toggleFollowedOnly
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

export default PostContext;