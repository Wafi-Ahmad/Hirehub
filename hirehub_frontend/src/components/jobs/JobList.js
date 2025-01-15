import React, { useEffect, useState, useCallback } from 'react';
import { Box, CircularProgress, Typography, Button, Grid } from '@mui/material';
import { useJob } from '../../context/JobContext';
import JobCard from './JobCard';

const JobList = ({ filters }) => {
  const { jobs, loading, error, getJobs, nextCursor } = useJob();
  const [loadingMore, setLoadingMore] = useState(false);

  const loadJobs = useCallback(async (cursor = null) => {
    try {
      if (!cursor) {
        await getJobs({ ...filters });
      } else {
        setLoadingMore(true);
        await getJobs({ ...filters, cursor });
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [getJobs, filters]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

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

  if (!jobs?.length) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography>No jobs found matching your criteria.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={2}>
        {jobs.map(job => (
          <Grid item xs={12} md={6} lg={4} key={job.id}>
            <JobCard job={job} />
          </Grid>
        ))}
      </Grid>
      
      {nextCursor && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
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