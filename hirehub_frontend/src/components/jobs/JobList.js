import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { jobService } from '../../services/jobService';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { USER_TYPES } from '../../utils/permissions';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import { EMPLOYMENT_TYPES, LOCATION_TYPES, EXPERIENCE_LEVELS } from '../../constants/jobConstants';

const JobList = ({ filters }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const loadJobs = useCallback(async (cursor = null) => {
    try {
      setError(null);
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setJobs([]);
      }

      // Clean and format filters
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (key === 'skills' && value) {
          // Convert comma-separated string to array and clean it
          const skillsArray = value
            .split(',')
            .map(skill => skill.trim())
            .filter(skill => skill.length > 0);
          
          if (skillsArray.length > 0) {
            // Send as array instead of joined string
            acc[key] = skillsArray;
          }
        } else if (value && typeof value === 'string') {
          acc[key] = value.trim();
        } else if (value) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await jobService.getJobs({
        ...cleanFilters,
        cursor
      });

      setJobs(prev => cursor ? [...prev, ...response.data.jobs] : response.data.jobs);
      setNextCursor(response.data.next_cursor);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load jobs');
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleSaveJob = async (jobId, event) => {
    event.stopPropagation();
    try {
      await jobService.saveJob(jobId);
      // Refresh the current jobs to update the saved status
      loadJobs();
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const handleJobClick = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const getTypeLabel = (value, types) => {
    const type = types.find(t => t.value === value);
    return type ? type.label : value;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <LoadingSpinner />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        {jobs.map((job) => (
          <Grid item xs={12} md={6} lg={4} key={job.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 6
                }
              }}
              onClick={() => handleJobClick(job.id)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" gutterBottom>
                    {job.title}
                  </Typography>
                  {user && user.userType !== USER_TYPES.COMPANY && (
                    <Tooltip title={job.is_saved ? "Remove from saved" : "Save job"}>
                      <IconButton 
                        onClick={(e) => handleSaveJob(job.id, e)}
                        size="small"
                      >
                        {job.is_saved ? <BookmarkIcon color="primary" /> : <BookmarkBorderIcon />}
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

                <Typography color="textSecondary" gutterBottom>
                  {job.company_name}
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {job.location} ({getTypeLabel(job.location_type, LOCATION_TYPES)})
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <WorkIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {getTypeLabel(job.employment_type, EMPLOYMENT_TYPES)}
                  </Typography>
                </Stack>

                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={getTypeLabel(job.experience_level, EXPERIENCE_LEVELS)}
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                  {job.required_skills.slice(0, 3).map((skill, index) => (
                    <Chip
                      key={index}
                      label={skill}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                  {job.required_skills.length > 3 && (
                    <Chip
                      label={`+${job.required_skills.length - 3} more`}
                      size="small"
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {job.description.substring(0, 150)}...
                </Typography>

                {job.salary_min && job.salary_max && (
                  <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                    Salary: ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
                  </Typography>
                )}

                <Typography variant="caption" color="text.secondary">
                  Posted {new Date(job.created_at).toLocaleDateString()}
                  {job.days_until_expiry > 0 && ` • ${job.days_until_expiry} days left`}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {jobs.length === 0 && !loading && (
        <Alert severity="info">
          No jobs found matching your criteria. Try adjusting your filters.
        </Alert>
      )}

      {nextCursor && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={() => loadJobs(nextCursor)}
            disabled={loadingMore}
            startIcon={loadingMore ? <CircularProgress size={20} /> : null}
          >
            {loadingMore ? 'Loading...' : 'Load More Jobs'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default JobList;