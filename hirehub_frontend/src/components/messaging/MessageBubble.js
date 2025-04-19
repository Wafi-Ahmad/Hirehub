import React from 'react';
import { Box, Paper, Typography, Avatar } from '@mui/material';
import moment from 'moment';

const MessageBubble = ({ message, isCurrentUser, showAvatar, otherUser }) => {
  const formatTimestamp = (timestamp) => {
    const messageDate = moment(timestamp);
    const now = moment();
    
    if (messageDate.isSame(now, 'day')) {
      return messageDate.format('h:mm A');
    } else if (messageDate.isSame(now.subtract(1, 'days'), 'day')) {
      return 'Yesterday';
    } else if (messageDate.isSame(now, 'year')) {
      return messageDate.format('MMM D');
    } else {
      return messageDate.format('MMM D, YYYY');
    }
  };

  const getInitials = (user) => {
    if (!user) return '?';
    return user.first_name ? user.first_name.charAt(0).toUpperCase() : '?';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isCurrentUser ? 'row-reverse' : 'row',
        maxWidth: '80%',
        mb: 1
      }}
    >
      {!isCurrentUser && showAvatar && (
        <Avatar 
          sx={{ mr: 1, width: 32, height: 32 }}
        >
          {getInitials(otherUser)}
        </Avatar>
      )}
      
      <Box>
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: isCurrentUser ? 'primary.main' : 'background.paper',
            color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
            ml: isCurrentUser ? 0 : (showAvatar ? 0 : 5),
            mr: isCurrentUser ? (showAvatar ? 0 : 5) : 0,
          }}
        >
          <Typography variant="body1">{message.content}</Typography>
        </Paper>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            mt: 0.5,
            display: 'block',
            textAlign: isCurrentUser ? 'right' : 'left',
            ml: isCurrentUser ? 0 : (showAvatar ? 0 : 5),
            mr: isCurrentUser ? (showAvatar ? 0 : 5) : 0,
          }}
        >
          {formatTimestamp(message.timestamp)}
        </Typography>
      </Box>
    </Box>
  );
};

export default MessageBubble; 