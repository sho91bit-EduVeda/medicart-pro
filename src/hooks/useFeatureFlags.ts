import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FeatureFlags, defaultFeatureFlags } from '../config/featureFlags';
import { db } from '@/integrations/firebase/config';
import { collection, query, where, getDocs, updateDoc, addDoc, writeBatch, doc } from 'firebase/firestore';

interface FeatureFlagsStore extends FeatureFlags {
  toggleFeature: (feature: keyof FeatureFlags) => void;
  resetFeatures: () => void;
  syncWithDatabase: () => Promise<void>;
  loadFromDatabase: () => Promise<void>;
}

const flagNameMapping: Record<keyof FeatureFlags, string> = {
  productReviews: 'product_reviews',
  advancedSearch: 'advanced_search',
  productRecommendations: 'product_recommendations',
  notifications: 'notifications',
  prescriptionUpload: 'prescription_upload',
  liveChat: 'live_chat',
  deliveryEnabled: 'delivery_enabled', // Controls all delivery-related features including wishlist and loyalty program
  storeClosed: 'store_closed', // Manual store closure flag
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
          const q = query(collection(db, 'feature_flags'), where('flag_name', '==', dbFlagName));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const docRef = querySnapshot.docs[0].ref;
            await updateDoc(docRef, { enabled: newValue });
          } else {
            // If it doesn't exist, create it (optional, but good for safety)
            await addDoc(collection(db, 'feature_flags'), {
              flag_name: dbFlagName,
              enabled: newValue
            });
          }
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

        const batch = writeBatch(db);

        // This is a bit complex because we need to find the doc ID for each flag name
        // For efficiency, we'll fetch all flags first
        try {
          const querySnapshot = await getDocs(collection(db, 'feature_flags'));
          const existingFlags = new Map(querySnapshot.docs.map(doc => [doc.data().flag_name, doc.ref]));

          for (const update of updates) {
            if (existingFlags.has(update.flag_name)) {
              batch.update(existingFlags.get(update.flag_name)!, { enabled: update.enabled });
            } else {
              const newDocRef = doc(collection(db, 'feature_flags'));
              batch.set(newDocRef, { flag_name: update.flag_name, enabled: update.enabled });
            }
          }
          await batch.commit();
        } catch (error) {
          console.error('Failed to sync feature flags:', error);
        }
      },
      loadFromDatabase: async () => {
        try {
          const querySnapshot = await getDocs(collection(db, 'feature_flags'));
          const data = querySnapshot.docs.map(doc => doc.data());

          const updates: Partial<FeatureFlags> = {};
          data.forEach((flag) => {
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