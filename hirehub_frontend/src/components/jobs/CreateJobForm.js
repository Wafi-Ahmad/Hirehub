import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Divider,
  InputAdornment
} from '@mui/material';
import { EMPLOYMENT_TYPES, LOCATION_TYPES, EXPERIENCE_LEVELS } from '../../constants/jobConstants';
import { useJob } from '../../context/JobContext';
import { toast } from 'react-toastify';

const CreateJobForm = () => {
  const navigate = useNavigate();
  const { createJob } = useJob();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    required_skills: '',
    employment_type: '',
    salary_min: '',
    salary_max: '',
    location_type: '',
    location: '',
    experience_level: ''
  });

  const experienceLevels = [
    { value: 'ENTRY', label: 'Entry Level' },
    { value: 'MID', label: 'Mid Level' },
    { value: 'SENIOR', label: 'Senior Level' },
    { value: 'LEAD', label: 'Lead Level' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      // Validate salary range
      if (Number(formData.salary_max) < Number(formData.salary_min)) {
        toast.error('Maximum salary cannot be less than minimum salary');
        return;
      }

      // Process skills into array
      const processedData = {
        ...formData,
        required_skills: formData.required_skills.split(',').map(skill => skill.trim()),
        salary_min: Number(formData.salary_min),
        salary_max: Number(formData.salary_max)
      };

      await createJob(processedData);
      navigate('/jobs');
    } catch (error) {
      console.error('Error creating job:', error);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4, mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
          Post a New Job
        </Typography>
        <Divider sx={{ mb: 4 }} />

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                multiline
                rows={4}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Required Skills"
                name="required_skills"
                value={formData.required_skills}
                onChange={handleChange}
                required
                helperText="Enter skills separated by commas (e.g., React, Node.js, Python)"
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Employment Type</InputLabel>
                <Select
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleChange}
                  label="Employment Type"
                >
                  {EMPLOYMENT_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Location Type</InputLabel>
                <Select
                  name="location_type"
                  value={formData.location_type}
                  onChange={handleChange}
                  label="Location Type"
                >
                  {LOCATION_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Minimum Salary"
                name="salary_min"
                type="number"
                value={formData.salary_min}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Maximum Salary"
                name="salary_max"
                type="number"
                value={formData.salary_max}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Experience Level</InputLabel>
                <Select
                  value={formData.experience_level}
                  onChange={handleChange}
                  name="experience_level"
                  label="Experience Level"
                >
                  {experienceLevels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/jobs')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || isSubmitting}
                >
                  {loading ? 'Posting...' : 'Post Job'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default CreateJobForm; 