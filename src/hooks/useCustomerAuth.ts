import { create } from 'zustand';
import { auth, db } from '@/integrations/firebase/config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  User,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { toast } from 'sonner';

interface CustomerUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  emailVerified: boolean;
}

interface CustomerAuthState {
  user: CustomerUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean; // For customers, this will always be false
  initializeAuth: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string, 
    password: string, 
    fullName: string, 
    phone: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updateProfile: (data: { displayName?: string; phoneNumber?: string }) => Promise<void>;
}

export const useCustomerAuth = create<CustomerAuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  
  initializeAuth: () => {
    set({ isLoading: true });
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check unified users collection first
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Only set as authenticated if user is a customer
            if (userData.role === 'CUSTOMER' || userData.role === 'customer' || !userData.role) {
              set({
                user: {
                  uid: user.uid,
                  email: user.email,
                  displayName: userData.name || user.displayName,
                  phoneNumber: userData.phone || user.phoneNumber,
                  emailVerified: user.emailVerified
                },
                isAuthenticated: true,
                isLoading: false,
                isAdmin: false
              });
            } else {
              // User is not a customer (probably owner), set as unauthenticated
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                isAdmin: false
              });
            }
          } else {
            // Check customers collection for backward compatibility
            const customerDoc = await getDoc(doc(db, "customers", user.uid));
            if (customerDoc.exists()) {
              const customerData = customerDoc.data();
              set({
                user: {
                  uid: user.uid,
                  email: user.email,
                  displayName: customerData.name || user.displayName,
                  phoneNumber: customerData.phone || user.phoneNumber,
                  emailVerified: user.emailVerified
                },
                isAuthenticated: true,
                isLoading: false,
                isAdmin: false
              });
            } else {
              // User exists but no customer profile yet
              set({
                user: {
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName,
                  phoneNumber: user.phoneNumber,
                  emailVerified: user.emailVerified
                },
                isAuthenticated: true,
                isLoading: false,
                isAdmin: false
              });
            }
          }
        } catch (error) {
          console.error("Error fetching customer data:", error);
          set({
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              phoneNumber: user.phoneNumber,
              emailVerified: user.emailVerified
            },
            isAuthenticated: true,
            isLoading: false,
            isAdmin: false
          });
        }
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isAdmin: false
        });
      }
      unsubscribe();
    });
  },

  signIn: async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check user role from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Only allow customers to sign in through customer auth
        if (userData.role !== 'CUSTOMER' && userData.role !== 'customer' && userData.role) {
          throw new Error("Unauthorized: This account is not a customer account");
        }
        
        set({
          user: {
            uid: user.uid,
            email: user.email,
            displayName: userData.name || user.displayName,
            phoneNumber: userData.phone || user.phoneNumber,
            emailVerified: user.emailVerified
          },
          isAuthenticated: true,
          isLoading: false,
          isAdmin: false
        });
      } else {
        // Check customers collection for backward compatibility
        const customerDoc = await getDoc(doc(db, "customers", user.uid));
        if (customerDoc.exists()) {
          const customerData = customerDoc.data();
          set({
            user: {
              uid: user.uid,
              email: user.email,
              displayName: customerData.name || user.displayName,
              phoneNumber: customerData.phone || user.phoneNumber,
              emailVerified: user.emailVerified
            },
            isAuthenticated: true,
            isLoading: false,
            isAdmin: false
          });
        } else {
          // User exists but no customer profile yet
          set({
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              phoneNumber: user.phoneNumber,
              emailVerified: user.emailVerified
            },
            isAuthenticated: true,
            isLoading: false,
            isAdmin: false
          });
        }
      }
      
      toast.success("Successfully signed in!");
    } catch (error: any) {
      console.error("Sign in error:", error);
      let errorMessage = "Failed to sign in. Please try again.";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format.";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled.";
      } else if (error.message.includes("Unauthorized")) {
        errorMessage = "This account cannot be accessed through customer login. Please use owner login.";
      }
      
      toast.error(errorMessage);
      throw error;
    }
  },

  signUp: async (email: string, password: string, fullName: string, phone: string) => {
    try {
      // Validate inputs
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters long");
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create customer profile in Firestore
      await setDoc(doc(db, "customers", user.uid), {
        name: fullName,
        email: email,
        phone: phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Update user profile
      await updateDoc(doc(db, "users", user.uid), {
        name: fullName,
        phone: phone
      }).catch(() => {
        // If user doc doesn't exist, create it
        setDoc(doc(db, "users", user.uid), {
          name: fullName,
          phone: phone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });

      set({
        user: {
          uid: user.uid,
          email: user.email,
          displayName: fullName,
          phoneNumber: phone,
          emailVerified: user.emailVerified
        },
        isAuthenticated: true,
        isLoading: false,
        isAdmin: false
      });

      toast.success("Account created successfully!");
    } catch (error: any) {
      console.error("Sign up error:", error);
      let errorMessage = "Failed to create account. Please try again.";
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password must be at least 8 characters long.";
      } else if (error.message.includes("Password must be at least")) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      throw error;
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isAdmin: false
      });
      toast.success("Signed out successfully!");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out. Please try again.");
    }
  },

  forgotPassword: async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent. Please check your inbox.");
    } catch (error: any) {
      console.error("Forgot password error:", error);
      let errorMessage = "Failed to send password reset email. Please try again.";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      }
      
      toast.error(errorMessage);
    }
  },

  updateProfile: async (data: { displayName?: string; phoneNumber?: string }) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }

      // Update customer profile in Firestore
      await updateDoc(doc(db, "customers", currentUser.uid), {
        ...data,
        updated_at: new Date().toISOString()
      });

      set((state) => ({
        user: state.user ? {
          ...state.user,
          displayName: data.displayName || state.user.displayName,
          phoneNumber: data.phoneNumber || state.user.phoneNumber
        } : null,
        isAdmin: false
      }));

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error("Failed to update profile. Please try again.");
      throw error;
    }
  }
}));