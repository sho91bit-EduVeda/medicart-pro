import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  subtotal: number;
}

interface DeliveryAddress {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  discount_applied: number;
  delivery_address: DeliveryAddress;
  payment_method: string;
  payment_status: string;
  notes?: string;
  created_at: string;
}

interface OrderStore {
  currentOrder: Order | null;
  isLoading: boolean;
  createOrder: (
    items: OrderItem[],
    deliveryAddress: DeliveryAddress,
    totalAmount: number,
    discountApplied: number,
    paymentMethod: string,
    notes?: string
  ) => Promise<string | null>;
  getUserOrders: () => Promise<Order[]>;
  updateOrderStatus: (orderId: string, status: string) => Promise<boolean>;
  clearCurrentOrder: () => void;
}

export const useOrder = create<OrderStore>((set) => ({
  currentOrder: null,
  isLoading: false,

  createOrder: async (
    items,
    deliveryAddress,
    totalAmount,
    discountApplied,
    paymentMethod,
    notes
  ) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error('Please sign in to place an order');
      return null;
    }

    set({ isLoading: true });
    try {
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: totalAmount,
          discount_applied: discountApplied,
          delivery_address: deliveryAddress,
          payment_method: paymentMethod,
          payment_status: 'pending',
          status: 'pending',
          notes: notes || null
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
          items.map(item => ({
            order_id: orderData.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percentage: item.discount_percentage,
            subtotal: item.subtotal
          }))
        );

      if (itemsError) throw itemsError;

      set({ currentOrder: orderData });
      toast.success('Order placed successfully!');
      return orderData.id;
    } catch (error: any) {
      console.error('Order creation error:', error);
      toast.error('Failed to create order');
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  getUserOrders: async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Order status updated');
      return true;
    } catch (error: any) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order status');
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  clearCurrentOrder: () => {
    set({ currentOrder: null });
  },
}));
