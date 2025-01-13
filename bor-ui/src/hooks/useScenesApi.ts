import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../utils/constants';

interface Scene {
  id: string;
  name: string;
  description?: string;
  // Add other scene properties as needed
}

export const useScenesQuery = () => {
  return useQuery<Scene[]>({
    queryKey: ['scenes'],
    queryFn: async () => {
      const url = `${API_URL}/api/scenes` 
      console.log('url', url);
      const { data } = await axios.get(url);

      console.log('data', data);
      return data;
    },
  });
};
