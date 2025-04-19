import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  CircularProgress,
  List,
  ListItem,
  InputAdornment,
  Button
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import axios from 'axios';
import moment from 'moment';
import MessageBubble from './MessageBubble';

const Conversation = ({ conversationId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [conversation, setConversation] = useState(null);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Fetch messages when component mounts or conversationId changes
  useEffect(() => {
    if (conversationId) {
      fetchConversation();
      fetchMessages();
    }
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversation = async () => {
    try {
      const response = await axios.get(`/api/messaging/conversations/${conversationId}/`);
      setConversation(response.data);
    } catch (err) {
      console.error('Error fetching conversation:', err);
      setError('Could not load conversation details');
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/messaging/conversations/${conversationId}/messages/`);
      setMessages(response.data.results || []);
      setError('');
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    setSending(true);
    try {
      const response = await axios.post(`/api/messaging/messages/`, {
        conversation: conversationId,
        content: newMessage
      });
      
      // Add the new message to the list
      setMessages(prevMessages => [...prevMessages, response.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getOtherUser = () => {
    if (!conversation || !currentUser) return null;
    
    return conversation.participants.find(
      participant => participant.id !== currentUser.id
    );
  };

  const renderHeader = () => {
    const otherUser = getOtherUser();
    
    return (
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        {otherUser ? (
          <>
            <Avatar sx={{ mr: 2 }}>
              {otherUser.first_name ? otherUser.first_name.charAt(0) : '?'}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="medium">
                {`${otherUser.first_name || ''} ${otherUser.last_name || ''}`.trim() || 'User'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {otherUser.email || otherUser.username || ''}
              </Typography>
            </Box>
          </>
        ) : (
          <Typography variant="subtitle1">Conversation</Typography>
        )}
      </Box>
    );
  };

  const renderMessageItem = (message, index) => {
    const isCurrentUser = message.sender === currentUser?.id;
    const showAvatar = index === 0 || messages[index - 1].sender !== message.sender;
    const otherUser = getOtherUser();
    
    return (
      <ListItem
        key={message.id}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
          p: 1
        }}
      >
        <MessageBubble 
          message={message}
          isCurrentUser={isCurrentUser}
          showAvatar={showAvatar}
          otherUser={otherUser}
        />
      </ListItem>
    );
  };

  // If no conversation is selected
  if (!conversationId) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          p: 3
        }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Select a conversation or start a new one
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choose an existing conversation from the list or create a new one
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
      {renderHeader()}

      {/* Messages area */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="error" gutterBottom>
              {error}
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={fetchMessages}
              sx={{ mt: 1 }}
            >
              Try Again
            </Button>
          </Box>
        ) : messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexGrow: 1
            }}
          >
            <Typography variant="body1" color="text.secondary">
              No messages yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Send a message to start the conversation
            </Typography>
          </Box>
        ) : (
          <List sx={{ width: '100%', p: 0 }}>
            {messages.map((message, index) => renderMessageItem(message, index))}
          </List>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message input */}
      <Box
        component="form"
        onSubmit={sendMessage}
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        <TextField
          fullWidth
          placeholder="Type a message..."
          value={newMessage}
          onChange={handleMessageChange}
          disabled={sending}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton 
                  type="submit"
                  color="primary"
                  disabled={!newMessage.trim() || sending}
                >
                  {sending ? <CircularProgress size={24} /> : <SendIcon />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>
    </Box>
  );
};

export default Conversation; 