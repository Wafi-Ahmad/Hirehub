import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useJob } from '../../context/JobContext';
import { useAuth } from '../../context/AuthContext';
import { EMPLOYMENT_TYPES, LOCATION_TYPES, EXPERIENCE_LEVELS } from '../../constants/jobConstants';

const PostJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createJob, updateJob, getJobById, deleteJob, selectedJob } = useJob();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    required_skills: '',
    employment_type: '',
    location_type: '',
    location: '',
    experience_level: '',
    salary_min: '',
    salary_max: ''
  });

  useEffect(() => {
    const fetchJob = async () => {
      if (id) {
        try {
          const jobData = await getJobById(id);
          setFormData({
            ...jobData,
            required_skills: Array.isArray(jobData.required_skills) 
              ? jobData.required_skills.join(', ')
              : jobData.required_skills
          });
        } catch (error) {
          console.error('Error fetching job:', error);
          navigate('/jobs');
        }
      }
    };

    fetchJob();
  }, [id, getJobById, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const jobData = {
        ...formData,
        required_skills: formData.required_skills.split(',').map(skill => skill.trim()),
        salary_min: parseFloat(formData.salary_min) || null,
        salary_max: parseFloat(formData.salary_max) || null
      };

      if (id) {
        await updateJob(id, jobData);
      } else {
        await createJob(jobData);
      }
      navigate('/jobs');
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteJob(id);
      setDeleteDialogOpen(false);
      navigate('/jobs');
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  if (!user || user.userType !== 'Company') {
    return (
      <Container>
        <Typography>You don't have permission to access this page.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {id ? 'Edit Job Posting' : 'Post a New Job'}
        </Typography>
        
        <Paper sx={{ p: 4, mt: 3 }}>
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
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Required Skills (comma-separated)"
                  name="required_skills"
                  value={formData.required_skills}
                  onChange={handleChange}
                  helperText="Enter skills separated by commas"
                  required
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
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Experience Level</InputLabel>
                  <Select
                    name="experience_level"
                    value={formData.experience_level}
                    onChange={handleChange}
                    label="Experience Level"
                  >
                    {EXPERIENCE_LEVELS.map(level => (
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
                  label="Minimum Salary"
                  name="salary_min"
                  type="number"
                  value={formData.salary_min}
                  onChange={handleChange}
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
                />
              </Grid>

              <Grid item xs={12} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/jobs')}
                  >
                    Cancel
                  </Button>
                  {id && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      Delete
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                  >
                    {id ? 'Update Job' : 'Post Job'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            Are you sure you want to delete this job posting? This action cannot be undone.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error">Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default PostJob; 