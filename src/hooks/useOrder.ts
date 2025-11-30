import { create } from 'zustand';
import { auth, db } from '@/integrations/firebase/config';
import { collection, addDoc, doc, updateDoc, getDocs, query, where, orderBy, writeBatch } from 'firebase/firestore';
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
    const user = auth.currentUser;

    if (!user) {
      toast.error('Please sign in to place an order');
      return null;
    }

    set({ isLoading: true });
    try {
      const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000000)}`;

      const orderData = {
        user_id: user.uid,
        order_number: orderNumber,
        total_amount: totalAmount,
        discount_applied: discountApplied,
        delivery_address: deliveryAddress,
        payment_method: paymentMethod,
        payment_status: 'pending',
        status: 'pending',
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Create order document
      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // Create order items subcollection
      const batch = writeBatch(db);
      items.forEach(item => {
        const itemRef = doc(collection(db, 'orders', orderRef.id, 'items'));
        batch.set(itemRef, {
          ...item,
          order_id: orderRef.id
        });
      });
      await batch.commit();

      const newOrder = { id: orderRef.id, ...orderData } as Order;
      set({ currentOrder: newOrder });
      toast.success('Order placed successfully!');
      return orderRef.id;
    } catch (error: any) {
      console.error('Order creation error:', error);
      toast.error('Failed to create order');
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  getUserOrders: async () => {
    const user = auth.currentUser;

    if (!user) {
      return [];
    }

    set({ isLoading: true });
    try {
      const q = query(
        collection(db, 'orders'),
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];

      return orders;
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
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status,
        updated_at: new Date().toISOString()
      });

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
