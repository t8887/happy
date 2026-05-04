import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useFeed = () => {
  return useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const { data } = await api.get('/feed');
      return data;
    },
  });
};

export const useStreak = () => {
  return useQuery({
    queryKey: ['streak'],
    queryFn: async () => {
      const { data } = await api.get('/streak');
      return data.streak; // { current, lastActiveDate, xp }
    },
    staleTime: 60 * 1000, // 1 minute — streak doesn't change that often
  });
};
