import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const useConversationList = () => {
  return useQuery({
    queryKey: ['messages', 'conversations'],
    queryFn: async () => {
      const { data } = await api.get('/messages/conversations');
      return data.data;
    },
    refetchInterval: 10000, // poll every 10s for new conversations
  });
};

export const useConversation = (userId) => {
  return useQuery({
    queryKey: ['messages', 'conversation', userId],
    queryFn: async () => {
      const { data } = await api.get(`/messages/${userId}`);
      return data.data;
    },
    enabled: !!userId,
    refetchInterval: 3000, // poll every 3s for new messages
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ receiverId, content }) => {
      const { data } = await api.post('/messages/send', { receiverId, content });
      return data.data;
    },
    onSuccess: (_, { receiverId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversation', receiverId] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
    },
  });
};
