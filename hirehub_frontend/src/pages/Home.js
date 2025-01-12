import React, { useEffect } from 'react';
import { Container, Grid, Box, Typography, Button } from '@mui/material';
import CreatePost from '../components/post/CreatePost';
import PostList from '../components/post/PostList';
import ProfileSummary from '../components/profile/ProfileSummary';
import ConnectionSuggestions from '../components/profile/ConnectionSuggestions';
import { usePost } from '../context/PostContext';
import { useProfile } from '../context/ProfileContext';
import { useJob } from '../context/JobContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { USER_TYPES } from '../utils/permissions';

const Home = () => {
  const { fetchPosts } = usePost();
  const { fetchProfileData, profileData } = useProfile();
  const { jobs, getJobs } = useJob();
  const { user } = useAuth();
  const navigate = useNavigate();

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
          // Fetch recent jobs
          await getJobs({ limit: 3 });
        } catch (error) {
          console.error('Error loading home data:', error);
        }
      }
    };

    loadHomeData();
  }, [user?.id, fetchProfileData, fetchPosts, getJobs, profileData]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Left Column - Profile Summary */}
        <Grid item xs={12} md={3}>
          <ProfileSummary />
          {/* Job Actions for Companies */}
          {user?.userType === USER_TYPES.COMPANY && (
            <Box sx={{ mt: 2, p: 2, textAlign: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => navigate('/jobs/create')}
              >
                Post a Job
              </Button>
            </Box>
          )}
        </Grid>

        {/* Middle Column - Posts */}
        <Grid item xs={12} md={6}>
          <CreatePost />
          <PostList />
        </Grid>

        {/* Right Column - Connections and Recent Jobs */}
        <Grid item xs={12} md={3}>
          <ConnectionSuggestions />
          
          {/* Recent Jobs Section */}
          {jobs.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Job Postings
              </Typography>
              {jobs.map(job => (
                <Box 
                  key={job.id}
                  sx={{ 
                    p: 2,
                    mb: 1,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <Typography variant="subtitle1" gutterBottom>
                    {job.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {job.company_name}
                  </Typography>
                </Box>
              ))}
              <Button
                variant="text"
                color="primary"
                fullWidth
                onClick={() => navigate('/jobs')}
                sx={{ mt: 1 }}
              >
                View All Jobs
              </Button>
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;