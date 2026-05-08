import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import storage from './storage';

// Wires React Query's cache to our storage layer (MMKV or AsyncStorage).
// Throttled to 1 write/second so rapid mutations don't spam storage.
export const queryPersister = createAsyncStoragePersister({
  storage,
  throttleTime: 1000,
});
