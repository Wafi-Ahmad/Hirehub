import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Button, Paper, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ConnectionSuggestions = () => {
  // const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Placeholder data - will be replaced with real data later
  const suggestions = [
    {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      current_work: 'Software Engineer at Tech Co',
      profile_picture: 'https://via.placeholder.com/50'
    },
    {
      id: 2,
      first_name: 'Jane',
      last_name: 'Smith',
      current_work: 'Product Manager at Innovation Inc',
      profile_picture: 'https://via.placeholder.com/50'
    }
  ];

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
            // onClick={() => handleProfileClick(user.id)}
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
          <Button
            variant="outlined"
            size="small"
            // onClick={() => user.is_following ? handleUnfollow(user.id) : handleFollow(user.id)}
            sx={{ ml: 2 }}
          >
            {user.is_following ? 'Unfollow' : 'Connect'}
          </Button>
        </Box>
      ))}
    </Paper>
  );
};

export default ConnectionSuggestions;