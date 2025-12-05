import { create } from 'zustand';
import { auth, db } from '@/integrations/firebase/config';
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  userName: string | null; // Add userName to the state
  checkAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  userName: null, // Initialize userName as null
  checkAuth: async () => {
    set({ isLoading: true });
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          // If user is authenticated, try to fetch additional user info
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              set({ 
                isAuthenticated: true, 
                isLoading: false, 
                user,
                userName: userData.name || user.displayName || null
              });
            } else {
              // Fallback to displayName if no user document exists
              set({ 
                isAuthenticated: true, 
                isLoading: false, 
                user,
                userName: user.displayName || null
              });
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            // Fallback to basic user info
            set({ 
              isAuthenticated: true, 
              isLoading: false, 
              user,
              userName: user.displayName || null
            });
          }
        } else {
          set({ isAuthenticated: false, isLoading: false, user: null, userName: null });
        }
        unsubscribe();
        resolve();
      });
    });
  },
  signOut: async () => {
    await firebaseSignOut(auth);
    set({ isAuthenticated: false, user: null, userName: null });
  },
}));