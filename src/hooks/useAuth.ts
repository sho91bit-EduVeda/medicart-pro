import { create } from 'zustand';
import { auth, db } from '@/integrations/firebase/config';
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  userName: string | null; // Add userName to the state
  isAdmin: boolean; // Flag to indicate if user is an admin/owner
  checkAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  userName: null, // Initialize userName as null
  isAdmin: false,
  checkAuth: async () => {
    set({ isLoading: true });
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          // If user is authenticated, try to fetch additional user info
          try {
            // Check unified users collection first
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const isAdmin = userData.role === 'OWNER' || userData.role === 'owner';
              set({ 
                isAuthenticated: true, 
                isLoading: false, 
                user,
                userName: userData.name || user.displayName || null,
                isAdmin
              });
            } else {
              // Check legacy users collection for backward compatibility
              const legacyUserDoc = await getDoc(doc(db, "users", user.uid));
              if (legacyUserDoc.exists()) {
                const userData = legacyUserDoc.data();
                const isAdmin = userData.role === 'OWNER' || userData.role === 'owner';
                set({ 
                  isAuthenticated: true, 
                  isLoading: false, 
                  user,
                  userName: userData.name || user.displayName || null,
                  isAdmin
                });
              } else {
                // Check customers collection for backward compatibility
                const customerDoc = await getDoc(doc(db, "customers", user.uid));
                if (customerDoc.exists()) {
                  const customerData = customerDoc.data();
                  set({ 
                    isAuthenticated: true, 
                    isLoading: false, 
                    user,
                    userName: customerData.name || user.displayName || null,
                    isAdmin: false
                  });
                } else {
                  // Fallback to displayName if no user document exists
                  set({ 
                    isAuthenticated: true, 
                    isLoading: false, 
                    user,
                    userName: user.displayName || null,
                    isAdmin: false
                  });
                }
              }
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            // Fallback to basic user info
            set({ 
              isAuthenticated: true, 
              isLoading: false, 
              user,
              userName: user.displayName || null,
              isAdmin: false
            });
          }
        } else {
          set({ isAuthenticated: false, isLoading: false, user: null, userName: null, isAdmin: false });
        }
        unsubscribe();
        resolve();
      });
    });
  },
  signOut: async () => {
    await firebaseSignOut(auth);
    set({ isAuthenticated: false, user: null, userName: null, isAdmin: false });
  },
}));