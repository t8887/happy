/**
 * useBadgeCount — keeps the app badge and notification badge in sync.
 *
 * Badge = total unread messages across all conversations.
 *
 * Call this hook once near the root of the authenticated app tree (e.g. in App.js
 * after login). It polls every 15s and updates the OS badge automatically.
 */
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const fetchUnreadCount = async () => {
  try {
    const { data } = await api.get('/messages/conversations');
    const conversations = data.data || [];
    return conversations.reduce((sum, conv) => sum + (conv.unread || 0), 0);
  } catch {
    return 0;
  }
};

export const useBadgeCount = () => {
  const { isAuthenticated } = useAuthStore();

  const { data: unread = 0 } = useQuery({
    queryKey: ['badge', 'unread'],
    queryFn: fetchUnreadCount,
    enabled: isAuthenticated && Platform.OS !== 'web',
    refetchInterval: 15000,
    staleTime: 10000,
  });

  useEffect(() => {
    if (Platform.OS === 'web') return;
    Notifications.setBadgeCountAsync(unread).catch(() => {});
  }, [unread]);
};
