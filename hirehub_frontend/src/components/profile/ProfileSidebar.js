import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Paper, Button, Skeleton } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { isCompanyUser } from '../../utils/permissions';
import api from '../../services/api';

const ProfileSidebar = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ posts: 0, connections: 0, following: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        // Fetch profile data
        const profileResponse = await api.get('/users/profile/');
        setProfile(profileResponse.data);
        
        // Fetch stats
        const statsResponse = await api.get('/users/stats/');
        setStats(statsResponse.data);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user?.id]);

  if (!user) return null;

  const isCompany = isCompanyUser(user.userType);

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: '200px',
          backgroundColor: '#f5f5f5',
          backgroundImage: `url(${profile?.coverImage || 'https://source.unsplash.com/random/800x200/?corporate'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <Box sx={{ p: 3, pt: 0, position: 'relative' }}>
        {loading ? (
          <Skeleton 
            variant="circular" 
            width={120} 
            height={120} 
            sx={{ mt: '-60px', mb: 2 }} 
          />
        ) : (
          <Avatar
            src={profile?.profilePicture}
            alt={isCompany ? user.companyName : `${user.firstName} ${user.lastName}`}
            sx={{
              width: 120,
              height: 120,
              border: '4px solid white',
              position: 'relative',
              mt: '-60px',
              mb: 2
            }}
          />
        )}

        {loading ? (
          <>
            <Skeleton width="60%" height={32} sx={{ mb: 1 }} />
            <Skeleton width="40%" height={24} sx={{ mb: 3 }} />
          </>
        ) : (
          <>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              {isCompany ? user.companyName : `${user.firstName} ${user.lastName}`}
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              gutterBottom
              sx={{ mb: 3 }}
            >
              {user.title || 'Professional Profile'}
            </Typography>
          </>
        )}

        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mb: 3,
            textAlign: 'left'
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {stats.posts}
            </Typography>
            <Typography variant="body2" color="text.secondary">Posts</Typography>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {stats.connections}
            </Typography>
            <Typography variant="body2" color="text.secondary">Connections</Typography>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {stats.following}
            </Typography>
            <Typography variant="body2" color="text.secondary">Following</Typography>
          </Box>
        </Box>

        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ 
            fontStyle: 'italic',
            mb: 3 
          }}
        >
          {profile?.bio || "Welcome to my profile!"}
        </Typography>

        <Button
          variant="outlined"
          fullWidth
          color="primary"
          sx={{ mb: 2 }}
          href="/profile"
        >
          View Profile
        </Button>
      </Box>
    </Paper>
  );
};

export default ProfileSidebar;
