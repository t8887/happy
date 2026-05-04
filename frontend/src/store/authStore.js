import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import storage from './storage';

// Metro resolves ./storage to storage.web.js on web, storage.js (AsyncStorage) on native.
const zustandStorage = createJSONStorage(() => storage);

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hydrated: false,

      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      clearAuth: () => set({ user: null, token: null, isAuthenticated: false }),
      setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: 'lifefeed-auth',
      storage: zustandStorage,
      // Only persist these keys — don't persist _hydrated
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

export default useAuthStore;
