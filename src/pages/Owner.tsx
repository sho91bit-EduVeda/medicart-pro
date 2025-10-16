import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FeatureFlagsPanel } from "@/components/FeatureFlagsPanel";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Plus, Percent, Package, Settings, MessageSquare } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { whatsappService } from "@/services/whatsappService";
import { ExcelUpload } from "@/components/ExcelUpload";

interface Category {
  id: string;
  name: string;
}

const Owner = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [loading, setLoading] = useState(false);

  // Product form state
  const [productName, setProductName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [uses, setUses] = useState("");
  const [sideEffects, setSideEffects] = useState("");
  const [composition, setComposition] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [inStock, setInStock] = useState(true);

  // WhatsApp settings state
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappApiKey, setWhatsappApiKey] = useState("");
  const [whatsappWebhookUrl, setWhatsappWebhookUrl] = useState("");
  const [whatsappActive, setWhatsappActive] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchCategories();
    fetchDiscount();
    fetchWhatsappSettings();
  }, []);

  const { isAuthenticated, checkAuth } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, navigate]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");

    if (error) {
      toast.error("Failed to load categories");
    } else {
      setCategories(data || []);
    }
  };

  const fetchDiscount = async () => {
    const { data, error } = await supabase
      .from("store_settings")
      .select("discount_percentage")
      .single();

    if (error) {
      toast.error("Failed to load discount settings");
    } else {
      setDiscountPercentage(data?.discount_percentage || 0);
    }
  };

  const { signOut } = useAuth();
  
  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("products").insert({
        name: productName,
        category_id: categoryId || null,
        description,
        uses,
        side_effects: sideEffects,
        composition,
        original_price: parseFloat(originalPrice),
        image_url: imageUrl || null,
        in_stock: inStock,
      });

      if (error) throw error;

      toast.success("Product added successfully!");
      // Reset form
      setProductName("");
      setCategoryId("");
      setDescription("");
      setUses("");
      setSideEffects("");
      setComposition("");
      setOriginalPrice("");
      setImageUrl("");
      setInStock(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDiscount = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("store_settings")
        .update({ discount_percentage: discountPercentage })
        .eq("id", (await supabase.from("store_settings").select("id").single()).data?.id);

      if (error) throw error;
      toast.success("Discount updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update discount");
    } finally {
      setLoading(false);
    }
  };

  const fetchWhatsappSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_settings")
        .select("*")
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setWhatsappPhone(data.phone_number);
        setWhatsappApiKey(data.api_key);
        setWhatsappWebhookUrl(data.webhook_url || "");
        setWhatsappActive(data.is_active);
      }
    } catch (error: any) {
      console.error("Failed to fetch WhatsApp settings:", error);
    }
  };

  const handleUpdateWhatsappSettings = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("whatsapp_settings")
        .upsert({
          phone_number: whatsappPhone,
          api_key: whatsappApiKey,
          webhook_url: whatsappWebhookUrl,
          is_active: whatsappActive,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      // Reinitialize WhatsApp service with new settings
      await whatsappService.initialize();
      
      toast.success("WhatsApp settings updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update WhatsApp settings");
    } finally {
      setLoading(false);
    }
  };

  const testWhatsappNotification = async () => {
    try {
      const success = await whatsappService.sendNotification(
        "🧪 Test Notification\n\n" +
        "This is a test message from your MediCart Pro system.\n" +
        "If you receive this, your WhatsApp integration is working correctly!\n\n" +
        `Time: ${new Date().toLocaleString()}`
      );
      
      if (success) {
        toast.success("Test notification sent successfully!");
      } else {
        toast.error("Failed to send test notification. Check your settings.");
      }
    } catch (error: any) {
      toast.error("Error sending test notification");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Owner Dashboard</h1>
              <p className="text-sm text-primary-foreground/90">Manage your medical store</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={() => navigate("/")} size="sm">
              View Store
            </Button>
            <Button variant="secondary" onClick={handleLogout} size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="products">
              <Plus className="w-4 h-4 mr-2" />
              Add Products
            </TabsTrigger>
            {/* <TabsTrigger value="bulk-upload">
              <ExcelUpload className="w-4 h-4 mr-2" />
              Bulk Upload
            </TabsTrigger> */}
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="whatsapp">
              <MessageSquare className="w-4 h-4 mr-2" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="features">
              <Settings className="w-4 h-4 mr-2" />
              Features
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Add New Product</CardTitle>
                <CardDescription>Add medicine details to your store inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g., Paracetamol 500mg"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief product description"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uses">Uses</Label>
                    <Textarea
                      id="uses"
                      value={uses}
                      onChange={(e) => setUses(e.target.value)}
                      placeholder="What is this medicine used for?"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="composition">Composition</Label>
                    <Textarea
                      id="composition"
                      value={composition}
                      onChange={(e) => setComposition(e.target.value)}
                      placeholder="Active ingredients and composition"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="side_effects">Side Effects</Label>
                    <Textarea
                      id="side_effects"
                      value={sideEffects}
                      onChange={(e) => setSideEffects(e.target.value)}
                      placeholder="Possible side effects"
                      rows={3}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Original Price (₹) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        placeholder="99.99"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="image">Image URL</Label>
                      <Input
                        id="image"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="in-stock"
                      checked={inStock}
                      onCheckedChange={setInStock}
                    />
                    <Label htmlFor="in-stock">In Stock</Label>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Adding..." : "Add Product"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk-upload">
            <ExcelUpload onSuccess={fetchCategories} />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Store Settings</CardTitle>
                <CardDescription>Configure store-wide discount percentage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Percent className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="discount" className="text-base font-semibold">
                        Global Discount Percentage
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Applied to all products in the store
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                      className="max-w-xs"
                    />
                    <span className="text-2xl font-bold text-primary">{discountPercentage}%</span>
                  </div>
                  <Button onClick={handleUpdateDiscount} disabled={loading}>
                    {loading ? "Updating..." : "Update Discount"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Feature Flags
                </CardTitle>
                <CardDescription>
                  Toggle various features of your store
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureFlagsPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  WhatsApp Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure WhatsApp notifications for medicine search alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-100">
                      <MessageSquare className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="whatsapp-active" className="text-base font-semibold">
                        Enable WhatsApp Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications when customers search for unavailable medicines
                      </p>
                    </div>
                    <Switch
                      id="whatsapp-active"
                      checked={whatsappActive}
                      onCheckedChange={setWhatsappActive}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp-phone">Phone Number</Label>
                      <Input
                        id="whatsapp-phone"
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(e.target.value)}
                        placeholder="+1234567890"
                        type="tel"
                      />
                      <p className="text-xs text-muted-foreground">
                        WhatsApp Business phone number (with country code)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp-api-key">API Key</Label>
                      <Input
                        id="whatsapp-api-key"
                        value={whatsappApiKey}
                        onChange={(e) => setWhatsappApiKey(e.target.value)}
                        placeholder="Your WhatsApp Business API Key"
                        type="password"
                      />
                      <p className="text-xs text-muted-foreground">
                        Facebook Graph API access token
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-webhook">Webhook URL (Optional)</Label>
                    <Input
                      id="whatsapp-webhook"
                      value={whatsappWebhookUrl}
                      onChange={(e) => setWhatsappWebhookUrl(e.target.value)}
                      placeholder="https://your-webhook-url.com"
                      type="url"
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional webhook URL for advanced integrations
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleUpdateWhatsappSettings} disabled={loading}>
                      {loading ? "Updating..." : "Update Settings"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={testWhatsappNotification}
                      disabled={!whatsappActive || !whatsappPhone || !whatsappApiKey}
                    >
                      Send Test Message
                    </Button>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Setup Instructions:</h4>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Create a WhatsApp Business account</li>
                      <li>Get your API key from Facebook Developer Console</li>
                      <li>Add your phone number with country code</li>
                      <li>Test the integration with the "Send Test Message" button</li>
                    </ol>
                    
                    <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                      <h5 className="font-semibold text-yellow-900 mb-2">🧪 Test Mode:</h5>
                      <p className="text-sm text-yellow-800">
                        Use "test_api_key" or any short key to enable test mode. 
                        Messages will be logged to console instead of sent via WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Owner;
