import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  // List of routes where Navbar should not be shown
  const noNavbarRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
  
  // Check if current route should show navbar
  const shouldShowNavbar = isAuthenticated && !noNavbarRoutes.includes(location.pathname);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {shouldShowNavbar && <Navbar />}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: shouldShowNavbar ? 8 : 0, // Add padding top only when navbar is shown
          pb: 3,
          px: 2
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 