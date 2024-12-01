import React, { useEffect } from 'react';
import { Container, Grid } from '@mui/material';
import CreatePost from '../components/post/CreatePost';
import PostList from '../components/post/PostList';
import ProfileSummary from '../components/profile/ProfileSummary';
import ConnectionSuggestions from '../components/profile/ConnectionSuggestions';
import { usePost } from '../context/PostContext';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { fetchPosts } = usePost();
  const { fetchProfileData } = useProfile();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchProfileData();
      fetchPosts();
    }
  }, [user?.id, fetchProfileData, fetchPosts]);

  const handlePostCreated = () => {
    // Refresh the posts list after creating a new post
    fetchPosts();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <ProfileSummary />
        </Grid>
        <Grid item xs={12} md={6}>
          <CreatePost onPostCreated={handlePostCreated} />
          <PostList />
        </Grid>
        <Grid item xs={12} md={3}>
          <ConnectionSuggestions />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;