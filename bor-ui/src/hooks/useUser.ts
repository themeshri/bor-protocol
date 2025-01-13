import { API_URL } from '../utils/constants';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface UserProfile {
  // Add your user profile type definitions here
  publicKey: string;
  // ... other fields
}

export const useUser = (publicKey: string | undefined) => {
  return useQuery({
    queryKey: ['user', publicKey],
    queryFn: async () => {
      if (!publicKey) return null;
      const { data } = await axios.get<UserProfile>(`${API_URL}/api/user-profile/${publicKey}`);
      return data;
    },
    enabled: !!publicKey, // Only run query if publicKey exists
  });
};