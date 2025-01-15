import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Box, CircularProgress } from '@mui/material';
import JobCard from '../components/job/JobCard';
import { getSavedJobs } from '../services/jobService';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import toast from 'react-hot-toast';

const SavedJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        const data = await getSavedJobs();
        setJobs(data.jobs || []);
      } catch (error) {
        toast.error('Failed to fetch saved jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedJobs();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Saved Jobs
      </Typography>
      
      {jobs.length === 0 ? (
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          minHeight="50vh"
          textAlign="center"
          gap={2}
        >
          <BookmarkBorderIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
          <Typography variant="h6" color="text.secondary">
            No Saved Jobs Yet!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Jobs you save will appear here
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {jobs.map((job) => (
            <Grid item xs={12} sm={6} md={4} key={job.id}>
              <JobCard job={job} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default SavedJobs; 