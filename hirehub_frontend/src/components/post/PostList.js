import React, { useEffect } from 'react';
import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import { usePost } from '../../context/PostContext';
import Post from './Post';

const PostList = () => {
  const { posts, loading, error, hasMore, cursor, fetchPosts } = usePost();

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const loadMorePosts = () => {
    if (!loading && hasMore) {
      fetchPosts(cursor);
    }
  };

  if (loading && posts.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">
          {error}
        </Typography>
      </Paper>
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
        <Post key={post.id} post={post} />
      ))}
      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            onClick={loadMorePosts}
            disabled={loading}
            variant="outlined"
          >
            {loading ? <CircularProgress size={24} /> : 'Load More'}
          </Button>
        </Box>
      )}
    </>
  );
};

export default PostList; 