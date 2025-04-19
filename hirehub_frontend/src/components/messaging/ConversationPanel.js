import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Divider,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const Message = ({ message, isCurrentUser }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isCurrentUser ? 'row-reverse' : 'row',
        my: 1,
        gap: 1,
      }}
    >
      <Avatar
        sx={{ width: 32, height: 32 }}
        src={message.sender_avatar}
      >
        {message.sender_name?.charAt(0)}
      </Avatar>
      <Box>
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            borderRadius: 2,
            maxWidth: '70%',
            bgcolor: isCurrentUser ? 'primary.light' : 'background.paper',
            color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
          }}
        >
          <Typography variant="body1">{message.content}</Typography>
        </Paper>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
        </Typography>
      </Box>
    </Box>
  );
};

const ConversationPanel = ({ conversationId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    if (!conversationId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/messaging/conversations/${conversationId}/messages/`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;

    try {
      const response = await axios.post(`/api/messaging/messages/`, {
        conversation: conversationId,
        content: newMessage.trim()
      });
      
      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  useEffect(() => {
    fetchMessages();
    
    // Set up polling to check for new messages
    const intervalId = setInterval(fetchMessages, 10000);
    
    return () => clearInterval(intervalId);
  }, [conversationId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conversationId) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          p: 3,
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Select a conversation or start a new one
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {loading && messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          <List>
            {messages.map((message) => (
              <ListItem key={message.id} sx={{ px: 0 }}>
                <Message
                  message={message}
                  isCurrentUser={message.sender_id === currentUser?.id}
                />
              </ListItem>
            ))}
          </List>
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Divider />
      
      <Box component="form" onSubmit={sendMessage} sx={{ p: 2, backgroundColor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            size="small"
            disabled={loading}
          />
          <IconButton 
            color="primary" 
            type="submit" 
            disabled={!newMessage.trim() || loading}
            sx={{ ml: 1 }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ConversationPanel; 