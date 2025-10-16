import { Switch } from "./ui/switch"
import { Label } from "./ui/label"
import { Card } from "./ui/card"
import { useFeatureFlags } from "../hooks/useFeatureFlags"

export function FeatureFlagsPanel() {

  const {
    advancedSearch,
    productComparison,
    stockStatus,
    reviews,
    quickAddToCart,
    wishlist,
    recentlyViewed,
    bulkOrder,
    toggleFeature,
    resetFeatures
  } = useFeatureFlags()

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Feature Flags</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="advanced-search">Advanced Search &amp; Filters</Label>
          <Switch
            id="advanced-search"
            checked={advancedSearch}
            onCheckedChange={() => toggleFeature('advancedSearch')}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="product-comparison">Product Comparison</Label>
          <Switch
            id="product-comparison"
            checked={productComparison}
            onCheckedChange={() => toggleFeature('productComparison')}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="stock-status">Stock Status</Label>
          <Switch
            id="stock-status"
            checked={stockStatus}
            onCheckedChange={() => toggleFeature('stockStatus')}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="reviews">Reviews &amp; Ratings</Label>
          <Switch
            id="reviews"
            checked={reviews}
            onCheckedChange={() => toggleFeature('reviews')}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="quick-add-to-cart">Quick Add to Cart</Label>
          <Switch
            id="quick-add-to-cart"
            checked={quickAddToCart}
            onCheckedChange={() => toggleFeature('quickAddToCart')}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="wishlist">Wishlist / Favorites</Label>
          <Switch
            id="wishlist"
            checked={wishlist}
            onCheckedChange={() => toggleFeature('wishlist')}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="recently-viewed">Recently Viewed</Label>
          <Switch
            id="recently-viewed"
            checked={recentlyViewed}
            onCheckedChange={() => toggleFeature('recentlyViewed')}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="bulk-order">Bulk Order Options</Label>
          <Switch
            id="bulk-order"
            checked={bulkOrder}
            onCheckedChange={() => toggleFeature('bulkOrder')}
          />
        </div>
      </div>

      <button
        onClick={resetFeatures}
        className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
      >
        Reset to Defaults
      </button>
    </Card>
  )
}