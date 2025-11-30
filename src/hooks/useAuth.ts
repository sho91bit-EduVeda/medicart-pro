import { create } from 'zustand';
import { auth } from '@/integrations/firebase/config';
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  checkAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  checkAuth: async () => {
    set({ isLoading: true });
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        set({ isAuthenticated: !!user, isLoading: false, user });
        unsubscribe();
        resolve();
      });
    });
  },
  signOut: async () => {
    await firebaseSignOut(auth);
    set({ isAuthenticated: false, user: null });
  },
}));