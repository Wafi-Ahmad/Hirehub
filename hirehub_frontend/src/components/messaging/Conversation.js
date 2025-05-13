import React from 'react';
import { Box, Typography } from '@mui/material';

// This component is no longer used. ConversationView.js is used instead.
const Conversation = () => {
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="body1" color="text.secondary">
        This component has been deprecated.
        Please use ConversationView instead.
      </Typography>
    </Box>
  );
};

export default Conversation; 