import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, CircularProgress, Typography, Button, Grid } from '@mui/material';
import { useJob } from '../../context/JobContext';
import { useAuth } from '../../context/AuthContext';
import JobCard from './JobCard';

const JobList = ({ filters }) => {
  const { jobs, loading, error, getJobs, nextCursor } = useJob();
  const { user } = useAuth();
  const [loadingMore, setLoadingMore] = useState(false);

  // Only sort jobs by recommendation and date
  const processedJobs = useMemo(() => {
    if (!jobs?.length) return [];
    
    console.log('Processing jobs:', jobs);
    console.log('User type:', user?.user_type);
    
    return [...jobs].sort((a, b) => {
      // Only consider recommendations for normal users
      if (user?.user_type === 'Normal') {
        if (a.is_recommended && !b.is_recommended) return -1;
        if (!a.is_recommended && b.is_recommended) return 1;
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [jobs, user]);

  const loadJobs = useCallback(async (cursor = null) => {
    try {
      const params = { ...filters };
      
      // Only add recommendation parameter for normal users
      if (user?.user_type === 'Normal') {
        params.recommended = true;
      }
      
      console.log('Loading jobs with params:', params);
      
      if (!cursor) {
        await getJobs(params);
      } else {
        setLoadingMore(true);
        await getJobs({ ...params, cursor });
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [filters, getJobs, user]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Debug output
  useEffect(() => {
    if (jobs?.length) {
      console.log('Current jobs:', jobs);
      console.log('Recommended jobs:', jobs.filter(job => job.is_recommended));
    }
  }, [jobs]);

  if (loading && !loadingMore) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!processedJobs?.length) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography>No jobs found matching your criteria.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Grid 
        container 
        spacing={3} 
        sx={{ 
          px: 2,
          '& .MuiGrid-item': {
            display: 'flex',
            justifyContent: 'center'
          }
        }}
      >
        {processedJobs.map(job => (
          <Grid item xs={12} md={6} lg={4} key={job.id}>
            <JobCard job={job} />
          </Grid>
        ))}
      </Grid>
      
      {nextCursor && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <Button
            variant="outlined"
            onClick={() => loadJobs(nextCursor)}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default JobList;