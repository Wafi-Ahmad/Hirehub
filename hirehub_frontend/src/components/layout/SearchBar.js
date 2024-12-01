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
import axios from 'axios';

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
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/search-profiles/`, {
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
                    <ListItem
                      button
                      onClick={() => handleProfileClick(result.id)}
                      sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                    >
                      <ListItemAvatar>
                        <Avatar src={result.profile_picture} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${result.first_name} ${result.last_name}`}
                        secondary={result.current_work || 'No current position'}
                      />
                    </ListItem>
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