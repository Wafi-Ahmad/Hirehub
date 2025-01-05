import React, { useState } from 'react';
import {
    Menu,
    MenuItem,
    Typography,
    Box,
    Avatar,
    Button,
    IconButton,
    Badge
} from '@mui/material';
import { 
    Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { toast } from 'react-hot-toast';
import connectionService from '../../services/connectionService';
import { formatTimeAgo } from '../../utils/dateUtils';

const NotificationMenu = () => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const { 
        notifications, 
        markAsRead, 
        loading,
        setNotifications,
        setUnreadCount,
        unreadCount
    } = useNotification();

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = async (notification) => {
        try {
            await markAsRead(notification.id);
            
            // Handle navigation based on notification type
            switch (notification.notification_type) {
                case 'NEW_POST':
                case 'POST_LIKE':
                case 'POST_COMMENT':
                case 'COMMENT_REPLY':
                case 'COMMENT_LIKE':
                    // Navigate to home with the specific post ID
                    navigate('/', { 
                        state: { 
                            scrollToPostId: notification.related_object_id,
                            highlightPost: true
                        }
                    });
                    break;
                case 'CONNECTION_REQUEST':
                case 'CONNECTION_ACCEPTED':
                    navigate('/network');
                    break;
                case 'NEW_JOB_POST':
                    navigate('/jobs');
                    break;
                case 'NEW_FOLLOWER':
                    // Navigate to the follower's profile
                    navigate(`/profile/${notification.sender.id}`);
                    break;
                default:
                    navigate('/');
            }
            handleClose();
        } catch (error) {
            console.error('Error handling notification:', error);
            toast.error('Failed to process notification');
        }
    };

    const handleConnectionAction = async (requestId, action) => {
        try {
            await connectionService.handleRequest(requestId, action);
            // Remove the notification from the list
            setNotifications(prev =>
                prev.filter(notif => notif.related_object_id !== requestId)
            );
            // Update unread count if the notification was unread
            const wasUnread = notifications.find(
                notif => notif.related_object_id === requestId && !notif.is_read
            );
            if (wasUnread) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            toast.success(`Connection request ${action.toLowerCase()}ed`);
        } catch (error) {
            console.error(`Error ${action.toLowerCase()}ing connection request:`, error);
            toast.error(`Failed to ${action.toLowerCase()} connection request`);
        }
    };

    const renderNotificationContent = (notification) => {
        const isConnectionRequest = notification.notification_type === 'CONNECTION_REQUEST';
        
        return (
            <MenuItem
                key={notification.id}
                sx={{
                    py: 1,
                    px: 2,
                    backgroundColor: notification.is_read ? 'inherit' : 'action.hover',
                    cursor: 'pointer',
                    '&:hover': {
                        backgroundColor: notification.is_read ? 'action.hover' : 'action.selected'
                    }
                }}
                onClick={isConnectionRequest ? undefined : () => handleNotificationClick(notification)}
            >
                <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                    <Avatar src={notification.sender?.profile_picture} />
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">
                            <strong>{notification.sender?.first_name} {notification.sender?.last_name}</strong>
                            {' '}{notification.content}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: isConnectionRequest ? 1 : 0 }}>
                            {formatTimeAgo(notification.created_at)}
                        </Typography>
                        {isConnectionRequest && (
                            <Box sx={{ 
                                mt: 1, 
                                display: 'flex', 
                                gap: 1,
                                justifyContent: 'flex-end'
                            }}>
                                <Button
                                    size="small"
                                    variant="contained"
                                    color="primary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleConnectionAction(notification.related_object_id, 'ACCEPT');
                                    }}
                                >
                                    Accept
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleConnectionAction(notification.related_object_id, 'REJECT');
                                    }}
                                >
                                    Reject
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Box>
            </MenuItem>
        );
    };

    return (
        <>
            <IconButton color="inherit" onClick={handleClick}>
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                    sx: { width: 360, maxHeight: 500 }
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Typography variant="h6">Notifications</Typography>
                </Box>
                <Box sx={{ mt: 1, maxHeight: 400, overflowY: 'auto' }}>
                    {loading ? (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Typography>Loading notifications...</Typography>
                        </Box>
                    ) : notifications.length === 0 ? (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Typography>No notifications</Typography>
                        </Box>
                    ) : (
                        notifications.map((notification) => renderNotificationContent(notification))
                    )}
                </Box>
            </Menu>
        </>
    );
};

export default NotificationMenu; 