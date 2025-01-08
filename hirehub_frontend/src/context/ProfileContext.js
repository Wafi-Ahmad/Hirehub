import React, { createContext, useContext, useState, useCallback } from 'react';
import { userService } from '../services/userService';
import { profileService } from '../services/profileService';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [profileData, setProfileData] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [followData, setFollowData] = useState({ followers_count: 0, following_count: 0 });
  const [lastFetchedId, setLastFetchedId] = useState(null);

  const fetchFollowData = useCallback(async (userId = null) => {
    try {
      const response = await userService.getProfileStats(userId);
      setFollowData(response.data);
    } catch (err) {
      console.error('Error fetching follow data:', err);
      setError(err.response?.data?.error || 'Failed to load follow data');
    }
  }, []);

  const fetchProfileData = useCallback(async (userId = null) => {
    setLoading(true);
    setError(null);
    try {
      const profileResponse = await profileService.getProfile(userId);
      
      // Normalize the profile data
      const normalizedData = {
        ...profileResponse,
        user_type: profileResponse.user_type || profileResponse.userType,
        company_name: profileResponse.company_name || profileResponse.companyName
      };
      
      await fetchFollowData(userId);
      
      if (userId) {
        setProfileData(normalizedData);
        setLastFetchedId(userId);
      } else {
        setProfileData(normalizedData);
        setCurrentUserProfile(normalizedData);
        setLastFetchedId(null);
      }
    } catch (err) {
      console.error('Error in fetchProfileData:', err);
      setError(err.response?.data?.error || 'Failed to load profile data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFollowData]);

  const fetchCurrentUserProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profileResponse = await profileService.getProfile();
      await fetchFollowData();
      
      setCurrentUserProfile(profileResponse);
      setProfileData(profileResponse);
    } catch (err) {
      console.error('Error in fetchCurrentUserProfile:', err);
      setError(err.response?.data?.error || 'Failed to load profile data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFollowData]);

  const updateProfile = useCallback(async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedProfile = await profileService.updateProfile(formData);
      setProfileData(updatedProfile);
      setCurrentUserProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      console.error('Error in updateProfile:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFollowData = useCallback((newFollowData) => {
    setFollowData(prev => ({
      ...prev,
      ...newFollowData
    }));
  }, []);

  const clearProfileData = useCallback(() => {
    setProfileData(null);
    setCurrentUserProfile(null);
    setFollowData({ followers_count: 0, following_count: 0 });
    setLastFetchedId(null);
  }, []);

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
      updateFollowData,
      fetchFollowData,
      clearProfileData,
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