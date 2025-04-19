import React, { useState, useEffect } from 'react';
import { Box, Paper, Grid, useMediaQuery, useTheme, IconButton, Drawer } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import ConversationList from './ConversationList';
import Conversation from './Conversation';
import axios from 'axios';

const Messaging = () => {
  const { conversationId } = useParams();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (conversationId) {
      setSelectedConversation(conversationId);
    }
  }, [conversationId]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('/api/users/me/');
      setCurrentUser(response.data);
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const handleSelectConversation = (conversationId) => {
    setSelectedConversation(conversationId);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const handleNewConversation = () => {
    // This will be called after a new conversation is created
    // Can be used to fetch the conversation list again or for other side effects
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const conversationListComponent = (
    <ConversationList
      onSelectConversation={handleSelectConversation}
      selectedConversationId={selectedConversation}
      onNewConversation={handleNewConversation}
      currentUser={currentUser}
    />
  );

  return (
    <Box sx={{ height: '100%', overflow: 'hidden', width: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {isMobile ? (
          <>
            {/* Mobile view with drawer for conversation list */}
            <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <IconButton 
                edge="start" 
                color="inherit" 
                onClick={toggleDrawer}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            </Box>
            
            <Drawer
              anchor="left"
              open={drawerOpen}
              onClose={toggleDrawer}
              sx={{
                '& .MuiDrawer-paper': { width: '80%', maxWidth: 350, boxSizing: 'border-box' },
              }}
            >
              {conversationListComponent}
            </Drawer>
            
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <Conversation 
                conversationId={selectedConversation}
                currentUser={currentUser}
              />
            </Box>
          </>
        ) : (
          /* Desktop view with side-by-side layout */
          <Grid container sx={{ height: '100%' }}>
            <Grid item xs={4} sx={{ height: '100%', borderRight: '1px solid', borderColor: 'divider' }}>
              {conversationListComponent}
            </Grid>
            <Grid item xs={8} sx={{ height: '100%' }}>
              <Conversation 
                conversationId={selectedConversation}
                currentUser={currentUser}
              />
            </Grid>
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default Messaging; 