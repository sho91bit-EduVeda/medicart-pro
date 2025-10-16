export interface FeatureFlags {
  shoppingCart: boolean;
  orderManagement: boolean;
  productReviews: boolean;
  wishlist: boolean;
  advancedSearch: boolean;
  productRecommendations: boolean;
  notifications: boolean;
  bulkOrders: boolean;
  prescriptionUpload: boolean;
  liveChat: boolean;
  loyaltyProgram: boolean;
  guestCheckout: boolean;
}

export const defaultFeatureFlags: FeatureFlags = {
  shoppingCart: true,
  orderManagement: true,
  productReviews: true,
  wishlist: true,
  advancedSearch: true,
  productRecommendations: true,
  notifications: true,
  bulkOrders: true,
  prescriptionUpload: true,
  liveChat: false,
  loyaltyProgram: false,
  guestCheckout: true,
};