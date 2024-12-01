import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Button,
  Box,
  Divider,
  Skeleton
} from '@mui/material';
import { useConnection } from '../../context/ConnectionContext';
import { useNavigate } from 'react-router-dom';

const ConnectionSuggestions = () => {
  const { sendConnectionRequest, loading } = useConnection();
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
      <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
        {[1, 2, 3].map((item) => (
          <Box key={item} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
              </Box>
            </Box>
            <Divider />
          </Box>
        ))}
      </Paper>
    );
  }

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        People you may know
      </Typography>
      <List disablePadding>
        {suggestions.map((suggestion, index) => (
          <React.Fragment key={suggestion.id}>
            <ListItem 
              alignItems="flex-start"
              sx={{ px: 0 }}
            >
              <ListItemAvatar>
                <Avatar
                  src={suggestion.profile_picture}
                  alt={`${suggestion.first_name} ${suggestion.last_name}`}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/profile/${suggestion.id}`)}
                />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography
                    variant="subtitle2"
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                    onClick={() => navigate(`/profile/${suggestion.id}`)}
                  >
                    {`${suggestion.first_name} ${suggestion.last_name}`}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {suggestion.current_work}
                  </Typography>
                }
              />
              <ListItemSecondaryAction>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => sendConnectionRequest(suggestion.id)}
                  disabled={loading}
                >
                  Connect
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
            {index < suggestions.length - 1 && (
              <Divider variant="inset" component="li" />
            )}
          </React.Fragment>
        ))}
      </List>
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Button color="primary" size="small">
          View More
        </Button>
      </Box>
    </Paper>
  );
};

export default ConnectionSuggestions; 