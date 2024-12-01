import React from 'react';
import { AppBar, Toolbar, Box } from '@mui/material';
import SearchBar from './SearchBar';

const Navbar = () => {
  return (
    <AppBar position="fixed">
      <Toolbar>
        {/* Your logo/brand */}
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <SearchBar />
        </Box>
        {/* Your other toolbar items */}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 