import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, db } from '@/integrations/firebase/config';
import { doc, setDoc, deleteDoc, getDoc, getDocs, collection, query } from 'firebase/firestore';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product?: {
    name: string;
    original_price: number;
    image_url?: string;
    in_stock: boolean;
    requires_prescription?: boolean;
  };
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  loadCart: () => Promise<void>;
  getItemCount: () => number;
  getTotal: (discountPercentage: number) => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addItem: async (productId: string, quantity = 1) => {
        const user = auth.currentUser;

        if (!user) {
          toast.error('Please sign in to add items to cart');
          return;
        }

        set({ isLoading: true });
        try {
          const existingItem = get().items.find(item => item.product_id === productId);

          if (existingItem) {
            await get().updateQuantity(productId, existingItem.quantity + quantity);
            return;
          }

          // Fetch product details first
          const productDoc = await getDoc(doc(db, 'products', productId));
          if (!productDoc.exists()) {
            throw new Error('Product not found');
          }
          const productData = productDoc.data();

          const cartItemRef = doc(db, 'users', user.uid, 'cart', productId);
          await setDoc(cartItemRef, {
            product_id: productId,
            quantity,
            added_at: new Date().toISOString()
          });

          set(state => ({
            items: [...state.items, {
              id: productId,
              product_id: productId,
              quantity,
              product: productData as any
            }]
          }));

          toast.success('Added to cart');
        } catch (error: any) {
          toast.error('Failed to add item to cart');
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
          await deleteDoc(doc(db, 'users', user.uid, 'cart', productId));

          set(state => ({
            items: state.items.filter(item => item.product_id !== productId)
          }));

          toast.success('Removed from cart');
        } catch (error: any) {
          toast.error('Failed to remove item');
          console.error(error);
        } finally {
          set({ isLoading: false });
        }
      },

      updateQuantity: async (productId: string, quantity: number) => {
        if (quantity < 1) {
          await get().removeItem(productId);
          return;
        }

        const user = auth.currentUser;

        if (!user) return;

        set({ isLoading: true });
        try {
          const cartItemRef = doc(db, 'users', user.uid, 'cart', productId);
          await setDoc(cartItemRef, { quantity }, { merge: true });

          set(state => ({
            items: state.items.map(item =>
              item.product_id === productId ? { ...item, quantity } : item
            )
          }));
        } catch (error: any) {
          toast.error('Failed to update quantity');
          console.error(error);
        } finally {
          set({ isLoading: false });
        }
      },

      clearCart: async () => {
        const user = auth.currentUser;

        if (!user) return;

        set({ isLoading: true });
        try {
          const q = query(collection(db, 'users', user.uid, 'cart'));
          const snapshot = await getDocs(q);

          const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deletePromises);

          set({ items: [] });
        } catch (error: any) {
          toast.error('Failed to clear cart');
          console.error(error);
        } finally {
          set({ isLoading: false });
        }
      },

      loadCart: async () => {
        const user = auth.currentUser;

        if (!user) {
          set({ items: [] });
          return;
        }

        set({ isLoading: true });
        try {
          const q = query(collection(db, 'users', user.uid, 'cart'));
          const snapshot = await getDocs(q);

          const items = await Promise.all(snapshot.docs.map(async (cartDoc) => {
            const data = cartDoc.data();
            const productDoc = await getDoc(doc(db, 'products', data.product_id));
            const productData = productDoc.exists() ? productDoc.data() : null;

            return {
              id: cartDoc.id,
              product_id: data.product_id,
              quantity: data.quantity,
              product: productData as any
            };
          }));

          set({ items });
        } catch (error: any) {
          console.error('Failed to load cart:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotal: (discountPercentage: number) => {
        return get().items.reduce((total, item) => {
          const price = item.product?.original_price || 0;
          const discountedPrice = price * (1 - discountPercentage / 100);
          return total + (discountedPrice * item.quantity);
        }, 0);
      },
    }),
    {
      name: 'shopping-cart',
    }
  )
);
