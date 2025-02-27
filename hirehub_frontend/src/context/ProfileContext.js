import React, { createContext, useContext, useState, useCallback } from 'react';
import { userService } from '../services/userService';
import { profileService } from '../services/profileService';
import { toast } from 'react-hot-toast';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
    const [profileData, setProfileData] = useState(null);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [followData, setFollowData] = useState(null);

    const fetchProfileData = useCallback(async (userId = null) => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch profile data
            const profileResponse = await profileService.getProfile(userId);
            setProfileData(profileResponse);

            // Only fetch follow data if profile is public
            if (!profileResponse.is_profile_private) {
                try {
                    const followResponse = await profileService.getFollowData(userId);
                    setFollowData(followResponse);
                } catch (error) {
                    console.error('Error fetching follow data:', error);
                    // Don't set error state for follow data failure
                }
            }
        } catch (error) {
            console.error('Error in fetchProfileData:', error);
            // Handle private profiles
            if (error.response?.status === 403) {
                const privateProfileData = {
                    ...error.response?.data,
                    is_profile_public: false,
                    is_profile_private: true
                };
                setProfileData(privateProfileData);
                setFollowData(null); // Clear follow data for private profiles
            } else {
                setError(error.response?.data?.error || 'Failed to load profile data');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCurrentUserProfile = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch current user's profile data
            const profileResponse = await profileService.getProfile();
            setCurrentUserProfile(profileResponse);

            // Fetch follow data
            try {
                const followResponse = await profileService.getFollowData();
                setFollowData(followResponse);
            } catch (error) {
                console.error('Error fetching follow data:', error);
            }
        } catch (error) {
            console.error('Error in fetchCurrentUserProfile:', error);
            setError(error.response?.data?.error || 'Failed to load profile data');
        } finally {
            setLoading(false);
        }
    }, []);

    const updatePrivacy = async (settings) => {
        try {
            const response = await profileService.updatePrivacySettings(settings);
            setProfileData(prev => ({
                ...prev,
                ...response
            }));
            return response;
        } catch (error) {
            console.error('Error updating privacy settings:', error);
            throw error;
        }
    };

    const updateFollowData = (data) => {
        setFollowData(prev => ({
            ...prev,
            ...data
        }));
    };

    const updateProfile = async (formData) => {
        try {
            const response = await profileService.updateProfile(formData);
            setProfileData(prev => ({
                ...prev,
                ...response
            }));
            return response;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    };

    return (
        <ProfileContext.Provider value={{
            profileData,
            currentUserProfile,
            loading,
            error,
            followData,
            fetchProfileData,
            fetchCurrentUserProfile,
            setProfileData,
            updatePrivacy,
            updateFollowData,
            updateProfile
        }}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};

export default ProfileContext;