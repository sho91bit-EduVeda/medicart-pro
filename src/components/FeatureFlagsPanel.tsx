import { Switch } from "./ui/switch"
import { Label } from "./ui/label"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { useFeatureFlags } from "../hooks/useFeatureFlags"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AlertTriangle } from "lucide-react"

export function FeatureFlagsPanel() {
  const {
    productReviews,
    advancedSearch,
    productRecommendations,
    notifications,
    prescriptionUpload,
    liveChat,
    deliveryEnabled, // Controls all delivery-related features including wishlist and loyalty program
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

        {/* Delivery Toggle - Controls all delivery-related features including wishlist and loyalty program */}
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div>
            <Label htmlFor="delivery-enabled" className="text-primary">Delivery Service</Label>
            <p className="text-xs text-muted-foreground">Enable all delivery-related features (shopping cart, order management, bulk orders, guest checkout, wishlist, loyalty program)</p>
          </div>
          <Switch
            id="delivery-enabled"
            checked={deliveryEnabled}
            onCheckedChange={() => toggleFeature('deliveryEnabled')}
            className="data-[state=checked]:bg-primary"
          />
        </div>
        
        {/* Delivery Info Box */}
        {!deliveryEnabled && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-800">Delivery Features Disabled</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  When enabled, the following features will be activated:
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Shopping Cart</li>
                    <li>Order Management</li>
                    <li>Bulk Orders</li>
                    <li>Guest Checkout</li>
                    <li>Wishlist</li>
                    <li>Loyalty Program</li>
                  </ul>
                </p>
              </div>
            </div>
          </div>
        )}
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