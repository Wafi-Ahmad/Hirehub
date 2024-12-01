import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Button,
  Box,
  Divider
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useConnection } from '../../context/ConnectionContext';
import { useNavigate } from 'react-router-dom';

const ConnectionRequestsMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { handleConnectionRequest } = useConnection();
  const navigate = useNavigate();

  // Placeholder data - will be replaced with real data later
  const requests = [
    {
      id: 1,
      sender: {
        id: 101,
        first_name: 'Alice',
        last_name: 'Johnson',
        current_work: 'Frontend Developer',
        profile_picture: 'https://via.placeholder.com/40'
      }
    },
    {
      id: 2,
      sender: {
        id: 102,
        first_name: 'Bob',
        last_name: 'Wilson',
        current_work: 'Product Designer',
        profile_picture: 'https://via.placeholder.com/40'
      }
    }
  ];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = async (requestId, action) => {
    try {
      await handleConnectionRequest(requestId, action);
      handleClose();
    } catch (error) {
      console.error('Failed to handle connection request:', error);
    }
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        size="large"
      >
        <Badge badgeContent={requests.length} color="error">
          <PersonAddIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { 
            width: 320, 
            maxHeight: 400,
            '& .MuiMenuItem-root': {
              py: 1.5,
              px: 2,
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Connection Requests
          </Typography>
        </Box>
        <Divider />
        {requests.length === 0 ? (
          <MenuItem>
            <Typography color="text.secondary">
              No pending requests
            </Typography>
          </MenuItem>
        ) : (
          requests.map((request) => (
            <MenuItem key={request.id} sx={{ display: 'block' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                <ListItemAvatar>
                  <Avatar
                    src={request.sender.profile_picture}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${request.sender.id}`);
                      handleClose();
                    }}
                    sx={{ cursor: 'pointer' }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${request.sender.id}`);
                        handleClose();
                      }}
                    >
                      {`${request.sender.first_name} ${request.sender.last_name}`}
                    </Typography>
                  }
                  secondary={request.sender.current_work}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(request.id, 'ACCEPT');
                  }}
                >
                  Accept
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(request.id, 'REJECT');
                  }}
                >
                  Reject
                </Button>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default ConnectionRequestsMenu; 