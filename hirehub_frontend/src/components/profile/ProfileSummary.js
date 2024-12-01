import React, { useEffect, useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Skeleton,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';

const ProfileSummary = () => {
  const { user: currentUser } = useAuth();
  const [profileStats, setProfileStats] = useState({
    posts_count: 0,
    followers_count: 0,
    following_count: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileStats = async () => {
      try {
        const response = await userService.getProfileStats();
        setProfileStats(response.data);
      } catch (error) {
        console.error('Failed to fetch profile stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.id) {
      fetchProfileStats();
    }
  }, [currentUser?.id]);

  if (loading) {
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
    <Card sx={{ mb: 3, position: 'relative' }}>
      {/* Cover Photo */}
      <Box
        sx={{
          height: 200,
          width: '100%',
          backgroundColor: 'primary.light',
          backgroundImage: currentUser?.cover_photo 
            ? `url(${currentUser.cover_photo})`
            : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Profile Content */}
      <CardContent sx={{ position: 'relative', pt: 8 }}>
        {/* Avatar */}
        <Avatar
          src={currentUser?.profile_picture}
          sx={{
            width: 120,
            height: 120,
            border: '4px solid white',
            position: 'absolute',
            top: -60,
            left: 20,
          }}
        />
        
        {/* User Info */}
        <Box sx={{ ml: 1, mt: 2 }}>
          <Typography variant="h5" gutterBottom>
            {currentUser?.first_name} {currentUser?.last_name}
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            {currentUser?.title || 'No title set'}
          </Typography>
        </Box>

        {/* Stats */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={4}>
            <Typography variant="h6" align="center">
              {profileStats.posts_count}
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center">
              Posts
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="h6" align="center">
              {profileStats.followers_count}
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center">
              Followers
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="h6" align="center">
              {profileStats.following_count}
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center">
              Following
            </Typography>
          </Grid>
        </Grid>

        {/* Edit Profile Button */}
        <Button
          variant="outlined"
          fullWidth
          sx={{ mt: 2 }}
          onClick={() => {/* Add edit profile handler */}}
        >
          Edit Profile
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileSummary;