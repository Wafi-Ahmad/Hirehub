import React, { useState, useRef } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Popper,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  ClickAwayListener,
  CircularProgress,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import api from '../../services/api';
import {API_BASE_URL} from '../../config';
import LockIcon from '@mui/icons-material/Lock';

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const navigate = useNavigate();

  const handleSearch = debounce(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setOpen(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/users/search-profiles/`, {
        params: { query }
      });
      
      // Handle both array results and "No results found" message
      if (Array.isArray(response.data)) {
        setSearchResults(response.data);
        setOpen(true);
      } else if (response.data.message === "No results found.") {
        setSearchResults([]);
        setOpen(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, 300);

  const handleChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    handleSearch(value);
  };

  const handleClear = () => {
    setSearchTerm('');
    setSearchResults([]);
    setOpen(false);
  };

  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
    handleClear();
  };

  const handleClickAway = () => {
    setOpen(false);
  };

  const renderSearchResult = (result) => {
    const displayName = result.user_type === 'Company' 
      ? result.company_name 
      : `${result.first_name} ${result.last_name}`;
    
    const subtitle = result.user_type === 'Company'
      ? result.industry || 'No industry information'
      : result.current_work || 'No current position';

    return (
      <ListItem
        button
        onClick={() => handleProfileClick(result.id)}
        sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
      >
        <ListItemAvatar>
          <Avatar src={result.profile_picture}>
            {result.first_name?.charAt(0)}{result.last_name?.charAt(0)}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography>{displayName}</Typography>
              {!result.is_profile_public && (
                <LockIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              )}
            </Box>
          }
          secondary={
            <Typography variant="body2" color="text.secondary">
              {result.is_profile_public ? subtitle : 'Private Profile'}
            </Typography>
          }
        />
      </ListItem>
    );
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: 'relative', width: { xs: '100%', sm: 400 } }}>
        <TextField
          ref={anchorRef}
          value={searchTerm}
          onChange={handleChange}
          placeholder="Search profiles..."
          size="small"
          fullWidth
          sx={{
            backgroundColor: 'background.paper',
            borderRadius: 1,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'divider',
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {loading ? (
                  <CircularProgress size={20} />
                ) : searchTerm && (
                  <IconButton size="small" onClick={handleClear}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </InputAdornment>
            ),
          }}
        />
        <Popper
          open={open}
          anchorEl={anchorRef.current}
          placement="bottom-start"
          style={{ width: anchorRef.current?.offsetWidth, zIndex: 1400 }}
        >
          <Paper elevation={3} sx={{ mt: 1, maxHeight: 400, overflow: 'auto' }}>
            <List>
              {searchResults.length === 0 ? (
                <ListItem>
                  <ListItemText 
                    primary={
                      <Typography color="text.secondary">
                        No results found
                      </Typography>
                    }
                  />
                </ListItem>
              ) : (
                searchResults.map((result, index) => (
                  <React.Fragment key={result.id || index}>
                    {renderSearchResult(result)}
                    {index < searchResults.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

export default SearchBar; 