// Web shim for @react-native-async-storage/async-storage
// Matches the AsyncStorage API so zustand/middleware persist works on web.
const AsyncStorageWeb = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
  mergeItem: (key, value) => {
    const existing = localStorage.getItem(key);
    const merged = existing
      ? JSON.stringify({ ...JSON.parse(existing), ...JSON.parse(value) })
      : value;
    return Promise.resolve(localStorage.setItem(key, merged));
  },
  clear: () => { localStorage.clear(); return Promise.resolve(); },
  getAllKeys: () => Promise.resolve(Object.keys(localStorage)),
};

export default AsyncStorageWeb;
