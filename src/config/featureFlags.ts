export interface FeatureFlags {
  productReviews: boolean;
  advancedSearch: boolean;
  productRecommendations: boolean;
  notifications: boolean;
  prescriptionUpload: boolean;
  liveChat: boolean;
  deliveryEnabled: boolean; // Controls all delivery-related features including wishlist and loyalty program
}

export const defaultFeatureFlags: FeatureFlags = {
  productReviews: true,
  advancedSearch: true,
  productRecommendations: true,
  notifications: true,
  prescriptionUpload: true,
  liveChat: false,
  deliveryEnabled: false, // Delivery is disabled by default
};