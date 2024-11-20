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
  Divider,
  ListItemIcon,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../../context/AuthContext';
import { isCompanyUser, isNormalUser } from '../../utils/permissions';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LogoutIcon from '@mui/icons-material/Logout';

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

  const getNavigationItems = () => {
    const items = [
      { label: 'Home', path: '/' },
    ];

    if (user) {
      if (isNormalUser(user.userType)) {
        items.push(
          { label: 'Find Jobs', path: '/jobs' },
          { label: 'My Applications', path: '/applications' },
          { label: 'Network', path: '/network' }
        );
      }

      if (isCompanyUser(user.userType)) {
        items.push(
          { label: 'Post Job', path: '/post-job' },
          { label: 'Candidates', path: '/candidates' },
          { label: 'Job Listings', path: '/my-listings' }
        );
      }

      items.push({ label: 'Profile', path: '/profile' });
    }

    return items;
  };

  const menuItems = getNavigationItems();

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
      {user ? (
        <>
          <IconButton
            onClick={handleMenu}
            sx={{ 
              ml: 2,
              border: '2px solid',
              borderColor: 'primary.main',
              padding: '4px'
            }}
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
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
          >
            <MenuItem onClick={() => handleNavigate('/profile')}>
              <Avatar src={user?.profile_picture} /> My Profile
            </MenuItem>
            <MenuItem onClick={() => handleNavigate('/dashboard')}>
              <Avatar /> Dashboard
            </MenuItem>
            <MenuItem onClick={() => handleNavigate('/settings')}>
              <Avatar /> Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleNavigate('/help')}>
              <ListItemIcon>
                <HelpOutlineIcon fontSize="small" />
              </ListItemIcon>
              Help Center
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              <Typography color="error">Logout</Typography>
            </MenuItem>
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