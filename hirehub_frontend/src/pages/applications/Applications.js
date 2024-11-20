import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Applications = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Applications
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track and manage your job applications here.
        </Typography>
        {/* Add your applications list component here */}
      </Box>
    </Container>
  );
};

export default Applications; 