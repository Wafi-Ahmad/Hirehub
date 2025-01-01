import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Avatar,
  Grid,
  Paper,
  Chip,
  Stack,
  IconButton,
  Divider,
  Skeleton,
  Link,
  Alert,
  Tooltip,
  Switch,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import { usePost } from '../../context/PostContext';
import { userService } from '../../services/userService';
import { toast } from 'react-toastify';
import EditProfileDialog from '../../components/profile/EditProfileDialog';
import PostList from '../../components/post/PostList';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { 
    profileData, 
    loading, 
    error, 
    followData, 
    fetchProfileData, 
    setProfileData,
    updateFollowData 
  } = useProfile();
  const { clearPosts } = usePost();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handlePrivacyChange = async (setting, value) => {
    try {
      const response = await userService.updatePrivacySettings({
        [setting]: value
      });
      
      // Update local state
      setProfileData(prev => ({
        ...prev,
        [setting]: value
      }));
      
      toast.success('Privacy setting updated successfully');
    } catch (error) {
      console.error('Error updating privacy setting:', error);
      toast.error('Failed to update privacy setting');
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Clear posts first to avoid showing stale data
        clearPosts();
        
        // If no ID in URL or ID matches current user, load own profile
        if (!id) {
          await fetchProfileData();
          // Update URL to reflect user's own profile ID if not already there
          navigate(`/profile/me`, { replace: true });
        } else {
          await fetchProfileData(id);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    if (currentUser?.id) {
      // Force a complete reload of profile data when component mounts or ID changes
      loadProfile();
    }

    // Cleanup function to clear data when unmounting
    return () => {
      clearPosts();
    };
  }, [id, currentUser?.id, fetchProfileData, navigate, clearPosts]);

  const handleFollow = async () => {
    try {
      const response = await userService.followUser(profileData.id);
      const { is_following, followers_count, following_count } = response.data;
      
      // Update follow status in profile data
      setProfileData(prev => ({
        ...prev,
        is_following
      }));

      // Update follow counts
      updateFollowData({ followers_count, following_count });
      
      toast.success('Successfully followed user');
    } catch (error) {
      toast.error('Failed to follow user');
      console.error('Follow error:', error);
    }
  };

  const handleUnfollow = async () => {
    try {
      const response = await userService.followUser(profileData.id);
      const { is_following, followers_count, following_count } = response.data;
      
      // Update follow status in profile data
      setProfileData(prev => ({
        ...prev,
        is_following
      }));

      // Update follow counts
      updateFollowData({ followers_count, following_count });
      
      toast.success('Successfully unfollowed user');
    } catch (error) {
      toast.error('Failed to unfollow user');
      console.error('Unfollow error:', error);
    }
  };

  const handleEditClick = () => {
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
  };

  const isOwnProfile = !id || id === currentUser?.id?.toString();

  const renderSkeletons = () => (
    <>
      <Skeleton variant="rectangular" height={250} />
      <Box sx={{ mt: -5, display: 'flex', justifyContent: 'center' }}>
        <Skeleton variant="circular" width={120} height={120} />
      </Box>
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Skeleton variant="text" width={200} sx={{ mx: 'auto' }} />
        <Skeleton variant="text" width={150} sx={{ mx: 'auto' }} />
      </Box>
    </>
  );

  const renderContactInfo = () => {
    const hasContactInfo = profileData?.phone || profileData?.linkedin_url || profileData?.github_url || profileData?.website;
    
    if (!hasContactInfo) return null;

    return (
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Contact Information
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {profileData?.phone && profileData.show_phone && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon color="action" />
                <Typography>{profileData.phone}</Typography>
              </Box>
            </Grid>
          )}
          {profileData?.email && profileData.show_email && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon color="action" />
                <Typography>{profileData.email}</Typography>
              </Box>
            </Grid>
          )}
          {profileData?.linkedin_url && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinkedInIcon color="action" />
                <Link href={profileData.linkedin_url} target="_blank" rel="noopener">
                  LinkedIn Profile
                </Link>
              </Box>
            </Grid>
          )}
          {profileData?.github_url && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GitHubIcon color="action" />
                <Link href={profileData.github_url} target="_blank" rel="noopener">
                  GitHub Profile
                </Link>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>
    );
  };

  const renderWorkExperience = () => {
    const hasWorkInfo = profileData?.current_work || profileData?.recent_work || profileData?.experience;
    
    if (!hasWorkInfo) return null;

    return (
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Work Experience
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {profileData?.current_work && profileData.show_current_work && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              Current Position
            </Typography>
            <Typography>{profileData.current_work}</Typography>
          </Box>
        )}
        {profileData?.recent_work && profileData.show_recent_work && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              Recent Work
            </Typography>
            <Typography>{profileData.recent_work}</Typography>
          </Box>
        )}
        {profileData?.experience && profileData.show_experience && (
          <Box>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              Experience
            </Typography>
            <Typography style={{ whiteSpace: 'pre-line' }}>
              {profileData.experience}
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  const renderEducation = () => {
    if (!profileData?.education && !profileData?.certifications) return null;

    return (
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Education & Certifications
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {profileData?.education && profileData.show_education && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              Education
            </Typography>
            <Typography style={{ whiteSpace: 'pre-line' }}>
              {profileData.education}
            </Typography>
          </Box>
        )}
        {profileData?.certifications && profileData.show_certifications && (
          <Box>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              Certifications
            </Typography>
            <Typography style={{ whiteSpace: 'pre-line' }}>
              {profileData.certifications}
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  const renderCompanyProfile = () => {
    if (!profileData || profileData.user_type !== 'Company') return null;

    return (
      <>
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Company Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {profileData.industry && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Industry
              </Typography>
              <Typography>{profileData.industry}</Typography>
            </Box>
          )}

          {profileData.company_size && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Company Size
              </Typography>
              <Typography>{profileData.company_size}</Typography>
            </Box>
          )}

          {profileData.about_company && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                About Company
              </Typography>
              <Typography style={{ whiteSpace: 'pre-line' }}>
                {profileData.about_company}
              </Typography>
            </Box>
          )}

          {profileData.specializations && (
            <Box>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Specializations
              </Typography>
              <Typography style={{ whiteSpace: 'pre-line' }}>
                {profileData.specializations}
              </Typography>
            </Box>
          )}
        </Paper>
      </>
    );
  };

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (loading || !profileData) {
    return (
      <Container maxWidth="lg">
        {renderSkeletons()}
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Cover Photo */}
      <Box
        sx={{
          height: 250,
          bgcolor: 'grey.200',
          backgroundImage: profileData?.cover_picture ? `url(${profileData.cover_picture})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        {isOwnProfile ? (
          <IconButton
            onClick={handleEditClick}
            sx={{ position: 'absolute', right: 16, top: 16 }}
          >
            <EditIcon />
          </IconButton>
        ) : (
          <Tooltip title={profileData?.is_following ? "Unfollow" : "Follow"}>
            <IconButton
              onClick={profileData?.is_following ? handleUnfollow : handleFollow}
              color={profileData?.is_following ? "primary" : "default"}
              sx={{ position: 'absolute', right: 16, top: 16 }}
            >
              {profileData?.is_following ? <PersonRemoveIcon /> : <PersonAddIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Profile Info */}
      <Paper sx={{ mt: -5, mx: 'auto', maxWidth: 'md', position: 'relative' }}>
        <Box sx={{ p: 3 }}>
          {/* Profile Picture */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: -8 }}>
            <Avatar
              src={profileData?.profile_picture}
              sx={{
                width: 120,
                height: 120,
                border: '4px solid white',
                boxShadow: 1,
              }}
            />
          </Box>

          {/* Basic Info */}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="h5" gutterBottom>
              {profileData?.user_type === 'Company' 
                ? profileData.company_name
                : `${profileData?.first_name} ${profileData?.last_name}`}
            </Typography>
            
            {profileData?.headline && (
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {profileData.headline}
              </Typography>
            )}

            {profileData?.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                <LocationOnIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  {profileData.location}
                </Typography>
              </Box>
            )}

            {/* Bio */}
            {profileData?.bio && (
              <Typography 
                variant="body1" 
                sx={{ mt: 2, mx: 'auto', maxWidth: 600 }}
                style={{ whiteSpace: 'pre-line' }}
              >
                {profileData.bio}
              </Typography>
            )}

            {/* Skills/Specializations */}
            {Array.isArray(profileData?.skills) && profileData.skills.length > 0 && 
             profileData.show_skills && (
              <Stack 
                direction="row" 
                spacing={1} 
                sx={{ 
                  mt: 2, 
                  flexWrap: 'wrap', 
                  gap: 1,
                  justifyContent: 'center' 
                }}
              >
                {profileData.skills.map((skill, index) => (
                  <Chip 
                    key={index} 
                    label={skill}
                    sx={{
                      bgcolor: 'primary.light',
                      color: 'primary.contrastText',
                    }}
                  />
                ))}
              </Stack>
            )}

            {/* Follow Stats */}
            <Grid container spacing={4} sx={{ mt: 3, justifyContent: 'center' }}>
              <Grid item>
                <Typography variant="h6">{followData?.followers_count || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Followers</Typography>
              </Grid>
              <Grid item>
                <Typography variant="h6">{followData?.following_count || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Following</Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Paper>

      {/* Render company-specific profile if it's a company */}
      {renderCompanyProfile()}

      {/* Contact Information */}
      {renderContactInfo()}

      {/* Work Experience - only show for normal users */}
      {profileData?.user_type !== 'Company' && renderWorkExperience()}

      {/* Education & Certifications - only show for normal users */}
      {profileData?.user_type !== 'Company' && renderEducation()}

      {/* Posts */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Posts
        </Typography>
        <PostList 
          key={profileData?.id} 
          userId={profileData?.id} 
        />
      </Box>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
      />
    </Container>
  );
};

export default Profile;
