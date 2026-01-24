import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useFeatureFlags } from "../../hooks/useFeatureFlags"
import { useState } from "react"
import { toast } from "sonner"
import { AlertTriangle, Store, ShoppingBag, MessageCircle, Search } from "lucide-react"

export function FeatureFlagsPanel() {
  const {
    productReviews,
    advancedSearch,
    productRecommendations,
    notifications,
    prescriptionUpload,
    liveChat,
    deliveryEnabled, // Controls all in-store features including wishlist and loyalty program
    storeClosed, // Manual store closure flag
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

      <div className="space-y-6">
        {/* Core Shopping Features */}
        <div className="border rounded-lg p-4 bg-blue-50/30">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">Core Shopping Features</h3>
          </div>
          
          <div className="space-y-4 ml-2">
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
                <Label htmlFor="product-recommendations">Product Recommendations</Label>
                <p className="text-xs text-muted-foreground">AI-powered product suggestions</p>
              </div>
              <Switch
                id="product-recommendations"
                checked={productRecommendations}
                onCheckedChange={() => toggleFeature('productRecommendations')}
              />
            </div>
          </div>
        </div>

        {/* Search & Discovery */}
        <div className="border rounded-lg p-4 bg-green-50/30">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-800">Search & Discovery</h3>
          </div>
          
          <div className="space-y-4 ml-2">
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
          </div>
        </div>

        {/* Communication & Support */}
        <div className="border rounded-lg p-4 bg-purple-50/30">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-800">Communication & Support</h3>
          </div>
          
          <div className="space-y-4 ml-2">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Notifications</Label>
                <p className="text-xs text-muted-foreground">Push notifications for orders and medicine requests</p>
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
          </div>
        </div>

        {/* Store Operations */}
        <div className="border rounded-lg p-4 bg-amber-50/30">
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-800">Store Operations</h3>
          </div>
          
          <div className="space-y-4 ml-2">
            {/* In-Store Pickup Toggle - Controls all in-store features including wishlist and loyalty program */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="delivery-enabled" className="text-primary">In-Store Pickup Service</Label>
                <p className="text-xs text-muted-foreground">Enable all in-store features (order management, bulk orders, guest checkout, wishlist, loyalty program)</p>
              </div>
              <Switch
                id="delivery-enabled"
                checked={deliveryEnabled}
                onCheckedChange={() => toggleFeature('deliveryEnabled')}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            
            {/* Store Closed Toggle - Allows owner to manually mark store as closed */}
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Store className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <Label htmlFor="store-closed" className="text-orange-800">Manual Store Closure</Label>
                  <p className="text-xs text-orange-700 mt-1">
                    When enabled, the store will show as CLOSED regardless of time. 
                    Use this when the store is unexpectedly closed for the day.
                  </p>
                </div>
              </div>
              <Switch
                id="store-closed"
                checked={storeClosed}
                onCheckedChange={() => toggleFeature('storeClosed')}
                className="data-[state=checked]:bg-orange-600"
              />
            </div>
            
            {/* In-Store Info Box */}
            {!deliveryEnabled && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mt-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 text-sm">In-Store Features Disabled</h4>
                    <p className="text-xs text-yellow-700 mt-1">
                      When enabled, the following features will be activated:
                      <ul className="list-disc list-inside mt-1 space-y-1">
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