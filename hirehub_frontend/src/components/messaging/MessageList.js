import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  CircularProgress,
  Divider,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';
import moment from 'moment';

// MessageBubble component for the MessageList
const MessageBubble = ({ message, isCurrentUser, onEditMessage, onDeleteMessage }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Check if message is less than 24 hours old
  const isWithin24Hours = () => {
    const messageTime = new Date(message.timestamp);
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
        mb: 1.5
      }}
    >
      {!isCurrentUser && (
        <Avatar
          sx={{ mr: 1, width: 36, height: 36 }}
          alt={message.sender_name || 'User'}
        >
          {message.sender_name ? message.sender_name.charAt(0) : 'U'}
        </Avatar>
      )}
      
      <Box
        sx={{
          maxWidth: '70%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isCurrentUser ? 'flex-end' : 'flex-start'
        }}
      >
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: isCurrentUser ? 'primary.main' : 'background.paper',
            color: isCurrentUser ? 'white' : 'text.primary',
            position: 'relative'
          }}
        >
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
                sx={{ mb: 1, minWidth: '200px' }}
                InputProps={{
                  sx: { color: isCurrentUser ? 'white' : 'inherit' }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button size="small" onClick={handleCancelEdit}>Cancel</Button>
                <Button size="small" variant="contained" onClick={handleSaveEdit}>Save</Button>
              </Box>
            </Box>
          ) : (
            <Typography variant="body1">
              {message.is_deleted ? (
                <Typography component="span" sx={{ fontStyle: 'italic', opacity: 0.7 }}>
                  [This message has been deleted]
                </Typography>
              ) : (
                message.content
              )}
            </Typography>
          )}
          
          {/* Three-dots menu for editing/deleting (only if within 24 hours) */}
          {canModify && !isEditing && (
            <IconButton 
              size="small" 
              onClick={handleMenuOpen}
              sx={{ 
                position: 'absolute',
                top: 5,
                right: 5,
                color: isCurrentUser ? 'white' : 'action.active',
                opacity: 0.7
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </Paper>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
          <Typography
            variant="caption"
            color="textSecondary"
          >
            {formatTime(message.timestamp)}
          </Typography>
          
          {message.is_edited && !message.is_deleted && (
            <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
              (edited)
            </Typography>
          )}
        </Box>
        
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
        <Avatar
          sx={{ ml: 1, width: 36, height: 36 }}
          alt={currentUser.name || 'You'}
        >
          {currentUser.first_name ? currentUser.first_name.charAt(0) : 'Y'}
        </Avatar>
      )}
    </Box>
  );
};

const MessageList = ({ conversationId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const justSentMessageRef = useRef(null);

  // Connect to WebSocket and fetch messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      // Initial fetch of all messages when entering a conversation
      fetchMessages();
      
      // Set up WebSocket connection for real-time messages
      setupWebSocket();
      
      return () => {
        // Clean up WebSocket on unmount or conversation change
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
      };
    }
  }, [conversationId]);

  // Setup WebSocket connection
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
              if (!messages.some(m => m.id === data.message.id) && 
                  justSentMessageRef.current !== data.message.id) {
                console.log('Adding new message to state');
                setMessages(prevMessages => [...prevMessages, data.message]);
                
                // Scroll to bottom after adding message
                setTimeout(() => {
                  scrollToBottom();
                }, 100);
              }
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

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!conversationId) return;
    
    setLoading(true);
    
    try {
      const response = await axios.get(`/api/messaging/conversations/${conversationId}/messages/`);
      setMessages(response.data.results || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !conversationId) return;
    
    setSending(true);
    try {
      const response = await axios.post(`/api/messaging/messages/`, {
        conversation: conversationId,
        content: newMessage.trim()
      });
      
      // Add the new message to the existing messages instead of refetching
      if (response.data && response.data.id) {
        const newMessageObj = response.data;
        // Store the message ID that was just sent to prevent duplicates from WebSocket
        justSentMessageRef.current = newMessageObj.id;
        
        // Add message to state
        setMessages(prevMessages => [...prevMessages, newMessageObj]);
        
        // Clear the sent message ID reference after a short delay
        setTimeout(() => {
          justSentMessageRef.current = null;
        }, 2000); // 2 second window to prevent duplicates
      }
      
      setNewMessage('');
      scrollToBottom();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Handle editing a message
  const handleEditMessage = async (messageId, newContent) => {
    try {
      await axios.put(`/api/messaging/messages/${messageId}/`, {
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
      await axios.delete(`/api/messaging/messages/${messageId}/`);
      
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    return moment(timestamp).format('h:mm A');
  };

  const formatDate = (timestamp) => {
    const messageDate = moment(timestamp);
    const today = moment().startOf('day');
    
    if (messageDate.isSame(today, 'day')) {
      return 'Today';
    } else if (messageDate.isSame(today.clone().subtract(1, 'days'), 'day')) {
      return 'Yesterday';
    } else if (messageDate.isAfter(today.clone().subtract(7, 'days'))) {
      return messageDate.format('dddd'); // Day of week
    } else {
      return messageDate.format('MMMM D, YYYY');
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = moment(message.timestamp).startOf('day').format('YYYY-MM-DD');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  if (!conversationId) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          bgcolor: 'background.default'
        }}
      >
        <Typography variant="h6" color="textSecondary">
          Select a conversation to view messages
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.default'
      }}
    >
      {/* Messages area */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="textSecondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <Box key={date} sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 2
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    bgcolor: 'grey.200',
                    px: 2,
                    py: 0.5,
                    borderRadius: 10,
                    color: 'text.secondary'
                  }}
                >
                  {formatDate(date)}
                </Typography>
              </Box>
              
              {dateMessages.map((message) => {
                const isCurrentUser = message.sender === currentUser.id;
                
                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isCurrentUser={isCurrentUser}
                    onEditMessage={handleEditMessage}
                    onDeleteMessage={handleDeleteMessage}
                  />
                );
              })}
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message input area */}
      <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
        <Divider sx={{ mb: 2 }} />
        <form onSubmit={handleSendMessage}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="medium" edge="start" sx={{ mr: 1 }}>
              <Badge badgeContent={0} color="primary">
                <AttachFileIcon />
              </Badge>
            </IconButton>
            
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
              size="small"
              InputProps={{
                sx: { borderRadius: 4 }
              }}
            />
            
            <IconButton
              color="primary"
              edge="end"
              disabled={!newMessage.trim() || sending}
              type="submit"
              sx={{ ml: 1 }}
            >
              {sending ? <CircularProgress size={24} /> : <SendIcon />}
            </IconButton>
          </Box>
        </form>
      </Box>
    </Box>
  );
};

export default MessageList; 