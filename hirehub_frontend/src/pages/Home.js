import React, { useEffect, useState, useCallback } from 'react';
import { Container, Grid, Box, Typography, Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
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
import { jobService } from '../services/jobService';

const Home = () => {
  const { fetchPosts, followedOnly, toggleFollowedOnly } = usePost();
  const { fetchProfileData, profileData } = useProfile();
  const { jobs, getJobs } = useJob();
  const { user } = useAuth();
  const navigate = useNavigate();
  // Create a local state for recommended jobs
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Create a separate function to fetch recommended jobs
  const fetchRecommendedJobs = useCallback(() => {
    if (!user || user.user_type !== 'Normal' || !jobs?.length) return;
    
    console.log('Processing recommended jobs from context...');
    // Use the jobs from the JobContext, which will have been properly processed
    // This ensures consistency with the job listing page
    const recommendedJobsList = jobs.filter(job => job.is_recommended).slice(0, 3);
    console.log('Filtered recommended jobs from context:', recommendedJobsList);
    setRecommendedJobs(recommendedJobsList);
  }, [user, jobs]);

  // Load home data
  useEffect(() => {
    const loadHomeData = async () => {
      if (!user?.id) return;
      setLoadingJobs(true);

      try {
        if (!profileData) {
          await fetchProfileData();
        }
        await fetchPosts();
        
        // Fetch jobs for recommendations
        await getJobs({ 
          limit: 10,
          recommended: true
        });
      } catch (error) {
        console.error('Error loading home data:', error);
      } finally {
        setLoadingJobs(false);
      }
    };

    loadHomeData();
  }, [user, fetchProfileData, fetchPosts, profileData, getJobs]);

  // Update recommended jobs when jobs state changes
  useEffect(() => {
    if (jobs?.length > 0) {
      fetchRecommendedJobs();
    }
  }, [jobs, fetchRecommendedJobs]);

  if (!user) return null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Left Column - Profile Summary */}
        <Grid item xs={12} md={3}>
          <ProfileSummary />
          {/* Job Actions for Companies */}
          {user?.user_type === 'Company' && (
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
          <Box sx={{ mb: 2 }}>
            <ToggleButtonGroup
              value={followedOnly}
              exclusive
              onChange={toggleFollowedOnly}
              aria-label="post filter"
              fullWidth
            >
              <ToggleButton value={true} aria-label="followed posts">
                Following
              </ToggleButton>
              <ToggleButton value={false} aria-label="all posts">
                All Posts
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <CreatePost />
          <PostList />
        </Grid>

        {/* Right Column - Connections and Recent Jobs */}
        <Grid item xs={12} md={3}>
          <ConnectionSuggestions />
          
          {/* Recommended Jobs Section - Only show for Normal users */}
          {user?.user_type === 'Normal' && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Recommended Jobs</Typography>
                <Button
                  color="primary"
                  onClick={() => navigate('/jobs')}
                  sx={{ textTransform: 'none' }}
                >
                  VIEW ALL JOBS
                </Button>
              </Box>
              
              {loadingJobs ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  Loading recommended jobs...
                </Typography>
              ) : recommendedJobs.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No recommended jobs found.
                </Typography>
              ) : (
                recommendedJobs.map(job => (
                  <Box 
                    key={job.id}
                    sx={{ 
                      p: 2,
                      mb: 2,
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        borderColor: 'primary.main',
                      }
                    }}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <Typography variant="subtitle1" gutterBottom>
                      {job.title}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 1 }}>
                      <Typography variant="body2">
                        {job.location} ({job.location_type})
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                      {job.required_skills?.slice(0, 3).map((skill, index) => (
                        <Typography
                          key={index}
                          variant="body2"
                          sx={{
                            color: 'primary.main',
                            bgcolor: 'action.hover',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.75rem'
                          }}
                        >
                          {skill}
                        </Typography>
                      ))}
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary">
                      Posted {job.days_left} days left
                    </Typography>
                  </Box>
                ))
              )}
              
              {recommendedJobs.length > 3 && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  onClick={() => navigate('/jobs')}
                  sx={{ mb: 1 }}
                >
                  LOAD MORE
                </Button>
              )}
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;