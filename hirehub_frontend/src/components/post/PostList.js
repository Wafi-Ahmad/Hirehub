import React, { useState, useCallback, useEffect } from 'react';
import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import { postService } from '../../services/postService';
import { toast } from 'react-toastify';
import Post from './Post';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch posts with cursor-based pagination
  const fetchPosts = useCallback(async (nextCursor = null) => {
    try {
      const response = await postService.getPosts(nextCursor);
      const { posts: newPosts, next_cursor } = response.data;
      
      setPosts(prev => nextCursor ? [...prev, ...newPosts] : newPosts);
      setCursor(next_cursor);
      setHasMore(!!next_cursor);
    } catch (error) {
      toast.error('Failed to fetch posts');
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Load more posts
  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchPosts(cursor);
  };

  // Handle post updates (likes, comments, etc.)
  const handlePostUpdate = (postId, updates) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId ? { ...post, ...updates } : post
      )
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (posts.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No posts yet. Be the first to share something!
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      {posts.map((post) => (
        <Post key={post.id} post={post} onPostUpdate={handlePostUpdate} />
      ))}
      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            onClick={loadMorePosts}
            disabled={loadingMore}
            variant="outlined"
          >
            {loadingMore ? <CircularProgress size={24} /> : 'Load More'}
          </Button>
        </Box>
      )}
    </>
  );
};

export default PostList; 