import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const PostJob = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Post a New Job
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create a new job listing here.
        </Typography>
        {/* Add your job posting form component here */}
      </Box>
    </Container>
  );
};

export default PostJob; 