import { createContext, useContext, useState, useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';
import { API_URL } from '../utils/constants';

interface UserProfile {
  handle: string;
  pfp: string;
}

interface UserContextType {
  userProfile: UserProfile | null;
  updateProfile: (profile: UserProfile) => void;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Query for fetching user profile
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['userProfile', "ff"],//@voir
   
    enabled: true,
    retry: false, // Don't retry on failure
  });

  // Effect to handle profile data changes
  useEffect(() => {
    if (!isLoading) {
      if (data) {
        setUserProfile(data);
        setShowProfileModal(false);
      } 
    }
  }, [data, isLoading]);

  // Effect to reset state when wallet disconnects


  const updateProfile = async (profile: UserProfile) => {

    try {
      // First, try to fetch the existing profile
      const checkResponse = await fetch(`${API_URL}/api/user-profile/ff`);//@voir
      const method = checkResponse.status === 404 ? 'POST' : 'PUT';
      const endpoint = method === 'POST' 
        ? `${API_URL}/api/user-profile`
        : `${API_URL}/api/user-profile/ff`;//@voir

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...profile,
          publicKey: "ff",//@voir
          }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Handle already taken');
        }
        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();
      setUserProfile(updatedProfile);
      setShowProfileModal(false);
      
      // Refetch profile data to ensure consistency
      refetch();
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.message === 'Handle already taken' 
        ? 'This handle is already taken. Please choose another one.'
        : 'Failed to update profile';
      window.showToast?.(errorMessage, 'error');
    }
  };

  return (
    <UserContext.Provider
      value={{
        userProfile,
        updateProfile,
        showProfileModal,
        setShowProfileModal,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}