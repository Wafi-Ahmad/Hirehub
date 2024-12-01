import React, { createContext, useContext, useState, useCallback } from 'react';
import profileService from '../services/profileService';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [followData, setFollowData] = useState({ counts: {}, followers: [], following: [] });

  const fetchProfileData = useCallback(async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const profileResponse = await profileService.getCurrentProfile();
      const followResponse = await profileService.getFollowData();
      
      setProfileData(profileResponse);
      setFollowData(followResponse);
    } catch (err) {
      console.error('Error in fetchProfileData:', err);
      setError(err.response?.data?.error || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ProfileContext.Provider value={{
      profileData,
      loading,
      error,
      followData,
      fetchProfileData,
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