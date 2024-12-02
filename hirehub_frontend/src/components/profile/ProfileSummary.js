import React, { useEffect } from 'react';
import {
  Box,
  Avatar,
  Typography,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Chip,
  Stack,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';

const ProfileSummary = ({ allowEdit = false }) => {
  const { user: currentUser } = useAuth();
  const { currentUserProfile, loading, fetchCurrentUserProfile } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch current user's profile when component mounts
    fetchCurrentUserProfile();
  }, [fetchCurrentUserProfile]);

  const handleProfileClick = () => {
    navigate(`/profile/${currentUser.id}`);
  };

  if (loading || !currentUserProfile) {
    return (
      <Card sx={{ mb: 3, position: 'relative' }}>
        <Skeleton variant="rectangular" height={200} />
        <CardContent>
          <Skeleton variant="circular" width={120} height={120} />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        mb: 3, 
        position: 'relative',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 6,
        }
      }}
      onClick={handleProfileClick}
    >
      <Box
        sx={{
          height: 200,
          bgcolor: 'grey.200',
          backgroundImage: currentUserProfile?.cover_picture ? `url(${currentUserProfile.cover_picture})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <CardContent>
        <Box
          sx={{
            mt: -13,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar
            src={currentUserProfile?.profile_picture}
            sx={{
              width: 120,
              height: 120,
              border: '4px solid white',
              mb: 2,
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.9,
              }
            }}
          />
          <Typography variant="h5" gutterBottom>
            {currentUserProfile?.first_name} {currentUserProfile?.last_name}
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            {currentUserProfile?.current_work || 'No current work information'}
          </Typography>

          {Array.isArray(currentUserProfile?.skills) && (
            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 2, flexWrap: 'wrap', justifyContent: 'center', gap: 1 }}
            >
              {currentUserProfile.skills.slice(0, 5).map((skill, index) => (
                <Chip key={index} label={skill} size="small" />
              ))}
              {currentUserProfile.skills.length > 5 && (
                <Chip
                  label={`+${currentUserProfile.skills.length - 5} more`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>
          )}

          <Grid container spacing={2} sx={{ mt: 3, textAlign: 'center' }}>
            <Grid item xs={6}>
              <Typography variant="h6">{currentUserProfile?.followers_count || 0}</Typography>
              <Typography variant="body2" color="textSecondary">Followers</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6">{currentUserProfile?.following_count || 0}</Typography>
              <Typography variant="body2" color="textSecondary">Following</Typography>
            </Grid>
          </Grid>

          {currentUserProfile?.experience && (
            <Box sx={{ mt: 3, width: '100%' }}>
              <Typography variant="h6" gutterBottom>Experience</Typography>
              <Typography variant="body2" noWrap>
                {currentUserProfile.experience}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProfileSummary;