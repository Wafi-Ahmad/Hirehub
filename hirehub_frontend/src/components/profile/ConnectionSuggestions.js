import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Button, Paper, CircularProgress, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { toast } from 'react-toastify';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';

const ConnectionSuggestions = () => {
  const [suggestions, setSuggestions] = useState([
    {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      current_work: 'Software Engineer at Tech Co',
      profile_picture: 'https://via.placeholder.com/50',
      is_following: false
    },
    {
      id: 2,
      first_name: 'Jane',
      last_name: 'Smith',
      current_work: 'Product Manager at Innovation Inc',
      profile_picture: 'https://via.placeholder.com/50',
      is_following: false
    }
  ]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleFollow = async (userId) => {
    try {
      await userService.followUser(userId);
      // Update the local state to reflect the change
      setSuggestions(suggestions.map(user => 
        user.id === userId ? { ...user, is_following: true } : user
      ));
      toast.success('Successfully followed user');
    } catch (error) {
      toast.error('Failed to follow user');
      console.error('Follow error:', error);
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      await userService.followUser(userId); // Same endpoint handles both follow/unfollow
      // Update the local state to reflect the change
      setSuggestions(suggestions.map(user => 
        user.id === userId ? { ...user, is_following: false } : user
      ));
      toast.success('Successfully unfollowed user');
    } catch (error) {
      toast.error('Failed to unfollow user');
      console.error('Unfollow error:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        People you may know
      </Typography>
      {suggestions.map((user) => (
        <Box
          key={user.id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            p: 1,
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.04)',
              borderRadius: 1,
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => handleProfileClick(user.id)}
          >
            <Avatar
              src={user.profile_picture}
              alt={`${user.first_name} ${user.last_name}`}
              sx={{ mr: 2 }}
            />
            <Box>
              <Typography variant="subtitle2">
                {user.first_name} {user.last_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.headline || user.current_position || 'No headline'}
              </Typography>
            </Box>
          </Box>
          <IconButton
            color={user.is_following ? "primary" : "default"}
            onClick={() => user.is_following ? handleUnfollow(user.id) : handleFollow(user.id)}
            size="small"
          >
            {user.is_following ? <PersonRemoveIcon /> : <PersonAddIcon />}
          </IconButton>
        </Box>
      ))}
    </Paper>
  );
};

export default ConnectionSuggestions;