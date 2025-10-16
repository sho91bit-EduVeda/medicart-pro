import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WishlistStore {
  items: string[];
  isLoading: boolean;
  addItem: (productId: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  toggleItem: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  loadWishlist: () => Promise<void>;
}

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addItem: async (productId: string) => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          toast.error('Please sign in to add to wishlist');
          return;
        }

        set({ isLoading: true });
        try {
          const { error } = await supabase
            .from('wishlist')
            .insert([{ user_id: user.id, product_id: productId }]);

          if (error) throw error;

          set(state => ({
            items: [...state.items, productId]
          }));

          toast.success('Added to wishlist');
        } catch (error: any) {
          if (error.code === '23505') {
            toast.info('Already in wishlist');
          } else {
            toast.error('Failed to add to wishlist');
            console.error(error);
          }
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (productId: string) => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        set({ isLoading: true });
        try {
          const { error } = await supabase
            .from('wishlist')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId);

          if (error) throw error;

          set(state => ({
            items: state.items.filter(id => id !== productId)
          }));

          toast.success('Removed from wishlist');
        } catch (error: any) {
          toast.error('Failed to remove from wishlist');
          console.error(error);
        } finally {
          set({ isLoading: false });
        }
      },

      toggleItem: async (productId: string) => {
        const isInWishlist = get().isInWishlist(productId);
        if (isInWishlist) {
          await get().removeItem(productId);
        } else {
          await get().addItem(productId);
        }
      },

      isInWishlist: (productId: string) => {
        return get().items.includes(productId);
      },

      loadWishlist: async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          set({ items: [] });
          return;
        }

        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from('wishlist')
            .select('product_id')
            .eq('user_id', user.id);

          if (error) throw error;

          set({ items: data?.map(item => item.product_id) || [] });
        } catch (error: any) {
          console.error('Failed to load wishlist:', error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'wishlist',
    }
  )
);
