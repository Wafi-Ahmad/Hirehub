import React, { useState, useEffect } from 'react';
import {
    IconButton,
    Badge,
    Menu,
    MenuItem,
    Box,
    Typography,
    Avatar,
    Tooltip,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import BlockIcon from '@mui/icons-material/Block';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { formatTimeAgo } from '../../utils/dateUtils';
import { toast } from 'react-toastify';
import { useProfile } from '../../context/ProfileContext';

// Create a custom event for follow status updates
export const FOLLOW_STATUS_UPDATE_EVENT = 'followStatusUpdate';

export const emitFollowStatusUpdate = (userId, action) => {
    const event = new CustomEvent(FOLLOW_STATUS_UPDATE_EVENT, {
        detail: { userId, action }
    });
    window.dispatchEvent(event);
};

const NotificationMenu = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();
    const { fetchProfileData } = useProfile();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await userService.getNotifications();
                console.log('Raw notifications response:', response);
                
                // Extract notifications array from response
                const notificationsData = response.data.notifications || [];
                console.log('Notifications data:', notificationsData);
                
                setNotifications(notificationsData);
                setUnreadCount(response.data.unread_count || 0);
            } catch (error) {
                console.error('Error fetching notifications:', error);
                toast.error('Failed to fetch notifications');
            }
        };

        fetchNotifications();
        // Set up polling for new notifications
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds

        return () => clearInterval(interval);
    }, []);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = (notification, event) => {
        // Don't handle click if it's a follow request waiting for action
        if (notification.notification_type === 'NEW_FOLLOWER' && 
            notification.content === 'wants to follow you') {
            return;
        }

        // Handle navigation based on notification type
        switch (notification.notification_type) {
            case 'NEW_FOLLOWER':
                navigate(`/profile/${notification.sender?.id}`);
                handleClose();
                break;
            case 'CONNECTION_ACCEPTED':
                navigate(`/profile/${notification.sender?.id}`);
                handleClose();
                break;
            case 'NEW_JOB_POST':
                navigate(`/jobs/${notification.job_id}`);
                handleClose();
                break;
            default:
                handleClose();
        }
    };

    const handleFollowAction = async (notificationId, action) => {
        try {
            const notification = notifications.find(n => n.id === notificationId);
            const response = await userService.handleFollowRequest(notificationId, action);
            
            // Update notifications list immediately
            setNotifications(prevNotifications => 
                prevNotifications.filter(n => n.id !== notificationId)
            );

            // Emit event for real-time updates
            if (notification?.sender?.id) {
                emitFollowStatusUpdate(notification.sender.id, action);
            }

            // Get the current path and profile path
            const currentPath = window.location.pathname;
            const profilePath = `/profile/${notification?.sender?.id}`;
            
            // Handle UI updates based on action
            if (action === 'ACCEPT') {
                // Update profile data first
                await fetchProfileData(notification.sender.id);
                toast.success('Follow request accepted');
                // Navigate after profile data is updated
                if (currentPath !== profilePath) {
                    navigate(profilePath);
                }
            } else if (action === 'REJECT') {
                // Update profile data to show follow button
                if (currentPath === profilePath) {
                    await fetchProfileData(notification.sender.id);
                }
                toast.success('Follow request rejected');
            } else {
                // For ignore, just update if we're on the profile
                if (currentPath === profilePath) {
                    await fetchProfileData(notification.sender.id);
                }
                toast.success('Follow request ignored');
            }

            // Close the notification menu
            handleClose();
            
            // Refresh notifications list
            const updatedNotifications = await userService.getNotifications();
            setNotifications(updatedNotifications.data.notifications || []);
            setUnreadCount(updatedNotifications.data.unread_count || 0);

        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to handle follow request');
            console.error('Follow action error:', error);
        }
    };

    const renderFollowRequestActions = (notification) => {
        console.log('Rendering follow request actions for notification:', {
            id: notification.id,
            type: notification.notification_type,
            status: notification.status,
            content: notification.content,
            sender: notification.sender
        });
        
        // Check if this is a follow request that needs action buttons
        const isFollowRequest = notification.notification_type === 'NEW_FOLLOWER';
        const isWaitingForAction = notification.content === 'wants to follow you';
        const isPendingOrUndefined = !notification.status || notification.status === 'PENDING';
        
        console.log('Follow request conditions:', {
            isFollowRequest,
            isWaitingForAction,
            isPendingOrUndefined,
            shouldShowButtons: isFollowRequest && isWaitingForAction && isPendingOrUndefined
        });
        
        if (isFollowRequest && isWaitingForAction && isPendingOrUndefined) {
            console.log('Showing action buttons for notification:', notification.id);
            return (
                <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    mt: 1,
                    width: '100%',
                    justifyContent: 'flex-end',
                    borderTop: 1,
                    borderColor: 'divider',
                    pt: 1
                }}>
                    <Tooltip title="Accept">
                        <IconButton 
                            size="small" 
                            sx={{
                                color: 'success.main',
                                bgcolor: 'success.light',
                                '&:hover': {
                                    bgcolor: 'success.main',
                                    color: 'white'
                                }
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleFollowAction(notification.id, 'ACCEPT');
                            }}
                        >
                            <CheckCircleOutline fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Reject">
                        <IconButton 
                            size="small"
                            sx={{
                                color: 'error.main',
                                bgcolor: 'error.light',
                                '&:hover': {
                                    bgcolor: 'error.main',
                                    color: 'white'
                                }
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleFollowAction(notification.id, 'REJECT');
                            }}
                        >
                            <CancelOutlined fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Ignore Request">
                        <IconButton 
                            size="small"
                            sx={{
                                color: 'grey.600',
                                bgcolor: 'grey.100',
                                '&:hover': {
                                    bgcolor: 'grey.300',
                                    color: 'grey.900'
                                }
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleFollowAction(notification.id, 'IGNORE');
                            }}
                        >
                            <NotInterestedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            );
        }
        console.log('Not showing action buttons for notification:', notification.id);
        return null;
    };

    const renderNotificationContent = (notification) => {
        console.log('Rendering notification:', {
            id: notification.id,
            type: notification.notification_type,
            content: notification.content,
            sender: notification.sender,
            isFollowRequest: notification.notification_type === 'NEW_FOLLOWER',
            isWaitingForAction: notification.content === 'wants to follow you'
        });

        const followActions = renderFollowRequestActions(notification);
        console.log('Follow actions rendered:', !!followActions);

        const isActionableFollowRequest = 
            notification.notification_type === 'NEW_FOLLOWER' && 
            notification.content === 'wants to follow you';

        return (
            <MenuItem 
                key={notification.id}
                onClick={(e) => !isActionableFollowRequest && handleNotificationClick(notification, e)}
                sx={{ 
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    py: 1,
                    px: 2,
                    backgroundColor: notification.is_read ? 'inherit' : 'action.hover',
                    '&:hover': {
                        backgroundColor: notification.is_read ? 'action.hover' : 'action.selected'
                    },
                    cursor: isActionableFollowRequest ? 'default' : 'pointer'
                }}
            >
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    width: '100%'
                }}>
                    <Avatar 
                        src={notification.sender?.profile_picture} 
                        sx={{ width: 40, height: 40, mr: 1 }}
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
                        <Typography variant="caption" color="text.secondary">
                            {formatTimeAgo(notification.created_at)}
                        </Typography>
                    </Box>
                </Box>
                {followActions}
            </MenuItem>
        );
    };

    return (
        <>
            <IconButton
                color="inherit"
                onClick={handleClick}
                sx={{ ml: 2 }}
            >
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        maxHeight: 400,
                        width: '100%',
                        maxWidth: 360,
                        '& .MuiList-root': {
                            p: 0
                        }
                    }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6">Notifications</Typography>
                </Box>
                <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                    {notifications.length > 0 ? (
                        notifications.map((notification) => renderNotificationContent(notification))
                    ) : (
                        <MenuItem disabled>
                            <Typography variant="body2" color="text.secondary">
                                No notifications
                            </Typography>
                        </MenuItem>
                    )}
                </Box>
            </Menu>
        </>
    );
};

export default NotificationMenu; 