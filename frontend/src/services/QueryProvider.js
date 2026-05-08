import React from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryPersister } from '../storage/queryPersister';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      // 2 min — stale data is shown immediately; background refetch fires when older
      staleTime:   1000 * 60 * 2,
      // 24h — dehydrated cache survives app restarts
      gcTime:      1000 * 60 * 60 * 24,
      // Return cached data even when offline instead of entering error state
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Queue mutations and retry when connection restored
      networkMode: 'offlineFirst',
    },
  },
});

export default function QueryProvider({ children }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge:    1000 * 60 * 60 * 24, // 24h — discard persisted cache after 1 day
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
