{/* Basic Info */}
<Box sx={{ textAlign: 'center', mt: 2 }}>
    <Typography variant="h5" gutterBottom>
        {`${profileData?.first_name} ${profileData?.last_name}`}
    </Typography>

    {/* Lock Icon */}
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
        <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="body1" color="text.secondary">
            This account is private
        </Typography>
    </Box>

    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Follow this account to see their profile and posts
    </Typography>

    {/* Follow Button with States */}
    <Box sx={{ mt: 3, pointerEvents: 'auto' }}>
        {profileData?.follow_status === 'PENDING' && (
            <Button
                variant="outlined"
                startIcon={<HourglassEmptyIcon />}
                onClick={handleUnfollow}
                color="warning"
                sx={{ zIndex: 1 }}
            >
                Cancel Request
            </Button>
        )}
        {profileData?.follow_status === 'REJECTED' && (
            <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={handleFollow}
            >
                Follow
            </Button>
        )}
        {!profileData?.follow_status && (
            <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={handleFollow}
            >
                Follow
            </Button>
        )}
    </Box>
</Box>

const handleUnfollow = async () => {
    console.log('handleUnfollow called', { id, profileData });
    try {
        const userId = id || profileData?.id;
        if (!userId) {
            toast.error('User ID not found');
            return;
        }

        console.log('Making unfollow request for user:', userId);
        const response = await userService.followUser(userId);
        console.log('Unfollow response:', response.data);
        
        const { is_following, followers_count, following_count, message } = response.data;
        
        // Update profile data
        setProfileData(prev => ({
            ...prev,
            is_following,
            follow_status: null // Reset follow status when unfollowing or canceling request
        }));

        // Update follow counts if they are provided
        if (followers_count !== undefined && following_count !== undefined) {
            updateFollowData({ followers_count, following_count });
        }
        
        // Show appropriate success message based on the action
        const successMessage = profileData?.follow_status === 'PENDING' 
            ? 'Follow request cancelled successfully'
            : 'Successfully unfollowed user';
        toast.success(message || successMessage);
    } catch (error) {
        console.error('Unfollow error details:', error.response?.data);
        const errorMessage = profileData?.follow_status === 'PENDING'
            ? 'Failed to cancel follow request'
            : 'Failed to unfollow user';
        toast.error(error.response?.data?.error || errorMessage);
        console.error('Unfollow error:', error);
    }
}; 