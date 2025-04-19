import React from 'react';
import { Box, Container } from '@mui/material';
import { useParams } from 'react-router-dom';
import MessagingContainer from '../../components/messaging/MessagingContainer';

const MessagesPage = () => {
  const { conversationId } = useParams();

  return (
    <Container 
      maxWidth="lg" 
      disableGutters 
      sx={{ 
        height: 'calc(100vh - 64px)',
        py: 2,
        px: { xs: 0, md: 2 }
      }}
    >
      <MessagingContainer />
    </Container>
  );
};

export default MessagesPage; 