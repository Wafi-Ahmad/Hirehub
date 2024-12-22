import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Paper, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { toast } from 'react-toastify';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PeopleIcon from '@mui/icons-material/People';

const ConnectionSuggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const data = await userService.getConnectionRecommendations(5);
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleFollow = async (userId) => {
    try {
      await userService.followUser(userId);
      // Update the local state to reflect the change
      setSuggestions(prevSuggestions => 
        prevSuggestions.filter(user => user.id !== userId)
      );
      toast.success('Successfully followed user');
      // Refresh recommendations
      fetchRecommendations();
    } catch (error) {
      toast.error('Failed to follow user');
      console.error('Follow error:', error);
    }
  };

  if (loading) {
    return (
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (!suggestions.length) {
    return (
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          People you may know
        </Typography>
        <Box display="flex" flexDirection="column" alignItems="center" py={2}>
          <PeopleIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
          <Typography color="text.secondary">
            No recommendations available at the moment
          </Typography>
        </Box>
      </Paper>
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
              flex: 1,
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
                {user.headline || user.current_work || 'No headline'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.mutual_connections_count} mutual connection{user.mutual_connections_count !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Follow">
            <IconButton
              onClick={() => handleFollow(user.id)}
              size="small"
              sx={{ ml: 1 }}
            >
              <PersonAddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ))}
    </Paper>
  );
};

export default ConnectionSuggestions;