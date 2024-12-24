import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Box,
  Divider,
  IconButton,
  Tooltip,
  Skeleton
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Work as WorkIcon,
  BusinessCenter as BusinessIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useJob } from '../../context/JobContext';
import { useAuth } from '../../context/AuthContext';
import { USER_TYPES } from '../../utils/permissions';
import { EMPLOYMENT_TYPES, LOCATION_TYPES, EXPERIENCE_LEVELS } from '../../constants/jobConstants';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedJob, getJobById, saveJob, loading, error } = useJob();
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      getJobById(id);
    }
  }, [id, getJobById]);

  const handleSave = async () => {
    try {
      await saveJob(id);
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const getTypeLabel = (value, types) => {
    const type = types.find(t => t.value === value);
    return type ? type.label : value;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 12, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
            <Skeleton variant="text" width="60%" height={60} />
          </Box>
          <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={4}>
              <Skeleton variant="text" height={24} />
            </Grid>
            <Grid item xs={4}>
              <Skeleton variant="text" height={24} />
            </Grid>
            <Grid item xs={4}>
              <Skeleton variant="text" height={24} />
            </Grid>
          </Grid>
          <Skeleton variant="rectangular" height={200} />
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 12, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography color="error" variant="h6">
            {error}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/jobs')}
            sx={{ mt: 2 }}
          >
            Back to Jobs
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!selectedJob) return null;

  return (
    <Container maxWidth="lg" sx={{ mt: 12, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/jobs')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ flex: 1 }}>
            {selectedJob.title}
          </Typography>
          {user?.userType !== USER_TYPES.COMPANY && (
            <Tooltip title={selectedJob.is_saved ? "Remove from saved" : "Save job"}>
              <IconButton onClick={handleSave}>
                {selectedJob.is_saved ? <BookmarkIcon color="primary" /> : <BookmarkBorderIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Company Info */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" color="primary" gutterBottom>
            {selectedJob.company_name}
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon color="action" />
                <Typography>
                  {selectedJob.location} ({getTypeLabel(selectedJob.location_type, LOCATION_TYPES)})
                </Typography>
              </Box>
            </Grid>
            <Grid item>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WorkIcon color="action" />
                <Typography>
                  {getTypeLabel(selectedJob.employment_type, EMPLOYMENT_TYPES)}
                </Typography>
              </Box>
            </Grid>
            <Grid item>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon color="action" />
                <Typography>
                  {getTypeLabel(selectedJob.experience_level, EXPERIENCE_LEVELS)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Salary Range */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Salary Range
          </Typography>
          <Typography variant="h5" color="primary">
            ${selectedJob.salary_min.toLocaleString()} - ${selectedJob.salary_max.toLocaleString()} / year
          </Typography>
        </Box>

        {/* Required Skills */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Required Skills
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedJob.required_skills.map((skill, index) => (
              <Chip 
                key={index} 
                label={skill}
                variant="outlined"
                sx={{ 
                  borderRadius: '16px',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Job Description */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Job Description
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              whiteSpace: 'pre-line',
              color: 'text.secondary',
              lineHeight: 1.8
            }}
          >
            {selectedJob.description}
          </Typography>
        </Box>

        {/* Apply Section */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="textSecondary">
              Posted on {new Date(selectedJob.created_at).toLocaleDateString()}
            </Typography>
            {selectedJob.days_until_expiry > 0 && (
              <Typography variant="body2" color="warning.main">
                {selectedJob.days_until_expiry} days left to apply
              </Typography>
            )}
          </Box>
          {user?.userType !== USER_TYPES.COMPANY && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleSave}
              >
                {selectedJob.is_saved ? 'Saved' : 'Save Job'}
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => {/* Handle apply action */}}
              >
                Apply Now
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default JobDetails;
