import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Avatar,
  Typography,
  TextField,
  InputAdornment,
  Divider,
  Badge,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon
} from '@mui/icons-material';
import api from '../../utils/api';
import moment from 'moment';

const ConversationsList = ({ onConversationSelect, onNewConversation, selectedConversationId }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);

  const fetchConversations = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      // Get token and add to Authorization header
      const token = localStorage.getItem('token');
      
      const response = await api.get('/api/messaging/conversations/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Handle different response formats (with or without pagination)
      const conversationsData = response.data.results || response.data || [];
      const conversations = Array.isArray(conversationsData) ? conversationsData : [];
      
      setConversations(conversations);
      setFilteredConversations(conversations);
      setError(null);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      // Don't set error if it's just empty conversations - backend returns empty array
      if (err.response && err.response.status !== 404) {
        setError('Failed to load conversations. Please try refreshing.');
      } else {
        // For 404 or no response, just set empty conversations
        setConversations([]);
        setFilteredConversations([]);
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchConversations();
    
    // Set up polling for new conversations or updates with less frequent interval
    const intervalId = setInterval(() => {
      // Check if component is visible/active before making the call
      if (document.visibilityState === 'visible') {
        fetchConversations(false); // Pass false to not show loading indicator for polling
      }
    }, 30000); // Poll every 30 seconds instead of 10 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = conversations.filter(conv => {
        const participants = conv.participants || [];
        return participants.some(p => 
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(query) ||
          (p.email && p.email.toLowerCase().includes(query))
        ) || (conv.last_message && conv.last_message.content.toLowerCase().includes(query));
      });
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleRefresh = () => {
    fetchConversations();
  };

  const getParticipantName = (conversation) => {
    if (!conversation.participants || conversation.participants.length === 0) {
      return 'Unknown';
    }
    
    // Assuming the first non-current user participant is the one to display
    // This would need to be adjusted for group conversations
    const participant = conversation.participants[0];
    return `${participant.first_name} ${participant.last_name}`;
  };

  const getLastMessagePreview = (conversation) => {
    if (!conversation.last_message) return 'No messages yet';
    return conversation.last_message.content.length > 40
      ? `${conversation.last_message.content.substring(0, 40)}...`
      : conversation.last_message.content;
  };

  const getLastMessageTime = (conversation) => {
    if (!conversation.last_message) return '';
    return moment(conversation.last_message.timestamp).calendar({
      sameDay: 'LT',
      lastDay: '[Yesterday]',
      lastWeek: 'ddd',
      sameElse: 'MM/DD/YY'
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6">Messages</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onNewConversation}
          size="small"
        >
          New
        </Button>
      </Box>

      {/* Search */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          size="small"
        />
      </Box>

      {/* Conversations list */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <Alert 
              severity="error" 
              action={
                <Button color="inherit" size="small" onClick={handleRefresh}>
                  Retry
                </Button>
              }
            >
              {error}
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Make sure your Django backend is running at http://localhost:8000 
                and has the messaging API endpoints configured properly.
              </Typography>
            </Alert>
          </Box>
        ) : filteredConversations.length === 0 ? (
          <Box sx={{ 
            p: 3, 
            textAlign: 'center', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%' 
          }}>
            <ChatBubbleOutlineIcon 
              sx={{ 
                fontSize: 80, 
                color: 'text.secondary', 
                opacity: 0.7,
                mb: 2 
              }} 
            />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              {searchQuery
                ? 'No conversations found'
                : 'No conversations yet'}
            </Typography>
            <Typography color="textSecondary" paragraph>
              {searchQuery
                ? 'Try a different search term'
                : 'Start a new conversation by clicking the "New" button'}
            </Typography>
            {searchQuery && (
              <Button 
                variant="outlined"
                onClick={() => setSearchQuery('')} 
                sx={{ mt: 1 }}
              >
                Clear search
              </Button>
            )}
          </Box>
        ) : (
          <List disablePadding>
            {filteredConversations.map((conversation) => (
              <React.Fragment key={conversation.id}>
                <ListItemButton
                  selected={selectedConversationId === conversation.id}
                  onClick={() => onConversationSelect(conversation.id)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&.Mui-selected': {
                      bgcolor: 'action.selected',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      color="error"
                      variant="dot"
                      invisible={!conversation.unread_count}
                      overlap="circular"
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                    >
                      <Avatar alt={getParticipantName(conversation)}>
                        {getParticipantName(conversation).charAt(0)}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: conversation.unread_count ? 700 : 400,
                            color: conversation.unread_count ? 'text.primary' : 'text.secondary',
                          }}
                        >
                          {getParticipantName(conversation)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {getLastMessageTime(conversation)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{
                          color: conversation.unread_count ? 'text.primary' : 'text.secondary',
                          fontWeight: conversation.unread_count ? 500 : 400,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {getLastMessagePreview(conversation)}
                      </Typography>
                    }
                  />
                </ListItemButton>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default ConversationsList; 