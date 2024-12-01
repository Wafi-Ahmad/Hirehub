import React from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Badge,
  Stack
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchBar from './SearchBar';
import ConnectionRequestsMenu from './ConnectionRequestsMenu';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user } = useAuth();

  return (
    <AppBar position="fixed" color="default" elevation={1}>
      <Toolbar>
        {/* Logo/Brand */}
        <Box sx={{ flexGrow: 0, display: { xs: 'none', md: 'flex' }, mr: 2 }}>
          HireHub
        </Box>

        {/* Search Bar - centered */}
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <SearchBar />
        </Box>

        {/* Right side icons */}
        <Stack direction="row" spacing={1}>
          <ConnectionRequestsMenu />
          <IconButton color="inherit">
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 