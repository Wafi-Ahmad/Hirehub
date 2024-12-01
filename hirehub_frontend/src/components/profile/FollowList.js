import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  IconButton,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { useConnection } from '../../context/ConnectionContext';

const FollowList = ({ open, onClose, title, users }) => {
  const navigate = useNavigate();
  const { sendConnectionRequest } = useConnection();

  const handleConnect = async (userId) => {
    try {
      await sendConnectionRequest(userId);
    } catch (error) {
      console.error('Failed to send connection request:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {title}
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <List>
          {users.map((user) => (
            <ListItem key={user.id}>
              <ListItemAvatar>
                <Avatar
                  src={user.profile_picture}
                  onClick={() => {
                    navigate(`/profile/${user.id}`);
                    onClose();
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
                    onClick={() => {
                      navigate(`/profile/${user.id}`);
                      onClose();
                    }}
                  >
                    {`${user.first_name} ${user.last_name}`}
                  </Typography>
                }
                secondary={user.current_work}
              />
              {!user.is_connected && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleConnect(user.id)}
                >
                  Connect
                </Button>
              )}
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default FollowList; 