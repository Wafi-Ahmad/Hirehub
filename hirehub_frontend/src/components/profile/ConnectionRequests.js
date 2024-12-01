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
  Stack,
  Box
} from '@mui/material';
import { useConnection } from '../../context/ConnectionContext';
import { toast } from 'react-toastify';

const ConnectionRequests = () => {
  const { connections, handleConnectionRequest, loading } = useConnection();

  const handleRequest = async (requestId, action) => {
    try {
      await handleConnectionRequest(requestId, action);
      toast.success(`Connection request ${action.toLowerCase()}ed successfully!`);
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${action.toLowerCase()} request`);
    }
  };

  if (!connections.received.length) {
    return null;
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Connection Requests
      </Typography>
      <List>
        {connections.received.map((request) => (
          <ListItem key={request.id}>
            <ListItemAvatar>
              <Avatar src={request.sender.profile_picture} />
            </ListItemAvatar>
            <ListItemText
              primary={`${request.sender.first_name} ${request.sender.last_name}`}
              secondary={request.sender.current_work || 'No title'}
            />
            <ListItemSecondaryAction>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  onClick={() => handleRequest(request.id, 'ACCEPT')}
                >
                  Accept
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  disabled={loading}
                  onClick={() => handleRequest(request.id, 'REJECT')}
                >
                  Reject
                </Button>
              </Stack>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default ConnectionRequests; 