export interface FeatureFlags {
  advancedSearch: boolean;
  productComparison: boolean;
  stockStatus: boolean;
  reviews: boolean;
  quickAddToCart: boolean;
  wishlist: boolean;
  recentlyViewed: boolean;
  bulkOrder: boolean;
}

export const defaultFeatureFlags: FeatureFlags = {
  advancedSearch: true,
  productComparison: true,
  stockStatus: true,
  reviews: true,
  quickAddToCart: true,
  wishlist: true,
  recentlyViewed: true,
  bulkOrder: true,
};