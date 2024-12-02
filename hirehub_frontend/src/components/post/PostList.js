import React, { useEffect, useRef } from 'react';
import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { usePost } from '../../context/PostContext';
import Post from './Post';

const PostList = ({ userId = null }) => {
  const { posts, loading, error, hasMore, cursor, fetchPosts, clearPosts } = usePost();
  const navigate = useNavigate();
  const prevUserIdRef = useRef(userId);

  useEffect(() => {
    const loadPosts = async () => {
      // Clear posts if userId has changed
      if (prevUserIdRef.current !== userId) {
        await clearPosts();
        prevUserIdRef.current = userId;
      }
      
      // Fetch new posts
      await fetchPosts(null, userId);
    };

    loadPosts();

    // Cleanup function
    return () => {
      // Only clear if we're actually changing users
      if (prevUserIdRef.current !== userId) {
        clearPosts();
      }
    };
  }, [userId, fetchPosts, clearPosts]);

  const loadMorePosts = () => {
    if (cursor) {
      fetchPosts(cursor, userId);
    }
  };

  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  // Show loading state only when initially loading with no posts
  if (loading && !posts?.length) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography color="error">
          Error loading posts. Please try again later.
        </Typography>
      </Paper>
    );
  }

  // Show no posts message
  if (!loading && (!posts || posts.length === 0)) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography>{userId ? 'No posts yet from this user.' : 'No posts yet. Be the first to share something!'}</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {posts.map((post) => (
        <Box key={post.id} sx={{ mb: 2 }}>
          <Post post={post} />
        </Box>
      ))}
      
      {hasMore && (
        <Box display="flex" justifyContent="center" p={2}>
          <Button 
            onClick={loadMorePosts} 
            disabled={loading}
            variant="outlined"
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default PostList;