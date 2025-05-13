import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Divider,
  CircularProgress,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { 
  Send as SendIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import api from '../../utils/api';
import moment from 'moment';

const MessageBubble = ({ message, isCurrentUser, onEditMessage, onDeleteMessage }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Check if message is less than 24 hours old
  const isWithin24Hours = () => {
    const messageTime = new Date(message.created_at);
    const currentTime = new Date();
    const timeDifference = currentTime - messageTime; // in milliseconds
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    return hoursDifference < 24;
  };
  
  // Can edit/delete only if message is within 24 hours
  const canModify = isCurrentUser && !message.is_deleted && isWithin24Hours();
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(message.content);
  };

  const handleSaveEdit = () => {
    if (editedContent.trim() !== '' && editedContent !== message.content) {
      onEditMessage(message.id, editedContent);
    }
    setIsEditing(false);
  };

  const handleConfirmDelete = () => {
    onDeleteMessage(message.id);
    setDeleteConfirmOpen(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
        mb: 2,
        width: '100%',
      }}
    >
      {!isCurrentUser && (
        <Avatar sx={{ mr: 1, width: 36, height: 36 }}>
          {message.sender.first_name ? message.sender.first_name.charAt(0) : '?'}
        </Avatar>
      )}
      
      <Box
        sx={{
          maxWidth: { xs: '75%', md: '60%' },
          backgroundColor: isCurrentUser ? 'primary.main' : 'grey.100',
          borderRadius: 2,
          p: 2,
          position: 'relative',
          boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        {!isCurrentUser && (
          <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5 }}>
            {message.sender.first_name} {message.sender.last_name}
          </Typography>
        )}
        
        {isEditing ? (
          <Box sx={{ mb: 1 }}>
            <TextField
              fullWidth
              multiline
              variant="outlined"
              size="small"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              autoFocus
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button size="small" onClick={handleCancelEdit}>Cancel</Button>
              <Button size="small" variant="contained" onClick={handleSaveEdit}>Save</Button>
            </Box>
          </Box>
        ) : (
          <>
            <Typography variant="body1">
              {message.is_deleted ? (
                <Typography component="span" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  [This message has been deleted]
                </Typography>
              ) : (
                message.content
              )}
            </Typography>
            
            {message.is_edited && !message.is_deleted && (
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
                (edited)
              </Typography>
            )}
          </>
        )}
        
        <Typography
          variant="caption"
          color={isCurrentUser ? "primary.contrastText" : "textSecondary"}
          sx={{ 
            display: 'block', 
            mt: 0.5, 
            textAlign: 'right',
            opacity: 0.8 
          }}
        >
          {moment(message.created_at).format('LT')}
        </Typography>
        
        {/* Three-dots menu for editing/deleting (only if within 24 hours) */}
        {canModify && !isEditing && (
          <IconButton 
            size="small" 
            onClick={handleMenuOpen}
            sx={{ 
              position: 'absolute',
              top: 5,
              right: 5,
              color: isCurrentUser ? 'primary.contrastText' : 'action.active',
              opacity: 0.7
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        )}
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEditClick}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
          </MenuItem>
          <MenuItem onClick={handleDeleteClick}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
          </MenuItem>
        </Menu>
        
        {/* Delete confirmation dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
        >
          <DialogTitle>Delete Message</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this message? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmDelete} color="error">Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
      
      {isCurrentUser && (
        <Avatar sx={{ ml: 1, width: 36, height: 36 }}>
          {message.sender.first_name ? message.sender.first_name.charAt(0) : '?'}
        </Avatar>
      )}
    </Box>
  );
};

const ConversationView = ({ conversationId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const justSentMessageRef = useRef(null);
  
  // Connect to WebSocket when conversation changes
  useEffect(() => {
    if (conversationId && currentUser) {
      // Initial fetch of messages when entering a conversation
      fetchMessages();
      
      // Set up WebSocket connection
      setupWebSocket();
      
      return () => {
        // Clean up WebSocket on unmount or conversation change
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
      };
    }
  }, [conversationId, currentUser]);
  
  const setupWebSocket = () => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      // Create WebSocket connection with properly encoded token
      const encodedToken = encodeURIComponent(token);
      
      // Use the correct WebSocket URL format with backend server port (8000)
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.hostname}:8000/ws/chat/${encodedToken}/`;
      
      console.log('Attempting WebSocket connection to:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      
      // Add connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.log('WebSocket connection timed out, retrying...');
          ws.close();
        }
      }, 5000);
      
      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket connected successfully');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data); // Debug log
          
          if (data.type === 'new_message' && data.message) {
            console.log('New message received:', data.message);
            // Check if the message belongs to the current conversation
            if (data.message.conversation_id === parseInt(conversationId)) {
              // Check if we already have this message to avoid duplicates
              setMessages(prevMessages => {
                if (!prevMessages.some(m => m.id === data.message.id) && 
                    justSentMessageRef.current !== data.message.id) {
                  console.log('Adding new message to state');
                  return [...prevMessages, data.message];
                }
                return prevMessages;
              });
              
              // Scroll to bottom after adding message
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 300);
            }
          }
          else if (data.type === 'message_updated' && data.message) {
            console.log('Message update received:', data.message);
            // Update the message in our local state
            if (data.message.conversation_id === parseInt(conversationId)) {
              setMessages(prevMessages => 
                prevMessages.map(msg => 
                  msg.id === data.message.id 
                    ? { ...msg, content: data.message.content, is_edited: true }
                    : msg
                )
              );
            }
          }
          else if (data.type === 'message_deleted' && data.message) {
            console.log('Message deletion received:', data.message);
            // Mark the message as deleted in our local state
            if (data.message.conversation_id === parseInt(conversationId)) {
              setMessages(prevMessages => 
                prevMessages.map(msg => 
                  msg.id === data.message.id 
                    ? { ...msg, is_deleted: true, content: "[This message has been deleted]" }
                    : msg
                )
              );
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket disconnected', event.code, event.reason);
        
        // Implement reconnection with exponential backoff
        // Don't reconnect if we closed it intentionally or component is unmounting
        if (event.code !== 1000 && wsRef.current) {
          console.log('Attempting to reconnect WebSocket in 2 seconds...');
          setTimeout(setupWebSocket, 2000);
        }
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      // Retry connection after delay
      setTimeout(setupWebSocket, 3000);
    }
  };
  
  // Fetch conversation data to get recipient info
  useEffect(() => {
    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId]);
  
  const fetchConversation = async () => {
    try {
      const response = await api.get(`/api/messaging/conversations/${conversationId}/`);
      setConversation(response.data);
    } catch (err) {
      console.error('Error fetching conversation details:', err);
    }
  };
  
  // Get recipient info from conversation
  const getRecipient = () => {
    if (!conversation || !currentUser || !conversation.participants) return null;
    
    // Find the participant who is not the current user
    return conversation.participants.find(p => p.id !== currentUser.id);
  };
  
  const fetchMessages = async () => {
    if (!conversationId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/api/messaging/conversations/${conversationId}/messages/`);
      
      // Check if the response has a results field (for paginated responses)
      const messageData = response.data.results || response.data;
      setMessages(Array.isArray(messageData) ? messageData : []);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Make sure your Django backend is properly configured.');
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !conversationId) return;
    
    try {
      setSending(true);
      
      // Send the message
      const response = await api.post(`/api/messaging/messages/`, {
        conversation: conversationId,
        content: newMessage.trim()
      });
      
      // Update the messages state by adding the new message
      if (response.data && response.data.id) {
        // Store the message ID that was just sent to prevent duplicates from WebSocket
        justSentMessageRef.current = response.data.id;
        
        // Don't add the message to state here - let the WebSocket handle it
        // This prevents duplication of messages
        
        // Clear the sent message ID reference after a short delay
        setTimeout(() => {
          justSentMessageRef.current = null;
        }, 2000); // 2 second window to prevent duplicates
      }
      
      setNewMessage('');
      setSending(false);
      
      // Scroll to bottom after sending a message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Error sending message:', err);
      setSending(false);
    }
  };
  
  // Handle editing a message
  const handleEditMessage = async (messageId, newContent) => {
    try {
      await api.put(`/api/messaging/messages/${messageId}/`, {
        content: newContent
      });
      
      // Optimistic update - will be confirmed via WebSocket
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: newContent, is_edited: true }
            : msg
        )
      );
    } catch (error) {
      console.error('Error editing message:', error);
      
      let errorMessage = 'Failed to edit message. Please try again.';
      
      // Check for 403 Forbidden (message too old)
      if (error.response && error.response.status === 403) {
        errorMessage = error.response.data.error || 'You can only edit messages within 24 hours of sending.';
      }
      
      setError(errorMessage);
    }
  };
  
  // Handle deleting a message
  const handleDeleteMessage = async (messageId) => {
    try {
      await api.delete(`/api/messaging/messages/${messageId}/`);
      
      // Optimistic update - will be confirmed via WebSocket
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId 
            ? { ...msg, is_deleted: true, content: "[This message has been deleted]" }
            : msg
        )
      );
    } catch (error) {
      console.error('Error deleting message:', error);
      
      let errorMessage = 'Failed to delete message. Please try again.';
      
      // Check for 403 Forbidden (message too old)
      if (error.response && error.response.status === 403) {
        errorMessage = error.response.data.error || 'You can only delete messages within 24 hours of sending.';
      }
      
      setError(errorMessage);
    }
  };
  
  if (!conversationId) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          p: 3,
        }}
      >
        <Typography variant="h6" color="textSecondary" align="center">
          Select a conversation or start a new one
        </Typography>
      </Box>
    );
  }
  
  const recipient = getRecipient();
  
  return (
    <Paper
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        width: '100%',
      }}
      data-testid="conversation-view"
    >
      {/* Conversation header with recipient info */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Avatar 
          sx={{ 
            width: 40, 
            height: 40, 
            mr: 2 
          }}
        >
          {recipient?.first_name?.charAt(0) || '?'}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight="medium">
            {recipient ? `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim() : 'Loading...'}
          </Typography>
          {recipient?.user_type && (
            <Typography variant="caption" color="text.secondary">
              {recipient.user_type}
            </Typography>
          )}
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <Typography variant="caption" color="text.secondary">
            {conversation?.updated_at ? `Last active: ${moment(conversation.updated_at).format('MMM D, h:mm A')}` : ''}
          </Typography>
        </Box>
      </Box>
      
      {/* Messages area */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          backgroundColor: 'background.default',
          width: '100%'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error" gutterBottom>
              {error}
            </Typography>
            <Button variant="outlined" onClick={fetchMessages} sx={{ mt: 1 }}>
              Try Again
            </Button>
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isCurrentUser={message.sender.id === currentUser?.id}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>
      
      <Divider />
      
      {/* Message input area */}
      <Box sx={{ p: 2, backgroundColor: 'background.paper', width: '100%' }}>
        <form onSubmit={handleSendMessage}>
          <Box sx={{ display: 'flex' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
              sx={{ mr: 1 }}
              size="medium"
            />
            <IconButton
              color="primary"
              type="submit"
              disabled={!newMessage.trim() || sending}
              sx={{ alignSelf: 'center' }}
              size="large"
            >
              {sending ? <CircularProgress size={24} /> : <SendIcon />}
            </IconButton>
          </Box>
        </form>
      </Box>
    </Paper>
  );
};

export default ConversationView; 