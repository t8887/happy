import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useFeed = () => {
  return useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const { data } = await api.get('/feed');
      return data;
    },
    staleTime: 1000 * 60 * 3, // 3 min — feed is slow-moving, use cache freely
  });
};

export const useStreak = () => {
  return useQuery({
    queryKey: ['streak'],
    queryFn: async () => {
      const { data } = await api.get('/streak');
      return data.streak; // { current, longest, lastActiveDate, xp }
    },
    staleTime: 1000 * 60 * 10, // 10 min — streak changes at most once per day
  });
};
