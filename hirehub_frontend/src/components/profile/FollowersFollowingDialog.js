import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Typography,
  Button,
  Box,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { toast } from 'react-toastify';

const FollowersFollowingDialog = ({ open, onClose, userId, initialTab = 'followers' }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [data, setData] = useState({ followers: [], following: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await userService.getFollowersFollowing(userId);
        setData(response);
      } catch (error) {
        console.error('Error fetching followers/following:', error);
        toast.error('Failed to load followers/following data');
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchData();
    }
  }, [userId, open]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFollow = async (targetUserId) => {
    try {
      await userService.followUser(targetUserId);
      // Refresh the data
      const response = await userService.getFollowersFollowing(userId);
      setData(response);
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    }
  };

  const handleUnfollow = async (targetUserId) => {
    try {
      await userService.followUser(targetUserId); // Same endpoint handles both follow/unfollow
      // Refresh the data
      const response = await userService.getFollowersFollowing(userId);
      setData(response);
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user');
    }
  };

  const handleProfileClick = (profileId) => {
    navigate(`/profile/${profileId}`);
    onClose();
  };

  const renderUserList = (users) => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      );
    }

    if (!users.length) {
      return (
        <Box p={3} textAlign="center">
          <Typography color="textSecondary">
            {activeTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
          </Typography>
        </Box>
      );
    }

    return (
      <List>
        {users.map((user) => {
          // Determine display name based on user type
          let displayName = 'Unknown User';
          if (user.user_type === 'Company') {
            displayName = user.company_name || 'Unnamed Company';
          } else {
            // Only combine first and last name if at least one exists
            const firstName = user.first_name || '';
            const lastName = user.last_name || '';
            displayName = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : 'Unnamed User';
          }

          return (
            <ListItem
              key={user.id}
              secondaryAction={
                user.is_following !== undefined && (
                  <Button
                    variant={user.is_following ? "outlined" : "contained"}
                    size="small"
                    startIcon={user.is_following ? <PersonRemoveIcon /> : <PersonAddIcon />}
                    onClick={() => user.is_following ? handleUnfollow(user.id) : handleFollow(user.id)}
                  >
                    {user.is_following ? 'Unfollow' : 'Follow'}
                  </Button>
                )
              }
            >
              <ListItemAvatar>
                <Avatar
                  src={user.profile_picture}
                  onClick={() => handleProfileClick(user.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  {/* Show first letter of name as fallback */}
                  {displayName.charAt(0)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography
                    variant="subtitle2"
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                    onClick={() => handleProfileClick(user.id)}
                  >
                    {displayName}
                  </Typography>
                }
                secondary={user.current_work || user.industry || 'No current work information'}
              />
            </ListItem>
          );
        })}
      </List>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Followers" value="followers" />
            <Tab label="Following" value="following" />
          </Tabs>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {renderUserList(activeTab === 'followers' ? data.followers : data.following)}
      </DialogContent>
    </Dialog>
  );
};

export default FollowersFollowingDialog; 