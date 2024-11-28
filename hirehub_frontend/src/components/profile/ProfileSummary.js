import React from 'react';
import {
  Paper,
  Box,
  Avatar,
  Typography,
  Button,
  Divider,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const ProfileSummary = () => {
  const { user } = useAuth();

  return (
    <Paper elevation={1} sx={{ p: 0, mb: 3, borderRadius: 2 }}>
      <Box sx={{ position: 'relative', height: 200 }}>
        <Box
          component="img"
          src="https://picsum.photos/800/200"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '8px 8px 0 0',
          }}
        />
        <Avatar
          sx={{
            width: 90,
            height: 90,
            border: '4px solid white',
            position: 'absolute',
            bottom: -45,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
          src={user?.profile_picture}
        />
      </Box>
      <Box sx={{ pt: 6, pb: 3, px: 3, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {user?.first_name} {user?.last_name}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {user?.title || 'No title added yet'}
        </Typography>
        <Box sx={{ mt: 2, mb: 3, display: 'flex', justifyContent: 'center', gap: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">256</Typography>
            <Typography variant="body2" color="text.secondary">Posts</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">2.5K</Typography>
            <Typography variant="body2" color="text.secondary">Connections</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">365</Typography>
            <Typography variant="body2" color="text.secondary">Following</Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {user?.bio || "I'd love to change the world, but they won't give me the source code."}
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button fullWidth variant="text" color="primary">
          View Profile
        </Button>
      </Box>
    </Paper>
  );
};

export default ProfileSummary; 