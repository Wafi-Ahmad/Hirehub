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
  FormControlLabel,
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
import LockIcon from '@mui/icons-material/Lock';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import { usePost } from '../../context/PostContext';
import { userService } from '../../services/userService';
import { toast } from 'react-toastify';
import EditProfileDialog from '../../components/profile/EditProfileDialog';
import PostList from '../../components/post/PostList';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { FOLLOW_STATUS_UPDATE_EVENT } from '../../components/layout/NotificationMenu';
import FollowersFollowingDialog from '../../components/profile/FollowersFollowingDialog';

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
  const [followDialogOpen, setFollowDialogOpen] = useState(false);
  const [followDialogTab, setFollowDialogTab] = useState('followers');

  const isOwnProfile = !id || id === currentUser?.id?.toString();
  const isPrivateProfile = !isOwnProfile && profileData?.is_profile_public === false && !profileData?.is_following;

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
        if (id) {
          await fetchProfileData(id);
        } else if (currentUser) {
          await fetchProfileData();
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    loadProfile();
  }, [id, currentUser, fetchProfileData]);

  // Add polling for profile updates when viewing a private profile
  useEffect(() => {
    let intervalId;
    
    const pollFollowStatus = async () => {
      try {
        await fetchProfileData(id);
      } catch (error) {
        console.error('Error polling follow status:', error);
      }
    };

    // Only start polling if there's a pending follow request
    if (id && !isOwnProfile && profileData?.follow_status === 'PENDING') {
      intervalId = setInterval(pollFollowStatus, 10000); // Poll every 10 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [id, isOwnProfile, profileData?.follow_status, fetchProfileData]);

  // Listen for follow status updates
  useEffect(() => {
    const handleFollowStatusUpdate = async (event) => {
      const { userId, action } = event.detail;
      // If this is the profile being viewed
      if (userId === parseInt(id)) {
        await fetchProfileData(id);
      }
    };

    window.addEventListener(FOLLOW_STATUS_UPDATE_EVENT, handleFollowStatusUpdate);

    return () => {
      window.removeEventListener(FOLLOW_STATUS_UPDATE_EVENT, handleFollowStatusUpdate);
    };
  }, [id, fetchProfileData]);

  // Early loading state
  if (loading) {
    return (
      <Container maxWidth="lg">
        {renderSkeletons()}
      </Container>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  const isCompanyProfile = profileData?.user_type === 'Company';
  const displayName = isCompanyProfile 
    ? profileData?.company_name
    : `${profileData?.first_name || ''} ${profileData?.last_name || ''}`;
  const displaySubtitle = isCompanyProfile
    ? profileData?.industry || 'No industry information'
    : profileData?.current_work || 'No current work information';

  const handleFollow = async () => {
    try {
      // Use the id from URL params if profileData.id is not available
      const userId = id || profileData?.id;
      if (!userId) {
        toast.error('User ID not found');
        return;
      }

      const response = await userService.followUser(userId);
      const { is_following, followers_count, following_count, message, follow_status } = response.data;
      
      // Update profile data with follow status
      setProfileData(prev => ({
        ...prev,
        is_following,
        follow_status
      }));

      // Update follow counts if provided
      if (followers_count !== undefined && following_count !== undefined) {
        updateFollowData({ followers_count, following_count });
      }
      
      toast.success(message || 'Successfully followed user');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to follow user');
      console.error('Follow error:', error);
    }
  };

  const handleUnfollow = async () => {
    console.log('handleUnfollow called', { id, profileData });
    // Move isPendingRequest declaration outside try block
    const isPendingRequest = 
        !profileData?.is_profile_public && 
        profileData?.follow_status === 'PENDING';

    console.log('Unfollow conditions:', {
        isPrivateProfile: !profileData?.is_profile_public,
        followStatus: profileData?.follow_status,
        isPendingRequest
    });

    try {
        const userId = id || profileData?.id;
        if (!userId) {
            toast.error('User ID not found');
            return;
        }

        let response;
        if (isPendingRequest) {
            // Cancel the pending follow request
            console.log('Canceling pending follow request');
            response = await userService.cancelFollowRequest(userId);
        } else {
            // Regular unfollow for all other cases
            console.log('Regular unfollow');
            response = await userService.followUser(userId);
        }
        
        console.log('Unfollow response:', response.data);
        const { is_following, followers_count, following_count, message } = response.data;
        
        // Update profile data
        setProfileData(prev => ({
            ...prev,
            is_following,
            follow_status: null // Reset follow status
        }));

        // Update follow counts if they are provided
        if (followers_count !== undefined && following_count !== undefined) {
            updateFollowData({ followers_count, following_count });
        }
        
        const successMessage = isPendingRequest 
            ? 'Follow request cancelled successfully'
            : 'Successfully unfollowed user';
        toast.success(message || successMessage);
    } catch (error) {
        console.error('Unfollow error:', error);
        const errorMessage = error.response?.data?.error || 
                           (isPendingRequest 
                               ? 'Failed to cancel follow request'
                               : 'Failed to unfollow user');
        toast.error(errorMessage);
    }
  };

  const handleEditClick = () => {
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
  };

  const handleFollowersClick = () => {
    setFollowDialogTab('followers');
    setFollowDialogOpen(true);
  };

  const handleFollowingClick = () => {
    setFollowDialogTab('following');
    setFollowDialogOpen(true);
  };

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

  // Show private profile view if profile is private and user is not following
  if (profileData?.is_profile_public === false && !isOwnProfile && !profileData?.is_following) {
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
            borderRadius: 1,
            position: 'relative',
            mb: 8
          }}
        />

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
              >
                {profileData?.first_name?.charAt(0)}{profileData?.last_name?.charAt(0)}
              </Avatar>
            </Box>

            {/* Basic Info */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="h5" gutterBottom>
                {`${profileData?.first_name} ${profileData?.last_name}`}
              </Typography>

              {/* Lock Icon */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
                <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body1" color="text.secondary">
                  This account is private
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Follow this account to see their profile and posts
              </Typography>

              {/* Follow Button with States */}
              {profileData?.follow_status === 'PENDING' ? (
                <Button
                  variant="outlined"
                  startIcon={<HourglassEmptyIcon />}
                  sx={{ mt: 3 }}
                  onClick={handleUnfollow}
                >
                  Requested
                </Button>
              ) : profileData?.follow_status === 'REJECTED' ? (
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={handleFollow}
                  sx={{ mt: 3 }}
                >
                  Follow
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={handleFollow}
                  sx={{ mt: 3 }}
                >
                  Follow
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
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
          borderRadius: 1,
          position: 'relative',
          mb: 8
        }}
      >
        {isOwnProfile && (
          <Tooltip title="Edit Profile">
            <IconButton
              onClick={handleEditClick}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'background.paper',
                }
              }}
            >
              <EditIcon />
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
              {displayName}
            </Typography>
            
            {profileData?.headline && (
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {profileData.headline}
              </Typography>
            )}

            {/* Follow/Unfollow Button */}
            {!isOwnProfile && (
              <Box sx={{ mt: 2 }}>
                {profileData?.is_following ? (
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<PersonRemoveIcon />}
                    onClick={handleUnfollow}
                  >
                    Unfollow
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PersonAddIcon />}
                    onClick={handleFollow}
                  >
                    Follow
                  </Button>
                )}
              </Box>
            )}

            {profileData?.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                <LocationOnIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  {profileData.location}
                </Typography>
              </Box>
            )}
            {displaySubtitle && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {displaySubtitle}
              </Typography>
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
                <Box 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.8 }
                  }}
                  onClick={handleFollowersClick}
                >
                  <Typography variant="h6">{followData?.followers_count || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Followers</Typography>
                </Box>
              </Grid>
              <Grid item>
                <Box 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.8 }
                  }}
                  onClick={handleFollowingClick}
                >
                  <Typography variant="h6">{followData?.following_count || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Following</Typography>
                </Box>
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

      {/* Add the FollowersFollowingDialog */}
      <FollowersFollowingDialog
        open={followDialogOpen}
        onClose={() => setFollowDialogOpen(false)}
        userId={id || currentUser?.id}
        initialTab={followDialogTab}
      />
    </Container>
  );
};
export default Profile;
