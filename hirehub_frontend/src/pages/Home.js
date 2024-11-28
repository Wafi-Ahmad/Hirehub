import React from 'react';
import { Container, Grid } from '@mui/material';
import CreatePost from '../components/post/CreatePost';
import PostList from '../components/post/PostList';
import ProfileSummary from '../components/profile/ProfileSummary';
import ConnectionSuggestions from '../components/profile/ConnectionSuggestions';

const Home = () => {
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