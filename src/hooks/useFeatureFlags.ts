import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FeatureFlags, defaultFeatureFlags } from '../config/featureFlags';

interface FeatureFlagsStore extends FeatureFlags {
  toggleFeature: (feature: keyof FeatureFlags) => void;
  resetFeatures: () => void;
}

export const useFeatureFlags = create<FeatureFlagsStore>()(
  persist(
    (set) => ({
      ...defaultFeatureFlags,
      toggleFeature: (feature) =>
        set((state) => ({
          [feature]: !state[feature],
        })),
      resetFeatures: () => set(defaultFeatureFlags),
    }),
    {
      name: 'feature-flags',
    }
  )
);