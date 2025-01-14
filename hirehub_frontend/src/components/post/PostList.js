import React, { useEffect, useRef } from 'react';
import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePost } from '../../context/PostContext';
import Post from './Post';

const PostList = ({ userId = null }) => {
  const { 
    posts, 
    loading, 
    error, 
    hasMore, 
    cursor, 
    fetchPosts, 
    clearPosts,
    removePost 
  } = usePost();
  const navigate = useNavigate();
  const location = useLocation();
  const prevUserIdRef = useRef(userId);
  const postRefs = useRef({});

  useEffect(() => {
    const loadPosts = async () => {
      // Clear posts if userId has changed
      if (prevUserIdRef.current !== userId) {
        await clearPosts();
        prevUserIdRef.current = userId;
      }
      
      // Fetch new posts
      await fetchPosts(null, userId);

      // Handle scrolling to specific post if needed
      if (location.state?.scrollToPostId) {
        setTimeout(() => {
          const postElement = postRefs.current[location.state.scrollToPostId];
          if (postElement) {
            postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (location.state.highlightPost) {
              postElement.style.animation = 'highlight 2s';
            }
          }
        }, 500);
      }
    };

    loadPosts();

    // Cleanup function
    return () => {
      if (prevUserIdRef.current !== userId) {
        clearPosts();
      }
    };
  }, [userId, fetchPosts, clearPosts, location.state]);

  const loadMorePosts = () => {
    if (cursor) {
      fetchPosts(cursor, userId);
    }
  };

  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handlePostDelete = (postId) => {
    // Use removePost from context instead of local state
    removePost(postId);
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
        <Typography>
          {userId 
            ? 'No posts yet from this user.' 
            : 'No posts to show. Follow some users to see their posts here, or create your own post!'}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <style>
        {`
          @keyframes highlight {
            0% { background-color: rgba(25, 118, 210, 0.1); }
            100% { background-color: transparent; }
          }
        `}
      </style>
      {posts.map((post) => (
        <Box 
          key={post.id} 
          sx={{ mb: 2 }}
          ref={el => postRefs.current[post.id] = el}
        >
          <Post 
            post={post} 
            onDelete={handlePostDelete}
          />
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