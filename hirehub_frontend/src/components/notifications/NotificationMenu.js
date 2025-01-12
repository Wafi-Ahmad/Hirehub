import React, { useState } from 'react';
import {
    Menu,
    MenuItem,
    Typography,
    Box,
    Avatar,
    IconButton,
    Badge,
    Tooltip
} from '@mui/material';
import { 
    Notifications as NotificationsIcon,
    CheckCircleOutline as AcceptIcon,
    CancelOutlined as RejectIcon,
    MoreHoriz as IgnoreIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { formatTimeAgo } from '../../utils/dateUtils';

const NotificationMenu = () => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const { isAuthenticated } = useAuth();
    const { 
        notifications, 
        markAsRead, 
        loading,
        setNotifications,
        setUnreadCount,
        unreadCount,
        markAllAsRead
    } = useNotification();

    // Don't render anything if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    const handleClick = async (event) => {
        setAnchorEl(event.currentTarget);
        // Mark all as read when menu opens
        await markAllAsRead();
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = async (notification) => {
        try {
            await markAsRead(notification.id);
            
            // Handle navigation based on notification type
            switch (notification.notification_type) {
                case 'NEW_FOLLOWER':
                    // Only navigate if the notification is not pending
                    if (notification.status !== 'PENDING') {
                        navigate(`/profile/${notification.sender.id}`);
                    }
                    break;
                case 'CONNECTION_ACCEPTED':
                    navigate(`/profile/${notification.sender.id}`);
                    break;
                case 'NEW_POST':
                case 'POST_LIKE':
                case 'POST_COMMENT':
                case 'COMMENT_REPLY':
                case 'COMMENT_LIKE':
                    navigate('/', { 
                        state: { 
                            scrollToPostId: notification.related_object_id,
                            highlightPost: true
                        }
                    });
                    break;
                case 'NEW_JOB_POST':
                    navigate('/jobs');
                    break;
                case 'JOB_OFFER_INITIAL':
                case 'JOB_OFFER_REMINDER':
                    navigate(`/jobs/${notification.related_object_id}`);
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

    const handleFollowAction = async (notificationId, action) => {
        try {
            const response = await api.post(`/users/follow-request/${notificationId}/`, {
                action: action
            });
            
            // Update notification in the list
            setNotifications(prev => 
                prev.map(notif => 
                    notif.id === notificationId
                        ? { ...notif, status: response.data.status }
                        : notif
                )
            );
            
            toast.success(response.data.message);
        } catch (error) {
            console.error('Error handling follow request:', error);
            toast.error('Failed to process follow request');
        }
    };

    const renderFollowRequestActions = (notification) => {
        if (notification.notification_type !== 'NEW_FOLLOWER' || notification.status !== 'PENDING') {
            return null;
        }

        return (
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                <Tooltip title="Accept">
                    <IconButton
                        size="small"
                        color="success"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleFollowAction(notification.id, 'ACCEPT');
                        }}
                    >
                        <AcceptIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Reject">
                    <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleFollowAction(notification.id, 'REJECT');
                        }}
                    >
                        <RejectIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Ignore">
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleFollowAction(notification.id, 'IGNORE');
                        }}
                    >
                        <IgnoreIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        );
    };

    const renderNotificationContent = (notification) => {
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
                onClick={() => handleNotificationClick(notification)}
            >
                <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                    <Avatar 
                        src={notification.sender?.profile_picture} 
                        alt={notification.sender?.first_name}
                        sx={{
                            width: 40,
                            height: 40
                        }}
                    />
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">
                            <strong>
                                {notification.sender?.user_type === 'Company' 
                                    ? notification.sender?.company_name 
                                    : `${notification.sender?.first_name} ${notification.sender?.last_name}`}
                            </strong>
                            {' '}{notification.content}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block">
                            {formatTimeAgo(notification.created_at)}
                        </Typography>
                        {renderFollowRequestActions(notification)}
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