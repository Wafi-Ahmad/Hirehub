import React from 'react';
import { Box, Typography } from '@mui/material';

// This component is no longer used. MessagingContainer.js is used instead.
const Messaging = () => {
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="body1" color="text.secondary">
        This component has been deprecated. 
        Please use MessagingContainer instead.
      </Typography>
    </Box>
  );
};

export default Messaging; 