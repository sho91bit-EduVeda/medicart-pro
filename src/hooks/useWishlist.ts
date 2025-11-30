import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, db } from '@/integrations/firebase/config';
import { doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
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
        const user = auth.currentUser;

        if (!user) {
          toast.error('Please sign in to add to wishlist');
          return;
        }

        set({ isLoading: true });
        try {
          const wishlistRef = doc(db, 'users', user.uid, 'wishlist', productId);
          await setDoc(wishlistRef, {
            product_id: productId,
            added_at: new Date().toISOString()
          });

          set(state => ({
            items: [...state.items, productId]
          }));

          toast.success('Added to wishlist');
        } catch (error: any) {
          toast.error('Failed to add to wishlist');
          console.error(error);
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (productId: string) => {
        const user = auth.currentUser;

        if (!user) return;

        set({ isLoading: true });
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'wishlist', productId));

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
        const user = auth.currentUser;

        if (!user) {
          set({ items: [] });
          return;
        }

        set({ isLoading: true });
        try {
          const querySnapshot = await getDocs(collection(db, 'users', user.uid, 'wishlist'));
          const items = querySnapshot.docs.map(doc => doc.id);

          set({ items });
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
