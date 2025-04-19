import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  Button,
  CircularProgress,
  Badge,
  Fab,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import axios from 'axios';
import moment from 'moment';
import NewConversationDialog from './NewConversationDialog';
import api from '../../utils/api';

const ConversationList = ({ onSelectConversation, selectedConversationId, currentUser }) => {
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    filterConversations();
  }, [searchQuery, conversations]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/messaging/conversations/');
      setConversations(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filterConversations = () => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = conversations.filter(conversation => {
      const recipientName = getRecipientName(conversation).toLowerCase();
      const lastMessage = conversation.last_message?.content?.toLowerCase() || '';
      return recipientName.includes(query) || lastMessage.includes(query);
    });

    setFilteredConversations(filtered);
  };

  const getRecipientName = (conversation) => {
    if (!conversation || !conversation.participants) return 'Unknown';
    
    const recipient = conversation.participants.find(
      p => p.id !== (currentUser?.id || 0)
    );
    
    if (!recipient) return 'Unknown';
    
    const firstName = recipient.first_name || '';
    const lastName = recipient.last_name || '';
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    
    return recipient.username || recipient.email || 'Unknown';
  };

  const getRecipientInitials = (conversation) => {
    if (!conversation || !conversation.participants) return '?';
    
    const recipient = conversation.participants.find(
      p => p.id !== (currentUser?.id || 0)
    );
    
    if (!recipient) return '?';
    
    const firstName = recipient.first_name || '';
    const lastName = recipient.last_name || '';
    
    if (!firstName && !lastName) {
      return recipient.username ? recipient.username[0].toUpperCase() : '?';
    }
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const messageDate = moment(timestamp);
    const today = moment().startOf('day');
    
    if (messageDate.isSame(today, 'd')) {
      return messageDate.format('h:mm A');
    } else if (messageDate.isAfter(today.clone().subtract(7, 'days'))) {
      return messageDate.format('ddd');
    } else {
      return messageDate.format('MM/DD/YY');
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleCreateConversation = async (recipientId) => {
    setIsCreating(true);
    try {
      const newConversation = await createConversation(recipientId);
      setDialogOpen(false);
      
      // Select the new conversation
      if (newConversation && onSelectConversation) {
        onSelectConversation(newConversation.id);
      }
      
      // Refresh the conversation list
      await fetchConversations();
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const createConversation = async (recipientId) => {
    try {
      const response = await api.post('/api/messaging/conversations/', {
        participants: [recipientId]
      });
      return response.data;
    } catch (err) {
      console.error('Error in createConversation:', err);
      throw err;
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && conversations.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 0 }}>
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <TextField
          fullWidth
          placeholder="Search conversations..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {filteredConversations.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 3, 
          height: '100%',
          textAlign: 'center'
        }}>
          <ChatIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" color="textSecondary" gutterBottom>
            {searchQuery 
              ? "No conversations match your search." 
              : "You don't have any conversations yet."}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Start a new conversation by clicking the + button.
          </Typography>
        </Box>
      ) : (
        <List sx={{ 
          overflow: 'auto', 
          flex: 1,
          '& .MuiListItem-root.Mui-selected': {
            bgcolor: 'action.selected',
          },
          '& .MuiListItem-root:hover': {
            bgcolor: 'action.hover',
          }
        }}>
          {filteredConversations.map((conversation, index) => (
            <React.Fragment key={conversation.id}>
              <ListItem 
                button 
                alignItems="flex-start"
                selected={selectedConversationId === conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                sx={{ px: 2, py: 1.5 }}
              >
                <ListItemAvatar>
                  <Avatar>{getRecipientInitials(conversation)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" component="span" noWrap>
                        {getRecipientName(conversation)}
                      </Typography>
                      {conversation.last_message && (
                        <Typography variant="caption" color="textSecondary">
                          {formatTimestamp(conversation.last_message.timestamp)}
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      noWrap
                      sx={{ maxWidth: '220px' }}
                    >
                      {conversation.last_message 
                        ? conversation.last_message.content 
                        : "No messages yet"}
                    </Typography>
                  }
                />
              </ListItem>
              {index < filteredConversations.length - 1 && (
                <Divider variant="inset" component="li" />
              )}
            </React.Fragment>
          ))}
        </List>
      )}

      <Box sx={{ position: 'sticky', bottom: 16, right: 16, textAlign: 'right', p: 2 }}>
        <Fab
          color="primary"
          size="medium"
          onClick={handleDialogOpen}
          aria-label="add conversation"
        >
          <AddIcon />
        </Fab>
      </Box>

      <NewConversationDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSelectUser={handleCreateConversation}
        currentUser={currentUser}
        isCreating={isCreating}
      />
    </Paper>
  );
};

export default ConversationList; 