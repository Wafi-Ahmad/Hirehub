import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Avatar,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = React.useState(null);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleMobileMenu = (event) => setMobileMenuAnchor(event.currentTarget);
  
  const handleClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  const handleNavigate = (path) => {
    navigate(path);
    handleClose();
  };

  const menuItems = user?.token ? [
    { label: 'Home', path: '/' },
    { label: 'Profile', path: '/profile' },
    { label: 'Jobs', path: '/jobs' },
    { label: 'Network', path: '/network' },
  ] : [];

  const renderDesktopMenu = () => (
    <>
      {menuItems.map((item) => (
        <Button
          key={item.path}
          color="inherit"
          onClick={() => handleNavigate(item.path)}
          sx={{ ml: 2 }}
        >
          {item.label}
        </Button>
      ))}
      {user?.token ? (
        <>
          <IconButton
            onClick={handleMenu}
            sx={{ ml: 2 }}
            aria-controls="profile-menu"
            aria-haspopup="true"
          >
            <Avatar
              src={user?.profile_picture}
              alt={user?.first_name}
              sx={{ width: 32, height: 32 }}
            />
          </IconButton>
          <Menu
            id="profile-menu"
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
            <MenuItem onClick={() => handleNavigate('/profile')}>Profile</MenuItem>
            <MenuItem onClick={() => handleNavigate('/settings')}>Settings</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </>
      ) : (
        <>
          <Button color="inherit" onClick={() => navigate('/login')} sx={{ ml: 2 }}>
            Login
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => navigate('/register')}
            sx={{ ml: 2 }}
          >
            Register
          </Button>
        </>
      )}
    </>
  );

  const renderMobileMenu = () => (
    <>
      <IconButton
        edge="start"
        color="inherit"
        aria-label="menu"
        onClick={handleMobileMenu}
      >
        <MenuIcon />
      </IconButton>
      <Menu
        id="mobile-menu"
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleClose}
      >
        {menuItems.map((item) => (
          <MenuItem key={item.path} onClick={() => handleNavigate(item.path)}>
            {item.label}
          </MenuItem>
        ))}
        {user?.token ? (
          [
            <MenuItem key="profile" onClick={() => handleNavigate('/profile')}>
              Profile
            </MenuItem>,
            <MenuItem key="settings" onClick={() => handleNavigate('/settings')}>
              Settings
            </MenuItem>,
            <MenuItem key="logout" onClick={handleLogout}>
              Logout
            </MenuItem>,
          ]
        ) : (
          [
            <MenuItem key="login" onClick={() => handleNavigate('/login')}>
              Login
            </MenuItem>,
            <MenuItem key="register" onClick={() => handleNavigate('/register')}>
              Register
            </MenuItem>,
          ]
        )}
      </Menu>
    </>
  );

  return (
    <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'background.paper' }}>
      <Toolbar>
        {isMobile && renderMobileMenu()}
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            color: 'primary.main',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          HireHub
        </Typography>
        {!isMobile && renderDesktopMenu()}
      </Toolbar>
    </AppBar>
  );
};

export default Header; 