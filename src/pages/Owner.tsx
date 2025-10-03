import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Plus, Percent, Package, Settings, Upload } from "lucide-react";
import { Switch } from "@/components/ui/switch";
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

  useEffect(() => {
    checkAuth();
    fetchCategories();
    fetchDiscount();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="products">
              <Plus className="w-4 h-4 mr-2" />
              Add Products
            </TabsTrigger>
            <TabsTrigger value="bulk-upload">
              <Upload className="w-4 h-4 mr-2" />
              Bulk Upload
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
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
        </Tabs>
      </div>
    </div>
  );
};

export default Owner;
