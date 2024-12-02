import React, { createContext, useContext, useState, useCallback } from 'react';
import profileService from '../services/profileService';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  // State for the currently viewed profile (could be any user)
  const [profileData, setProfileData] = useState(null);
  // State specifically for the current user's profile
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [followData, setFollowData] = useState({ followers_count: 0, following_count: 0 });
  const [lastFetchedId, setLastFetchedId] = useState(null);

  const fetchProfileData = useCallback(async (userId = null) => {
    setLoading(true);
    setError(null);
    try {
      const [profileResponse, followResponse] = await Promise.all([
        profileService.getProfile(userId),
        profileService.getFollowData(userId)
      ]);
      
      if (userId) {
        // If fetching a specific user's profile
        setProfileData(profileResponse);
        setLastFetchedId(userId);
      } else {
        // If fetching current user's profile, update both states
        setProfileData(profileResponse);
        setCurrentUserProfile(profileResponse);
        setLastFetchedId(null);
      }
      setFollowData(followResponse);
    } catch (err) {
      console.error('Error in fetchProfileData:', err);
      setError(err.response?.data?.error || 'Failed to load profile data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Specific method to fetch current user's profile
  const fetchCurrentUserProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileResponse, followResponse] = await Promise.all([
        profileService.getProfile(),
        profileService.getFollowData()
      ]);
      
      setCurrentUserProfile(profileResponse);
      setFollowData(followResponse);
    } catch (err) {
      console.error('Error in fetchCurrentUserProfile:', err);
      setError(err.response?.data?.error || 'Failed to load profile data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

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

  const clearProfileData = useCallback(() => {
    setProfileData(null);
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
      updateProfile,
      clearProfileData,
      setProfileData
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