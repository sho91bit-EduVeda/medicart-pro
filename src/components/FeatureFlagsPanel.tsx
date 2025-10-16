import { Switch } from "./ui/switch"
import { Label } from "./ui/label"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { useFeatureFlags } from "../hooks/useFeatureFlags"
import { supabase } from "@/integrations/supabase/client"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export function FeatureFlagsPanel() {
  const {
    shoppingCart,
    orderManagement,
    productReviews,
    wishlist,
    advancedSearch,
    productRecommendations,
    notifications,
    bulkOrders,
    prescriptionUpload,
    liveChat,
    loyaltyProgram,
    guestCheckout,
    toggleFeature,
    resetFeatures,
    syncWithDatabase
  } = useFeatureFlags()

  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      await syncWithDatabase()
      toast.success("Feature flags synced with database")
    } catch (error) {
      toast.error("Failed to sync feature flags")
      console.error(error)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Feature Flags</h2>
        <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm">
          {syncing ? "Syncing..." : "Sync with DB"}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="shopping-cart">Shopping Cart</Label>
            <p className="text-xs text-muted-foreground">Enable full shopping cart functionality</p>
          </div>
          <Switch
            id="shopping-cart"
            checked={shoppingCart}
            onCheckedChange={() => toggleFeature('shoppingCart')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="order-management">Order Management</Label>
            <p className="text-xs text-muted-foreground">Enable order placement and tracking</p>
          </div>
          <Switch
            id="order-management"
            checked={orderManagement}
            onCheckedChange={() => toggleFeature('orderManagement')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="product-reviews">Product Reviews & Ratings</Label>
            <p className="text-xs text-muted-foreground">Allow customers to review products</p>
          </div>
          <Switch
            id="product-reviews"
            checked={productReviews}
            onCheckedChange={() => toggleFeature('productReviews')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="wishlist">Wishlist / Favorites</Label>
            <p className="text-xs text-muted-foreground">Enable product wishlist feature</p>
          </div>
          <Switch
            id="wishlist"
            checked={wishlist}
            onCheckedChange={() => toggleFeature('wishlist')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="advanced-search">Advanced Search & Filters</Label>
            <p className="text-xs text-muted-foreground">Enhanced search with filters</p>
          </div>
          <Switch
            id="advanced-search"
            checked={advancedSearch}
            onCheckedChange={() => toggleFeature('advancedSearch')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="product-recommendations">Product Recommendations</Label>
            <p className="text-xs text-muted-foreground">AI-powered product suggestions</p>
          </div>
          <Switch
            id="product-recommendations"
            checked={productRecommendations}
            onCheckedChange={() => toggleFeature('productRecommendations')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="notifications">Notifications</Label>
            <p className="text-xs text-muted-foreground">Push notifications for orders and stock</p>
          </div>
          <Switch
            id="notifications"
            checked={notifications}
            onCheckedChange={() => toggleFeature('notifications')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="bulk-orders">Bulk Orders</Label>
            <p className="text-xs text-muted-foreground">Enable bulk ordering functionality</p>
          </div>
          <Switch
            id="bulk-orders"
            checked={bulkOrders}
            onCheckedChange={() => toggleFeature('bulkOrders')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="prescription-upload">Prescription Upload</Label>
            <p className="text-xs text-muted-foreground">Allow prescription uploads for medicines</p>
          </div>
          <Switch
            id="prescription-upload"
            checked={prescriptionUpload}
            onCheckedChange={() => toggleFeature('prescriptionUpload')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="live-chat">Live Chat Support</Label>
            <p className="text-xs text-muted-foreground">Enable live chat assistance</p>
          </div>
          <Switch
            id="live-chat"
            checked={liveChat}
            onCheckedChange={() => toggleFeature('liveChat')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="loyalty-program">Loyalty Program</Label>
            <p className="text-xs text-muted-foreground">Enable loyalty points and rewards</p>
          </div>
          <Switch
            id="loyalty-program"
            checked={loyaltyProgram}
            onCheckedChange={() => toggleFeature('loyaltyProgram')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="guest-checkout">Guest Checkout</Label>
            <p className="text-xs text-muted-foreground">Allow checkout without account</p>
          </div>
          <Switch
            id="guest-checkout"
            checked={guestCheckout}
            onCheckedChange={() => toggleFeature('guestCheckout')}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={resetFeatures}
          variant="outline"
          size="sm"
        >
          Reset to Defaults
        </Button>
      </div>
    </Card>
  )
}
