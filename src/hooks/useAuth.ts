import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  isAuthenticated: false,
  checkAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ isAuthenticated: !!session });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false });
  },
}));