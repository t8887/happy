import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Returns { isOnline: boolean }.
 * Defaults to true (optimistic) until the first real check completes.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Immediate check on mount
    NetInfo.fetch().then((state) => {
      setIsOnline(!!state.isConnected);
    });

    // Subscribe to future changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
    });

    return unsubscribe;
  }, []);

  return { isOnline };
}
