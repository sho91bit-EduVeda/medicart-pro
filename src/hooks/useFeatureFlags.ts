import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FeatureFlags, defaultFeatureFlags } from '../config/featureFlags';
import { supabase } from '@/integrations/supabase/client';

interface FeatureFlagsStore extends FeatureFlags {
  toggleFeature: (feature: keyof FeatureFlags) => void;
  resetFeatures: () => void;
  syncWithDatabase: () => Promise<void>;
  loadFromDatabase: () => Promise<void>;
}

const flagNameMapping: Record<keyof FeatureFlags, string> = {
  shoppingCart: 'shopping_cart',
  orderManagement: 'order_management',
  productReviews: 'product_reviews',
  wishlist: 'wishlist',
  advancedSearch: 'advanced_search',
  productRecommendations: 'product_recommendations',
  notifications: 'notifications',
  bulkOrders: 'bulk_orders',
  prescriptionUpload: 'prescription_upload',
  liveChat: 'live_chat',
  loyaltyProgram: 'loyalty_program',
  guestCheckout: 'guest_checkout',
};

export const useFeatureFlags = create<FeatureFlagsStore>()(
  persist(
    (set, get) => ({
      ...defaultFeatureFlags,
      toggleFeature: async (feature) => {
        const newValue = !get()[feature];
        set({ [feature]: newValue });

        const dbFlagName = flagNameMapping[feature];
        try {
          const { error } = await supabase
            .from('feature_flags')
            .update({ enabled: newValue })
            .eq('flag_name', dbFlagName);

          if (error) throw error;
        } catch (error) {
          console.error('Failed to update feature flag in database:', error);
        }
      },
      resetFeatures: () => set(defaultFeatureFlags),
      syncWithDatabase: async () => {
        const state = get();
        const updates = Object.entries(flagNameMapping).map(([key, dbName]) => ({
          flag_name: dbName,
          enabled: state[key as keyof FeatureFlags],
        }));

        for (const update of updates) {
          try {
            const { error } = await supabase
              .from('feature_flags')
              .update({ enabled: update.enabled })
              .eq('flag_name', update.flag_name);

            if (error) throw error;
          } catch (error) {
            console.error(`Failed to sync ${update.flag_name}:`, error);
          }
        }
      },
      loadFromDatabase: async () => {
        try {
          const { data, error } = await supabase
            .from('feature_flags')
            .select('flag_name, enabled');

          if (error) throw error;

          const updates: Partial<FeatureFlags> = {};
          data?.forEach((flag) => {
            const localKey = Object.entries(flagNameMapping).find(
              ([_, dbName]) => dbName === flag.flag_name
            )?.[0] as keyof FeatureFlags;

            if (localKey) {
              updates[localKey] = flag.enabled;
            }
          });

          set(updates);
        } catch (error) {
          console.error('Failed to load feature flags from database:', error);
        }
      },
    }),
    {
      name: 'feature-flags',
    }
  )
);
