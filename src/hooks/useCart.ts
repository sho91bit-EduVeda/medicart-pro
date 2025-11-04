import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
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
        const { data: { user } } = await supabase.auth.getUser();

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

          const { data, error } = await supabase
            .from('shopping_cart')
            .insert([{ user_id: user.id, product_id: productId, quantity }])
            .select('*, products:product_id(name, original_price, image_url, in_stock, requires_prescription)')
            .single();

          if (error) throw error;

          set(state => ({
            items: [...state.items, { ...data, product: data.products as any }]
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
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        set({ isLoading: true });
        try {
          const { error } = await supabase
            .from('shopping_cart')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId);

          if (error) throw error;

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

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        set({ isLoading: true });
        try {
          const { error } = await supabase
            .from('shopping_cart')
            .update({ quantity })
            .eq('user_id', user.id)
            .eq('product_id', productId);

          if (error) throw error;

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
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        set({ isLoading: true });
        try {
          const { error } = await supabase
            .from('shopping_cart')
            .delete()
            .eq('user_id', user.id);

          if (error) throw error;

          set({ items: [] });
        } catch (error: any) {
          toast.error('Failed to clear cart');
          console.error(error);
        } finally {
          set({ isLoading: false });
        }
      },

      loadCart: async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          set({ items: [] });
          return;
        }

        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from('shopping_cart')
            .select('*, products:product_id(name, original_price, image_url, in_stock, requires_prescription)')
            .eq('user_id', user.id);

          if (error) throw error;

          set({ items: data.map(item => ({ ...item, product: item.products as any })) || [] });
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
