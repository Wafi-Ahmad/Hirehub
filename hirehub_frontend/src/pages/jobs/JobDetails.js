// React and Router imports
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Material-UI Components
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

// Material-UI Icons
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import QuizIcon from '@mui/icons-material/Quiz';

// Context and Constants
import { useJob } from '../../context/JobContext';
import { useAuth } from '../../context/AuthContext';
import { USER_TYPES } from '../../utils/permissions';
import { LOCATION_TYPES, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS } from '../../constants/jobConstants';
import ApplicantTable from '../../components/company/ApplicantTable';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedJob, getJobById, saveJob, loading, error } = useJob();
  const { user } = useAuth();
  const [showApplicants, setShowApplicants] = useState(false);

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

  const handleApply = () => {
    navigate(`/jobs/${id}/quiz`);
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
          {user?.user_type !== "Company" && (
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
                <LocationOnIcon color="action" />
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
                <BusinessCenterIcon color="action" />
                <Typography>
                  {getTypeLabel(selectedJob.experience_level, EXPERIENCE_LEVELS)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Job Description */}
        <Typography variant="h6" gutterBottom>
          Description
        </Typography>
        <Typography variant="body1" paragraph>
          {selectedJob.description}
        </Typography>

        {/* Required Skills */}
        <Typography variant="h6" gutterBottom>
          Required Skills
        </Typography>
        <Box sx={{ mb: 3 }}>
          {Array.isArray(selectedJob.required_skills) 
            ? selectedJob.required_skills.map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  sx={{ m: 0.5 }}
                  color="primary"
                  variant="outlined"
                />
              ))
            : typeof selectedJob.required_skills === 'string'
              ? selectedJob.required_skills.split(',').map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill.trim()}
                    sx={{ m: 0.5 }}
                    color="primary"
                    variant="outlined"
                  />
                ))
              : null
          }
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

          {user?.user_type === "Normal" && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleApply}
              >
                Take Quiz & Apply
              </Button>
            </Box>
          )}

          {user?.user_type === "Company" && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PeopleIcon />}
              onClick={() => setShowApplicants(!showApplicants)}
            >
              {showApplicants ? 'Hide Applicants' : 'View Applicants'}
            </Button>
          )}
        </Box>
      </Paper>

      {showApplicants && user?.user_type === "Company" && (
        <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Job Applicants
          </Typography>
          <ApplicantTable jobId={id} />
        </Paper>
      )}
    </Container>
  );
};

export default JobDetails;
