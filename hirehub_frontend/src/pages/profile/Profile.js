import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Tabs, 
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Button,
  Stack
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import { useConnection } from '../../context/ConnectionContext';
import { toast } from 'react-toastify';
import ImageUpload from '../../components/profile/ImageUpload';
import ProfileSectionEditor from '../../components/profile/ProfileSectionEditor';
import PrivacySettingsModal from '../../components/profile/PrivacySettingsModal';

const Profile = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const { profileData, loading, error, fetchProfileData, followData } = useProfile();
  const { user } = useAuth();
  const { id } = useParams();
  const { 
    sendConnectionRequest, 
    handleConnectionRequest,
    connections,
    loading: connectionLoading 
  } = useConnection();
  const [connectionStatus, setConnectionStatus] = useState('NOT_CONNECTED');
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [updateProfile, updatePrivacy] = useState(() => {
    console.warn('updateProfile/updatePrivacy not implemented');
  });

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData, id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleConnect = async () => {
    try {
      await sendConnectionRequest(id);
      setConnectionStatus('PENDING');
      toast.success('Connection request sent successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send connection request');
    }
  };

  const renderConnectionButton = () => {
    if (user?.id === parseInt(id)) return null;

    switch (connectionStatus) {
      case 'PENDING':
        return (
          <Button 
            variant="outlined" 
            disabled
            sx={{ position: 'absolute', right: 24, top: 24 }}
          >
            Request Pending
          </Button>
        );
      case 'CONNECTED':
        return (
          <Button 
            variant="contained" 
            color="success"
            sx={{ position: 'absolute', right: 24, top: 24 }}
          >
            Connected
          </Button>
        );
      default:
        return (
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleConnect}
            disabled={connectionLoading}
            sx={{ position: 'absolute', right: 24, top: 24 }}
          >
            Connect
          </Button>
        );
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={200} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" align="center">
          Error loading profile: {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Cover Photo and Basic Info */}
      <Paper sx={{ mb: 3, position: 'relative' }}>
        <Box sx={{ position: 'relative' }}>
          <Box
            component="img"
            src={profileData?.cover_photo || "https://picsum.photos/1200/300"}
            sx={{
              width: '100%',
              height: 300,
              objectFit: 'cover',
            }}
          />
          {user?.id === parseInt(id) && (
            <ImageUpload
              type="cover"
              currentImage={profileData?.cover_photo}
              onSave={async (blob) => {
                const formData = new FormData();
                formData.append('cover_photo', blob);
                await updateProfile(formData);
              }}
            />
          )}
        </Box>
        <Box sx={{ p: 3, position: 'relative' }}>
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              left: 24,
              backgroundColor: 'white',
              padding: 1,
              borderRadius: '50%'
            }}
          >
            <Box
              component="img"
              src={profileData?.profile_picture || "https://via.placeholder.com/150"}
              sx={{
                width: 150,
                height: 150,
                borderRadius: '50%',
                border: '4px solid white',
              }}
            />
            {user?.id === parseInt(id) && (
              <ImageUpload
                type="profile"
                currentImage={profileData?.profile_picture}
                onSave={async (blob) => {
                  const formData = new FormData();
                  formData.append('profile_picture', blob);
                  await updateProfile(formData);
                }}
              />
            )}
          </Box>
          <Box sx={{ ml: '200px' }}>
            <Typography variant="h4">
              {profileData?.first_name} {profileData?.last_name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {profileData?.current_work || 'No current position'}
            </Typography>
          </Box>
          <Stack 
            direction="row" 
            spacing={2} 
            sx={{ position: 'absolute', right: 24, top: 24 }}
          >
            {user?.id === parseInt(id) && (
              <Stack direction="row" spacing={2}>
                <Button variant="contained">
                  Edit Profile
                </Button>
                <Button 
                  variant="outlined"
                  onClick={() => setPrivacyModalOpen(true)}
                >
                  Privacy Settings
                </Button>
              </Stack>
            )}
          </Stack>
        </Box>
        
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ px: 3 }}
        >
          <Tab label="About" />
          <Tab label="Experience" />
          <Tab label="Skills" />
          <Tab label="Posts" />
          <Tab label="Followers" />
          <Tab label="Following" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mt: 3 }}>
        {tabValue === 0 && (
          <Box>
            <ProfileSectionEditor
              title="About"
              content={profileData?.bio}
              isEditable={user?.id === parseInt(id)}
              isVisible={profileData?.is_profile_public}
              onSave={async (content) => {
                await updateProfile({ bio: content });
              }}
              onToggleVisibility={() => 
                updatePrivacy({ is_profile_public: !profileData?.is_profile_public })
              }
              privacyKey="is_profile_public"
              multiline
            />
            
            <ProfileSectionEditor
              title="Skills"
              content={profileData?.skills}
              isEditable={user?.id === parseInt(id)}
              isVisible={profileData?.show_skills}
              onSave={async (content) => {
                await updateProfile({ skills: content });
              }}
              onToggleVisibility={() => 
                updatePrivacy({ show_skills: !profileData?.show_skills })
              }
              privacyKey="show_skills"
              multiline
            />

            <ProfileSectionEditor
              title="Experience"
              content={profileData?.experience}
              isEditable={user?.id === parseInt(id)}
              isVisible={profileData?.show_experience}
              onSave={async (content) => {
                await updateProfile({ experience: content });
              }}
              onToggleVisibility={() => 
                updatePrivacy({ show_experience: !profileData?.show_experience })
              }
              privacyKey="show_experience"
              multiline
            />

            <ProfileSectionEditor
              title="Current Work"
              content={profileData?.current_work}
              isEditable={user?.id === parseInt(id)}
              isVisible={profileData?.show_current_work}
              onSave={async (content) => {
                await updateProfile({ current_work: content });
              }}
              onToggleVisibility={() => 
                updatePrivacy({ show_current_work: !profileData?.show_current_work })
              }
              privacyKey="show_current_work"
            />

            <ProfileSectionEditor
              title="Recent Work"
              content={profileData?.recent_work}
              isEditable={user?.id === parseInt(id)}
              isVisible={profileData?.show_recent_work}
              onSave={async (content) => {
                await updateProfile({ recent_work: content });
              }}
              onToggleVisibility={() => 
                updatePrivacy({ show_recent_work: !profileData?.show_recent_work })
              }
              privacyKey="show_recent_work"
            />

            <ProfileSectionEditor
              title="Contact Information"
              content={profileData?.contact_details}
              isEditable={user?.id === parseInt(id)}
              isVisible={profileData?.show_email}
              onSave={async (content) => {
                await updateProfile({ contact_details: content });
              }}
              onToggleVisibility={() => 
                updatePrivacy({ show_email: !profileData?.show_email })
              }
              privacyKey="show_email"
            />
          </Box>
        )}

        {tabValue === 1 && (
          <ProfileSectionEditor
            title="Experience"
            content={profileData?.experience}
            isEditable={user?.id === parseInt(id)}
            isVisible={profileData?.show_experience}
            onSave={async (content) => {
              await updateProfile({ experience: content });
            }}
            onToggleVisibility={user?.id === parseInt(id) ? () => 
              updatePrivacy({ show_experience: !profileData?.show_experience }) 
              : undefined
            }
            multiline
          />
        )}

        {tabValue === 2 && (
          <ProfileSectionEditor
            title="Skills"
            content={profileData?.skills}
            isEditable={user?.id === parseInt(id)}
            isVisible={profileData?.show_skills}
            onSave={async (content) => {
              await updateProfile({ skills: content });
            }}
            onToggleVisibility={user?.id === parseInt(id) ? () => 
              updatePrivacy({ show_skills: !profileData?.show_skills }) 
              : undefined
            }
            multiline
          />
        )}

        {tabValue === 3 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Posts</Typography>
            <Typography>
              User posts will be displayed here
            </Typography>
          </Paper>
        )}

        {tabValue === 4 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Followers</Typography>
            <List>
              {followData.followers.map((follower) => (
                <ListItem key={follower.id}>
                  <ListItemText primary={`${follower.first_name} ${follower.last_name}`} />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {tabValue === 5 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Following</Typography>
            <List>
              {followData.following.map((following) => (
                <ListItem key={following.id}>
                  <ListItemText primary={`${following.first_name} ${following.last_name}`} />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      <PrivacySettingsModal
        open={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />
    </Container>
  );
};

export default Profile; 

