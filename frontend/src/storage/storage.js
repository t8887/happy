// MMKV when native modules are available (dev build / production).
// Falls back to AsyncStorage transparently in Expo Go.

let storage;

try {
  const { MMKV } = require('react-native-mmkv');
  const mmkv = new MMKV({ id: 'happy-app' });

  storage = {
    // Async interface expected by React Query persister
    getItem:    (key)        => Promise.resolve(mmkv.getString(key) ?? null),
    setItem:    (key, value) => { mmkv.set(key, value); return Promise.resolve(); },
    removeItem: (key)        => { mmkv.delete(key); return Promise.resolve(); },

    // Sync helpers for direct reads (e.g. offline queue, initial hydration)
    getString: (key)        => mmkv.getString(key) ?? null,
    setString: (key, value) => mmkv.set(key, value),
    deleteKey: (key)        => mmkv.delete(key),

    isMMKV: true,
  };
} catch {
  // Expo Go — MMKV native module not linked, use AsyncStorage
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const memCache = {};

  storage = {
    getItem:    (key)        => AsyncStorage.getItem(key),
    setItem:    (key, value) => AsyncStorage.setItem(key, value),
    removeItem: (key)        => AsyncStorage.removeItem(key),

    // Sync helpers keep an in-memory shadow; also persist async in background
    getString: (key)        => memCache[key] ?? null,
    setString: (key, value) => { memCache[key] = value; AsyncStorage.setItem(key, value); },
    deleteKey: (key)        => { delete memCache[key]; AsyncStorage.removeItem(key); },

    isMMKV: false,
  };
}

export default storage;
