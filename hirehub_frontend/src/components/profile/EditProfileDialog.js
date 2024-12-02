import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Avatar,
  IconButton,
  Typography,
  CircularProgress,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { useProfile } from '../../context/ProfileContext';

const REQUIRED_FIELDS = ['first_name', 'last_name'];
const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB

const EditProfileDialog = ({ open, onClose }) => {
  const { profileData, updateProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    location: '',
    website: '',
    headline: '',
    preferred_job_category: '',
    preferred_job_type: '',
    desired_salary_range: '',
    preferred_location: '',
    skills: '',
    experience: '',
    education: '',
    certifications: '',
    recent_work: '',
    current_work: '',
    phone: '',
    linkedin_url: '',
    github_url: '',
    is_profile_public: true,
    show_email: true,
    show_phone: false,
    show_skills: true,
    show_experience: true,
    show_education: true,
    show_certifications: true,
    show_recent_work: true,
    show_current_work: true,
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [coverPicture, setCoverPicture] = useState(null);
  const [previewProfile, setPreviewProfile] = useState(null);
  const [previewCover, setPreviewCover] = useState(null);

  useEffect(() => {
    if (profileData) {
      setFormData(prev => ({
        ...prev,
        ...profileData,
        skills: Array.isArray(profileData.skills) 
          ? profileData.skills.join(', ') 
          : profileData.skills || '',
      }));
      setPreviewProfile(profileData.profile_picture);
      setPreviewCover(profileData.cover_picture);
    }
  }, [profileData]);

  const validateForm = () => {
    const newErrors = {};
    
    // Check required fields
    REQUIRED_FIELDS.forEach(field => {
      if (!formData[field]?.trim()) {
        newErrors[field] = 'This field is required';
      }
    });

    // Validate URLs
    const urlFields = ['website', 'linkedin_url', 'github_url'];
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    
    urlFields.forEach(field => {
      if (formData[field] && !urlPattern.test(formData[field])) {
        newErrors[field] = 'Please enter a valid URL';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateFile = (file, type) => {
    if (file.size > FILE_SIZE_LIMIT) {
      setSnackbar({
        open: true,
        message: `${type} must be less than 5MB`,
        severity: 'error'
      });
      return false;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setSnackbar({
        open: true,
        message: `${type} must be JPEG, PNG, or JPG`,
        severity: 'error'
      });
      return false;
    }
    
    return true;
  };

  const handleFileChange = (event, type) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      if (!validateFile(file, type)) {
        event.target.value = '';
        return;
      }

      if (type === 'profile') {
        setProfilePicture(file);
        setPreviewProfile(URL.createObjectURL(file));
      } else {
        setCoverPicture(file);
        setPreviewCover(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please fix the errors before submitting',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      
      // Append text fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          if (key === 'skills') {
            const skillsArray = formData[key].split(',').map(s => s.trim()).filter(Boolean);
            form.append(key, JSON.stringify(skillsArray));
          } else {
            form.append(key, formData[key]);
          }
        }
      });

      // Only append files if they have been changed
      if (profilePicture) {
        form.append('profile_picture', profilePicture);
      }
      if (coverPicture) {
        form.append('cover_picture', coverPicture);
      }

      await updateProfile(form);
      setSnackbar({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success'
      });
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error updating profile',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle>
          <Typography variant="h5" component="div">
            Edit Profile
          </Typography>
          <Typography variant="body2" color="text.secondary">
            * Required fields
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {/* Cover Picture */}
            <Box sx={{ position: 'relative', mb: 4, height: 200, bgcolor: 'grey.100' }}>
              {previewCover && (
                <Box
                  component="img"
                  src={previewCover}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              )}
              <IconButton
                sx={{ 
                  position: 'absolute', 
                  bottom: 8, 
                  right: 8,
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'background.default' }
                }}
                component="label"
              >
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={(e) => handleFileChange(e, 'cover')}
                />
                <PhotoCamera />
              </IconButton>
            </Box>

            {/* Profile Picture */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                src={previewProfile}
                sx={{ width: 100, height: 100, mr: 2 }}
              />
              <IconButton 
                component="label"
                sx={{
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'background.default' }
                }}
              >
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={(e) => handleFileChange(e, 'profile')}
                />
                <PhotoCamera />
              </IconButton>
            </Box>

            <Grid container spacing={2}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6">Basic Information</Typography>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  required
                  fullWidth
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  error={!!errors.first_name}
                  helperText={errors.first_name}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  required
                  fullWidth
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  error={!!errors.last_name}
                  helperText={errors.last_name}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio"
                  name="bio"
                  multiline
                  rows={3}
                  value={formData.bio}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  error={!!errors.website}
                  helperText={errors.website}
                />
              </Grid>

              {/* Professional Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2 }}>Professional Information</Typography>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Headline"
                  name="headline"
                  value={formData.headline}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Preferred Job Category"
                  name="preferred_job_category"
                  value={formData.preferred_job_category}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Preferred Job Type"
                  name="preferred_job_type"
                  value={formData.preferred_job_type}
                  onChange={handleInputChange}
                />
              </Grid>

              {/* Skills and Experience */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2 }}>Skills and Experience</Typography>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Skills (comma-separated)"
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  helperText="Enter skills separated by commas"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Experience"
                  name="experience"
                  multiline
                  rows={3}
                  value={formData.experience}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Education"
                  name="education"
                  multiline
                  rows={3}
                  value={formData.education}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Certifications"
                  name="certifications"
                  multiline
                  rows={2}
                  value={formData.certifications}
                  onChange={handleInputChange}
                />
              </Grid>

              {/* Work Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2 }}>Work Information</Typography>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Work"
                  name="current_work"
                  multiline
                  rows={2}
                  value={formData.current_work}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Recent Work"
                  name="recent_work"
                  multiline
                  rows={2}
                  value={formData.recent_work}
                  onChange={handleInputChange}
                />
              </Grid>
              
              {/* Contact Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2 }}>Contact Information</Typography>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="LinkedIn URL"
                  name="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={handleInputChange}
                  error={!!errors.linkedin_url}
                  helperText={errors.linkedin_url}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="GitHub URL"
                  name="github_url"
                  value={formData.github_url}
                  onChange={handleInputChange}
                  error={!!errors.github_url}
                  helperText={errors.github_url}
                />
              </Grid>

              {/* Privacy Settings */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2 }}>Privacy Settings</Typography>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_profile_public}
                      onChange={handleInputChange}
                      name="is_profile_public"
                    />
                  }
                  label="Public Profile"
                />
              </Grid>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.show_email}
                      onChange={handleInputChange}
                      name="show_email"
                    />
                  }
                  label="Show Email"
                />
              </Grid>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.show_phone}
                      onChange={handleInputChange}
                      name="show_phone"
                    />
                  }
                  label="Show Phone"
                />
              </Grid>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.show_skills}
                      onChange={handleInputChange}
                      name="show_skills"
                    />
                  }
                  label="Show Skills"
                />
              </Grid>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.show_experience}
                      onChange={handleInputChange}
                      name="show_experience"
                    />
                  }
                  label="Show Experience"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EditProfileDialog;
