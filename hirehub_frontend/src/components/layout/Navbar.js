import React, { useState } from 'react';
import { AppBar, Toolbar, Box, IconButton, Menu, MenuItem, Avatar, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SearchBar from './SearchBar';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
    navigate('/login');
  };

  const handleProfile = () => {
    handleClose();
    navigate(`/profile/me`);
  };

  return (
    <AppBar position="fixed">
      <Toolbar>
        {/* Logo/Brand */}
        <Typography
          variant="h6"
          component="div"
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          HireHub
        </Typography>

        {/* Search Bar */}
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <SearchBar />
        </Box>

        {/* Auth Section */}
        {isAuthenticated ? (
          <Box>
            <IconButton
              onClick={handleMenu}
              color="inherit"
              size="large"
              edge="end"
            >
              {user?.profile_picture ? (
                <Avatar 
                  src={user.profile_picture}
                  alt={`${user.first_name} ${user.last_name}`}
                />
              ) : (
                <AccountCircleIcon />
              )}
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleProfile}>Profile</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box>
            <Button color="inherit" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button color="inherit" onClick={() => navigate('/register')}>
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 