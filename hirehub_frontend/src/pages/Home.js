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
  const { fetchProfileData, profileData } = useProfile();
  const { user } = useAuth();

  useEffect(() => {
    const loadHomeData = async () => {
      console.log("Loading Home Data");
      if (user?.id) {
        try {
          // Ensure profile data is loaded
          if (!profileData) {
            console.log("Fetching profile data");
            await fetchProfileData();
          }
          console.log("Fetching Posts");
          await fetchPosts();
        } catch (error) {
          console.error('Error loading home data:', error);
        }
      }
    };

    loadHomeData();
  }, [user?.id, fetchProfileData, fetchPosts, profileData]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <ProfileSummary />
        </Grid>
        <Grid item xs={12} md={6}>
          <CreatePost />
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