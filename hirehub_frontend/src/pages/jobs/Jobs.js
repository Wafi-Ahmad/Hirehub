import React, { useState } from 'react';
import { 
  Container, 
  Grid, 
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  Button
} from '@mui/material';
import { EMPLOYMENT_TYPES, LOCATION_TYPES, EXPERIENCE_LEVELS } from '../../constants/jobConstants';
import JobList from '../../components/jobs/JobList';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { USER_TYPES } from '../../utils/permissions';
import PeopleIcon from '@mui/icons-material/People';

const Jobs = () => {
  const [filters, setFilters] = useState({
    title: '',
    location: '',
    employment_type: '',
    location_type: '',
    experience_level: '',
    skills: '',
    followed_only: false
  });

  const navigate = useNavigate();
  const { user } = useAuth();

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFollowedToggle = () => {
    setFilters(prev => ({
      ...prev,
      followed_only: !prev.followed_only
    }));
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Find Your Next Opportunity
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {user?.user_type === 'Normal' && (
              <Button
                variant={filters.followed_only ? "contained" : "outlined"}
                onClick={handleFollowedToggle}
                startIcon={<PeopleIcon />}
                color={filters.followed_only ? "primary" : "inherit"}
              >
                {filters.followed_only ? "Following" : "All Companies"}
              </Button>
            )}
            {user?.userType === USER_TYPES.COMPANY && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/jobs/create')}
              >
                Post a Job
              </Button>
            )}
          </Box>
        </Box>
        
        {/* Filters Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search by Title"
                name="title"
                value={filters.title}
                onChange={handleFilterChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Skills"
                name="skills"
                value={filters.skills}
                onChange={handleFilterChange}
                helperText="Separate skills with commas"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Employment Type</InputLabel>
                <Select
                  name="employment_type"
                  value={filters.employment_type}
                  onChange={handleFilterChange}
                  label="Employment Type"
                >
                  <MenuItem value="">All</MenuItem>
                  {EMPLOYMENT_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Location Type</InputLabel>
                <Select
                  name="location_type"
                  value={filters.location_type}
                  onChange={handleFilterChange}
                  label="Location Type"
                >
                  <MenuItem value="">All</MenuItem>
                  {LOCATION_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Experience Level</InputLabel>
                <Select
                  name="experience_level"
                  value={filters.experience_level}
                  onChange={handleFilterChange}
                  label="Experience Level"
                >
                  <MenuItem value="">All</MenuItem>
                  {EXPERIENCE_LEVELS.map(level => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Job Listings */}
        <JobList filters={filters} />
      </Box>
    </Container>
  );
};

export default Jobs; 