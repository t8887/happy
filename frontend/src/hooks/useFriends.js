import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const useSearchUsers = (query) => {
  return useQuery({
    queryKey: ['users', 'search', query],
    queryFn: async () => {
      const { data } = await api.get('/users/search', { params: { q: query } });
      return data.data;
    },
    enabled: query.length >= 2,
    staleTime: 30000,
  });
};

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (receiverId) => {
      const { data } = await api.post('/friends/request', { receiverId });
      return data.data;
    },
    onSuccess: (_, receiverId) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'search'] });
    },
  });
};

export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (friendshipId) => {
      const { data } = await api.post('/friends/accept', { friendshipId });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
};

export const useDeclineFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (friendshipId) => {
      const { data } = await api.post('/friends/decline', { friendshipId });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
};

export const useFriendList = () => {
  return useQuery({
    queryKey: ['friends', 'list'],
    queryFn: async () => {
      const { data } = await api.get('/friends/list');
      return data.data;
    },
  });
};

export const useFriendRequests = () => {
  return useQuery({
    queryKey: ['friends', 'requests'],
    queryFn: async () => {
      const { data } = await api.get('/friends/requests');
      return data.data;
    },
  });
};
