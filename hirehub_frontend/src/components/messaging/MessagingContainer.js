import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, useMediaQuery, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ConversationsList from './ConversationsList';
import ConversationView from './ConversationView';
import NewConversationDialog from './NewConversationDialog';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const MessagingContainer = () => {
  const { conversationId } = useParams();
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (conversationId) {
      setSelectedConversationId(conversationId);
      setShowConversation(true);
    }
  }, [conversationId]);

  useEffect(() => {
    setMobileView(isMobile);
    setShowConversation(isMobile ? !!selectedConversationId : true);
  }, [isMobile, selectedConversationId]);

  const handleSelectConversation = (conversationId) => {
    navigate(`/messages/${conversationId}`);
    setSelectedConversationId(conversationId);
    if (mobileView) {
      setShowConversation(true);
    }
  };

  const handleNewConversation = () => {
    setIsNewConversationOpen(true);
  };

  const handleCloseNewConversation = () => {
    setIsNewConversationOpen(false);
  };

  const handleCreateConversation = async (userId) => {
    try {
      // Make API call to create a new conversation
      const response = await api.post('/api/messaging/conversations/', {
        participants: [userId]
      });
      
      // Navigate to the new conversation
      if (response.data && response.data.id) {
        navigate(`/messages/${response.data.id}`);
        setSelectedConversationId(response.data.id);
        if (mobileView) {
          setShowConversation(true);
        }
      }
      
      setIsNewConversationOpen(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
      setIsNewConversationOpen(false);
    }
  };

  const handleBackToList = () => {
    navigate('/messages');
    setShowConversation(false);
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <Paper 
        elevation={3}
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%',
          width: '100%',
          overflow: 'hidden',
          borderRadius: { xs: 0, sm: 2 },
          boxShadow: { xs: 0, sm: 3 },
        }}
      >
        <Grid container sx={{ height: '100%' }}>
          {(!mobileView || !showConversation) && (
            <Grid
              item
              xs={12}
              md={3}
              sx={{
                height: '100%',
                borderRight: 1,
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <ConversationsList
                onConversationSelect={handleSelectConversation}
                selectedConversationId={selectedConversationId}
                onNewConversation={handleNewConversation}
                currentUserId={user?.id}
              />
            </Grid>
          )}

          {(!mobileView || showConversation) && (
            <Grid item xs={12} md={9} sx={{ height: '100%' }}>
              {selectedConversationId ? (
                <Box sx={{ height: '100%', position: 'relative', width: '100%' }}>
                  {mobileView && (
                    <IconButton
                      sx={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}
                      onClick={handleBackToList}
                    >
                      <ArrowBackIcon />
                    </IconButton>
                  )}
                  <ConversationView
                    conversationId={selectedConversationId}
                    currentUser={user}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    bgcolor: 'background.default',
                    p: 3
                  }}
                >
                  <Typography color="text.secondary" variant="h6" gutterBottom>
                    Select a conversation or start a new one
                  </Typography>
                  <Typography color="text.secondary" variant="body2" align="center">
                    Use the "New" button to start messaging with other users
                  </Typography>
                </Box>
              )}
            </Grid>
          )}
        </Grid>
      </Paper>

      <NewConversationDialog
        open={isNewConversationOpen}
        onClose={handleCloseNewConversation}
        onSelectUser={handleCreateConversation}
        currentUser={user}
      />
    </Box>
  );
};

export default MessagingContainer; 