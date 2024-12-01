import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Switch,
  FormGroup,
  FormControlLabel,
  Divider,
  IconButton,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useProfile } from '../../context/ProfileContext';
import { toast } from 'react-toastify';

const PrivacySettingsModal = ({ open, onClose }) => {
  const { profileData, updatePrivacy } = useProfile();
  const [settings, setSettings] = useState({
    is_profile_public: profileData?.is_profile_public || false,
    show_email: profileData?.show_email || false,
    show_skills: profileData?.show_skills || false,
    show_experience: profileData?.show_experience || false,
    show_recent_work: profileData?.show_recent_work || false,
    show_current_work: profileData?.show_current_work || false
  });
  const [loading, setLoading] = useState(false);

  const handleToggleAll = (checked) => {
    setSettings(prev => ({
      is_profile_public: checked,
      show_email: checked,
      show_skills: checked,
      show_experience: checked,
      show_recent_work: checked,
      show_current_work: checked
    }));
  };

  const handleChange = (name) => (event) => {
    setSettings(prev => ({
      ...prev,
      [name]: event.target.checked
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await updatePrivacy(settings);
      toast.success('Privacy settings updated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Privacy Settings</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Control what information is visible to other users
        </Alert>

        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={Object.values(settings).every(Boolean)}
                onChange={(e) => handleToggleAll(e.target.checked)}
                color="primary"
              />
            }
            label={<Typography fontWeight="bold">Show All Information</Typography>}
          />
          
          <Divider sx={{ my: 2 }} />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.is_profile_public}
                onChange={handleChange('is_profile_public')}
              />
            }
            label="Make Profile Public"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.show_email}
                onChange={handleChange('show_email')}
              />
            }
            label="Show Email Address"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.show_skills}
                onChange={handleChange('show_skills')}
              />
            }
            label="Show Skills"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.show_experience}
                onChange={handleChange('show_experience')}
              />
            }
            label="Show Experience"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.show_recent_work}
                onChange={handleChange('show_recent_work')}
              />
            }
            label="Show Recent Work"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.show_current_work}
                onChange={handleChange('show_current_work')}
              />
            }
            label="Show Current Work"
          />
        </FormGroup>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={loading}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrivacySettingsModal; 