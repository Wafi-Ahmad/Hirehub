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
  Paper,
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DownloadDoneIcon from '@mui/icons-material/DownloadDone';
import { useProfile } from '../../context/ProfileContext';
import cvService from '../../services/cvService';

const REQUIRED_FIELDS = ['first_name', 'last_name'];
const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB

const EditProfileDialog = ({ open, onClose }) => {
  const { profileData, updateProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [parsingLoading, setParsingLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [cvFile, setCvFile] = useState(null);
  const [cvUploaded, setCvUploaded] = useState(false);
  const [formData, setFormData] = useState({
    // Common fields for both user types
    email: '',
    headline: '',
    bio: '',
    location: '',
    website: '',
    phone: '',
    linkedin_url: '',
    github_url: '',
    
    // Normal user specific fields
    first_name: '',
    last_name: '',
    date_of_birth: '',
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
    
    // Company specific fields
    company_name: '',
    industry: '',
    company_size: '',
    about_company: '',
    specializations: '',
    
    // Privacy settings
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
        // Convert skills array to string if it exists
        const formattedData = {
            ...profileData,
            skills: Array.isArray(profileData.skills) 
                ? profileData.skills.join(', ') 
                : profileData.skills || '',
        };

        // Set form data based on user type
        if (profileData.user_type === 'Company') {
            // Remove normal user specific fields
            delete formattedData.first_name;
            delete formattedData.last_name;
            delete formattedData.date_of_birth;
            delete formattedData.preferred_job_category;
            delete formattedData.preferred_job_type;
            delete formattedData.desired_salary_range;
            delete formattedData.preferred_location;
        } else {
            // Remove company specific fields
            delete formattedData.company_name;
            delete formattedData.industry;
            delete formattedData.company_size;
            delete formattedData.about_company;
            delete formattedData.specializations;
        }

        setFormData(formattedData);
        setPreviewProfile(profileData.profile_picture);
        setPreviewCover(profileData.cover_picture);
    }
  }, [profileData]);

  const validateForm = () => {
    const newErrors = {};
    
    // Check required fields based on user type
    if (profileData?.user_type === 'Company') {
      if (!formData.company_name?.trim()) {
        newErrors.company_name = 'Company name is required';
      }
    } else {
      if (!formData.first_name?.trim()) {
        newErrors.first_name = 'First name is required';
      }
      if (!formData.last_name?.trim()) {
        newErrors.last_name = 'Last name is required';
      }
    }

    // Validate URLs if provided
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

  // Handle CV file selection
  const handleCVFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Check file extension
      const fileExt = file.name.split('.').pop().toLowerCase();
      if (!['pdf', 'doc', 'docx'].includes(fileExt)) {
        setSnackbar({
          open: true,
          message: 'Only PDF, DOC, and DOCX files are allowed',
          severity: 'error'
        });
        event.target.value = '';
        return;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: 'CV file must be less than 5MB',
          severity: 'error'
        });
        event.target.value = '';
        return;
      }
      
      setCvFile(file);
      setCvUploaded(false);
      
      setSnackbar({
        open: true,
        message: 'CV file selected. Click "Upload CV" to upload.',
        severity: 'info'
      });
    }
  };
  
  // Upload CV without parsing
  const handleCVUpload = async () => {
    if (!cvFile) {
      setSnackbar({
        open: true,
        message: 'Please select a CV file first',
        severity: 'error'
      });
      return;
    }
    
    setLoading(true);
    try {
      const result = await cvService.uploadCV(cvFile);
      setCvUploaded(true);
      
      setSnackbar({
        open: true,
        message: 'CV uploaded successfully. You can now parse it.',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to upload CV: ${error.response?.data?.error || error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Parse CV and update profile
  const handleCVParse = async () => {
    setParsingLoading(true);
    try {
      const result = await cvService.parseAndUpdateProfile();
      
      // Update form with parsed data
      if (result.parsed_data) {
        // --- Updated Destructuring and Mapping --- 
        const { 
            candidate_name, 
            location, 
            linkedin_url, // Use the direct field from LLM output
            summary, // Use the direct field for bio
            skills, // Already direct
            education, // Already direct
            experience, // Already direct
            certifications, // Already direct
            phone_number, // Added for phone mapping
        } = result.parsed_data;
        
        const updatedData = { ...formData };
        
        // Update personal info
        if (candidate_name) {
          // Corrected split logic: Split by space without limit
          const nameParts = candidate_name.trim().split(' '); 
          if (nameParts.length > 0 && !updatedData.first_name) {
              updatedData.first_name = nameParts[0]; // Assign first part to first name
          }
          if (nameParts.length > 1 && !updatedData.last_name) {
              // Assign the rest of the parts to last name
              updatedData.last_name = nameParts.slice(1).join(' '); 
          }
        }
        
        if (location && !updatedData.location) updatedData.location = location;
        if (linkedin_url && !updatedData.linkedin_url) updatedData.linkedin_url = linkedin_url;
        if (summary && !updatedData.bio) updatedData.bio = summary; // Map summary to bio
        
        // --- Add phone number mapping --- 
        if (phone_number && !updatedData.phone) updatedData.phone = phone_number;
        // ---------------------------------
        
        // Update skills (convert array to comma-separated string)
        if (skills && Array.isArray(skills) && skills.length > 0 && !updatedData.skills) {
          updatedData.skills = skills.join(', ');
        }
        
        // Update education - simple conversion for now (only if field is empty)
        if (education && Array.isArray(education) && education.length > 0 && !updatedData.education) {
          const eduText = education.map(edu => {
            const parts = [];
            if (edu.degree) parts.push(edu.degree);
            if (edu.field_of_study) parts.push(`in ${edu.field_of_study}`);
            if (edu.institution) parts.push(`at ${edu.institution}`);
            if (edu.dates) parts.push(`(${edu.dates})`);
            return parts.join(' ');
          }).join('\n\n');
          
          updatedData.education = eduText;
        }
        
        // Update experience (only if field is empty)
        if (experience && Array.isArray(experience) && experience.length > 0 && !updatedData.experience) {
          const expText = experience.map(exp => {
            const parts = [];
            if (exp.position) parts.push(exp.position);
            if (exp.company) parts.push(`at ${exp.company}`);
            if (exp.dates) parts.push(`(${exp.dates})`);
            if (exp.description) parts.push(`\n${exp.description}`);
            return parts.join(' ');
          }).join('\n\n');
          
          updatedData.experience = expText;
        }
        
        // Update certifications (only if field is empty)
        if (certifications && Array.isArray(certifications) && certifications.length > 0 && !updatedData.certifications) {
          updatedData.certifications = certifications.join('\n');
        }
        // -------------------------------------------

        setFormData(updatedData);
      }
      
      setSnackbar({
        open: true,
        message: 'CV parsed and profile updated successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error parsing CV:', error);
      
      // Extract the most useful error message
      let errorMessage = 'Failed to parse CV';
      
      if (error.response) {
        // The request was made and the server responded with an error status
        if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data && typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else {
          errorMessage = `Server error: ${error.response.status}`;
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something happened in setting up the request
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      setSnackbar({
        open: true,
        message: `Failed to parse CV: ${errorMessage}`,
        severity: 'error'
      });
    } finally {
      setParsingLoading(false);
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
      
      // Append text fields based on user type
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          // Skip normal user fields for company users
          if (profileData?.user_type === 'Company' && 
              ['first_name', 'last_name', 'date_of_birth'].includes(key)) {
            return;
          }
          // Skip company fields for normal users
          if (profileData?.user_type === 'Normal' && 
              ['company_name', 'industry', 'company_size', 'about_company', 'specializations'].includes(key)) {
            return;
          }

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

  const renderCompanyFields = () => {
    if (profileData?.user_type !== 'Company') return null;

    return (
      <>
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 2 }}>Company Information</Typography>
          <Divider sx={{ my: 1 }} />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Company Name"
            name="company_name"
            value={formData.company_name}
            onChange={handleInputChange}
            required
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Industry"
            name="industry"
            value={formData.industry}
            onChange={handleInputChange}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Company Size"
            name="company_size"
            value={formData.company_size}
            onChange={handleInputChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="About Company"
            name="about_company"
            multiline
            rows={3}
            value={formData.about_company}
            onChange={handleInputChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Specializations"
            name="specializations"
            multiline
            rows={3}
            value={formData.specializations}
            onChange={handleInputChange}
          />
        </Grid>
      </>
    );
  };

  const renderNormalUserFields = () => {
    if (profileData?.user_type !== 'Normal') return null;

    return (
      <>
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 2 }}>Personal Information</Typography>
          <Divider sx={{ my: 1 }} />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            required
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            required
          />
        </Grid>
        
        {/* CV Upload and Parse Section */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2, mt: 2, mb: 2, backgroundColor: '#f8f9fa' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              CV Upload & Automated Profile Filling
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload your CV to automatically fill your profile information including skills, experience, and education.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadFileIcon />}
                sx={{ mr: 1 }}
              >
                Select CV File
                <input
                  hidden
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleCVFileChange}
                />
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleCVUpload}
                disabled={!cvFile || loading}
                startIcon={loading ? <CircularProgress size={20} /> : <DownloadDoneIcon />}
              >
                Upload CV
              </Button>
              
              <Button
                variant="contained"
                color="secondary"
                onClick={handleCVParse}
                disabled={!cvUploaded || parsingLoading}
                startIcon={parsingLoading ? <CircularProgress size={20} /> : <AutoFixHighIcon />}
              >
                Start Parsing
              </Button>
            </Box>
            {cvFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected file: {cvFile.name}
              </Typography>
            )}
          </Paper>
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
      </>
    );
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
            Edit {profileData?.user_type === 'Company' ? 'Company' : 'Profile'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            * Required fields
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {/* Profile Pictures Section */}
            <Grid container spacing={2}>
              {/* Cover Picture */}
              <Grid item xs={12}>
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
              </Grid>

              {/* Profile Picture */}
              <Grid item xs={12}>
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
              </Grid>

              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6">Basic Information</Typography>
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

              {/* Render fields based on user type */}
              {renderCompanyFields()}
              {renderNormalUserFields()}

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
