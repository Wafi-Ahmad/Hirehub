import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  InputAdornment,
  CircularProgress,
  Box,
  Divider
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import api from '../../utils/api';

const NewConversationDialog = ({ open, onClose, onSelectUser, currentUser, isCreating }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && query.trim().length >= 2) {
      searchUsers();
    }
  }, [query, open]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setUsers([]);
      setError('');
    }
  }, [open]);

  const searchUsers = async () => {
    if (query.trim().length < 2) return;
    
    setLoading(true);
    try {
      console.log('Searching users with query:', query);
      const response = await api.get(`/api/messaging/search-users/?q=${encodeURIComponent(query)}`);
      console.log('Search results:', response.data);
      
      // Filter out current user from results
      const filteredUsers = response.data.filter(
        user => currentUser && user.id !== currentUser.id
      );
      setUsers(filteredUsers);
      setError('');
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users. Make sure your Django backend is running correctly.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (event) => {
    setQuery(event.target.value);
  };

  const handleUserSelect = (userId) => {
    onSelectUser(userId);
  };

  const getUserInitials = (user) => {
    if (!user.first_name && !user.last_name) return '?';
    
    const firstInitial = user.first_name ? user.first_name.charAt(0) : '';
    const lastInitial = user.last_name ? user.last_name.charAt(0) : '';
    
    return (firstInitial + lastInitial).toUpperCase();
  };

  const getUserFullName = (user) => {
    if (!user.first_name && !user.last_name) return 'Unknown User';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        New Conversation
      </DialogTitle>
      
      <DialogContent dividers>
        <TextField
          autoFocus
          margin="dense"
          placeholder="Search for users..."
          type="text"
          fullWidth
          value={query}
          onChange={handleQueryChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: loading && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            )
          }}
          helperText={query.length === 1 ? "Enter at least 2 characters to search" : ""}
          disabled={isCreating}
        />
        
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
        
        {isCreating && (
          <Box sx={{ py: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography color="textSecondary">
              Creating conversation...
            </Typography>
          </Box>
        )}
        
        {!isCreating && users.length === 0 && query.length >= 2 && !loading && !error && (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              No users found matching "{query}"
            </Typography>
          </Box>
        )}
        
        {!isCreating && users.length > 0 && (
          <List sx={{ mt: 2 }}>
            {users.map((user, index) => (
              <React.Fragment key={user.id}>
                <ListItem 
                  button 
                  onClick={() => handleUserSelect(user.id)}
                  sx={{ py: 1.5 }}
                  disabled={isCreating}
                >
                  <ListItemAvatar>
                    <Avatar>
                      {getUserInitials(user)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={getUserFullName(user)}
                    secondary={user.email || user.username}
                  />
                </ListItem>
                {index < users.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
        
        {!isCreating && !query && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="textSecondary">
              Search for users to start a conversation
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary" disabled={isCreating}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewConversationDialog; 