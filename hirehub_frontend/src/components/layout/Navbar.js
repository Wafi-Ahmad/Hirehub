import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar, 
  Typography, 
  Button,
  Tabs,
  Tab,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SearchBar from './SearchBar';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import WorkIcon from '@mui/icons-material/Work';
import { USER_TYPES } from '../../utils/permissions';
import NotificationMenu from '../notifications/NotificationMenu';
import { userService } from '../../services/userService';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
    navigate(`/profile/${user.id}`);
  };

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/') return 0;
    if (path.startsWith('/jobs')) return 1;
    if (path.startsWith('/network')) return 2;
    return 0;
  };

  const handleDeleteAccount = async () => {
    try {
      await userService.deleteAccount();
      handleClose();
      await logout();
      toast.success('Your account has been deleted successfully');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete account');
    }
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {/* Logo/Brand */}
        <Typography
          variant="h6"
          component="div"
          sx={{ 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
          onClick={() => navigate('/')}
        >
          <WorkIcon />
          HireHub
        </Typography>

        {isAuthenticated && (
          <Tabs 
            value={getActiveTab()} 
            sx={{ 
              ml: 4,
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-selected': {
                  color: '#fff'
                }
              }
            }}
          >
            <Tab label="Home" onClick={() => navigate('/')} />
            <Tab label="Jobs" onClick={() => navigate('/jobs')} />
            {/* <Tab label="Network" onClick={() => navigate('/network')} /> */}
          </Tabs>
        )}

        {/* Search Bar */}
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <SearchBar />
        </Box>

        {/* Auth Section */}
        {isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <NotificationMenu />
            {user?.userType === USER_TYPES.COMPANY && (
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate('/jobs/create')}
              >
                Post Job
              </Button>
            )}
            <IconButton
              onClick={handleMenu}
              color="inherit"
              size="large"
              edge="end"
            >
              {user?.profile_picture ? (
                <Avatar 
                  src={user.profile_picture}
                  alt={user.userType === USER_TYPES.COMPANY ? user.company_name : `${user.first_name} ${user.last_name}`}
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
              <MenuItem onClick={() => { handleClose(); navigate('/saved-jobs'); }}>Saved Jobs</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
              <MenuItem onClick={() => { handleClose(); setDeleteDialogOpen(true); }} sx={{ color: 'error.main' }}>
                Delete Account
              </MenuItem>
            </Menu>

            {/* Delete Account Confirmation Dialog */}
            <Dialog
              open={deleteDialogOpen}
              onClose={() => setDeleteDialogOpen(false)}
              aria-labelledby="delete-dialog-title"
              aria-describedby="delete-dialog-description"
            >
              <DialogTitle id="delete-dialog-title">
                Delete Account
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="delete-dialog-description">
                  Are you sure you want to delete your account? This action cannot be undone.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
                  Cancel
                </Button>
                <Button onClick={handleDeleteAccount} color="error" variant="contained">
                  Yes, Delete
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              color="inherit" 
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={() => navigate('/register')}
            >
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 