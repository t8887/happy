import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNetworkStatus } from './useNetworkStatus';
import { flushSyncQueue } from '../storage/syncQueue';

/**
 * Watches network status and flushes the offline sync queue
 * automatically whenever the device transitions from offline → online.
 *
 * Mount this once at the top of the app (inside QueryProvider).
 */
export function useSyncQueue() {
  const { isOnline }  = useNetworkStatus();
  const queryClient   = useQueryClient();
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (isOnline && wasOfflineRef.current) {
      // Coming back online — replay queued mutations
      flushSyncQueue(queryClient).catch(() => {
        // Silent failure; items stay in queue for next reconnect
      });
    }
    wasOfflineRef.current = !isOnline;
  }, [isOnline]);
}
