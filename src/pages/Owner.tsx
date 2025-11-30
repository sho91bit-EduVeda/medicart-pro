import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/integrations/firebase/config";
import { collection, getDocs, addDoc, doc, getDoc, setDoc, query, orderBy, deleteDoc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FeatureFlagsPanel } from "@/components/FeatureFlagsPanel";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { LogOut, Plus, Percent, Package, Settings, MessageSquare, Database, Store, AlertTriangle, Truck, Trash, Pencil, Mail } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ExcelUpload } from "@/components/ExcelUpload";
import { seedDatabase } from "@/utils/seedData";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import SidebarBackground from "@/components/svgs/SidebarBackground";
import RequestMedicineSheet from "@/components/RequestMedicineSheet";

interface Category {
  id: string;
  name: string;
}

interface MedicineRequest {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  medicine_name: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
}

const Owner = () => {
  const navigate = useNavigate();
  const { deliveryEnabled } = useFeatureFlags();
  const [categories, setCategories] = useState<Category[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Navigation state
  const [activeSection, setActiveSection] = useState("manage-products");

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | "in-stock" | "out-of-stock">("all");

  // Medicine requests state
  const [requests, setRequests] = useState<MedicineRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Filter products based on search and filter criteria
  const filteredProducts = products.filter(product => {
    try {
      // Search filter
      const matchesSearch = product.name && product.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = selectedCategoryFilter === "all" || selectedCategoryFilter === "" || product.category_id === selectedCategoryFilter;
      
      // Stock status filter
      const matchesStockStatus = stockStatusFilter === "all" || 
        (stockStatusFilter === "in-stock" && product.in_stock) || 
        (stockStatusFilter === "out-of-stock" && !product.in_stock);
      
      return matchesSearch && matchesCategory && matchesStockStatus;
    } catch (error) {
      console.error("Error filtering products:", error);
      return true; // Show all products if there's an error
    }
  });

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
    // fetchWhatsappSettings(); // Removed WhatsApp settings fetch
  }, []);

  // Fetch products when products section is active
  useEffect(() => {
    if (activeSection === "manage-products") {
      fetchProducts();
    }
  }, [activeSection]);

  // Fetch orders when orders section is active
  useEffect(() => {
    if (activeSection === "orders") {
      fetchOrders();
    }
  }, [activeSection]);

  // Fetch products when manage-products section is active
  useEffect(() => {
    if (activeSection === "manage-products") {
      fetchProducts();
    }
  }, [activeSection]);

  const { isAuthenticated, isLoading, checkAuth, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "categories"));
      const categoriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];

      // Sort categories by name
      categoriesData.sort((a, b) => a.name.localeCompare(b.name));

      setCategories(categoriesData);
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const q = query(
        collection(db, "products"),
        orderBy("name")
      );
      
      const querySnapshot = await getDocs(q);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));
      
      setProducts(productsData);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load products");
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchDiscount = async () => {
    try {
      const docRef = doc(db, "settings", "store");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setDiscountPercentage(docSnap.data().discount_percentage || 0);
      }
    } catch (error) {
      console.error("Failed to load discount settings:", error);
      toast.error("Failed to load discount settings");
    }
  };

  const fetchMedicineRequests = async () => {
    setRequestsLoading(true);
    try {
      const q = query(
        collection(db, "medicine_requests"),
        orderBy("created_at", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const requestsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as MedicineRequest[];
      
      setRequests(requestsData);
    } catch (error) {
      console.error("Failed to fetch medicine requests:", error);
      toast.error("Failed to load medicine requests");
    } finally {
      setRequestsLoading(false);
    }
  };

  // Fetch medicine requests when requests section is active
  useEffect(() => {
    if (activeSection === "requests") {
      fetchMedicineRequests();
    }
  }, [activeSection]);

  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    try {
      await deleteDoc(doc(db, "products", productId));
      toast.success(`"${productName}" deleted successfully!`);
      // Refresh product list
      fetchProducts();
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error("Failed to delete product");
    }
  };

  const handleDeleteRequest = async (requestId: string, medicineName: string) => {
    try {
      await deleteDoc(doc(db, "medicine_requests", requestId));
      toast.success(`Request for "${medicineName}" deleted successfully!`);
      // Refresh requests list
      fetchMedicineRequests();
    } catch (error) {
      console.error("Failed to delete request:", error);
      toast.error("Failed to delete request");
    }
  };

  const handleUpdateStock = async (productId: string, newQuantity: number) => {
    try {
      const productRef = doc(db, "products", productId);
      await updateDoc(productRef, {
        stock_quantity: newQuantity,
        in_stock: newQuantity > 0, // Automatically set in_stock based on quantity
        updated_at: new Date().toISOString()
      });
      
      toast.success("Stock updated successfully!");
      // Refresh product list to show updated stock
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to update stock");
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProductId(product.id);
    setProductName(product.name || "");
    setCategoryId(product.category_id || "");
    setDescription(product.description || "");
    setUses(product.uses || "");
    setSideEffects(product.side_effects || "");
    setComposition(product.composition || "");
    setOriginalPrice(product.original_price?.toString() || "");
    setImageUrl(product.image_url || "");
    setInStock(product.in_stock !== undefined ? product.in_stock : true);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategoryFilter("all");
    setStockStatusFilter("all");
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    resetForm();
  };

  const resetForm = () => {
    setProductName("");
    setCategoryId("");
    setDescription("");
    setUses("");
    setSideEffects("");
    setComposition("");
    setOriginalPrice("");
    setImageUrl("");
    setInStock(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductId) return;

    // Validate required fields
    if (!productName.trim()) {
      toast.error("Product name is required");
      return;
    }
    
    if (!categoryId) {
      toast.error("Category is required");
      return;
    }
    
    if (!originalPrice || parseFloat(originalPrice) <= 0) {
      toast.error("Valid original price is required");
      return;
    }

    setLoading(true);

    try {
      const productRef = doc(db, "products", editingProductId);
      await updateDoc(productRef, {
        name: productName,
        category_id: categoryId,
        description,
        uses,
        side_effects: sideEffects,
        composition,
        original_price: parseFloat(originalPrice),
        image_url: imageUrl || null,
        in_stock: inStock,
        updated_at: new Date().toISOString()
      });

      toast.success("Product updated successfully!");
      setEditingProductId(null);
      resetForm();
      // Refresh product list
      fetchProducts();
      // Navigate back to manage products section
      setActiveSection("manage-products");
    } catch (error: any) {
      toast.error(error.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!productName.trim()) {
      toast.error("Product name is required");
      return;
    }
    
    if (!categoryId) {
      toast.error("Category is required");
      return;
    }
    
    if (!originalPrice || parseFloat(originalPrice) <= 0) {
      toast.error("Valid original price is required");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "products"), {
        name: productName,
        category_id: categoryId,
        description,
        uses,
        side_effects: sideEffects,
        composition,
        original_price: parseFloat(originalPrice),
        image_url: imageUrl || null,
        in_stock: inStock,
        stock_quantity: inStock ? 10 : 0, // Default stock quantity
        created_at: new Date().toISOString()
      });

      toast.success("Product added successfully!");
      // Reset form
      resetForm();
      // Refresh product list
      fetchProducts();
      // Navigate back to manage products section
      setActiveSection("manage-products");
    } catch (error: any) {
      toast.error(error.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDiscount = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "settings", "store");
      await setDoc(docRef, {
        discount_percentage: discountPercentage,
        updated_at: new Date().toISOString()
      }, { merge: true });

      toast.success("Discount updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update discount");
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const q = query(
        collection(db, "orders"),
        orderBy("created_at", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));
      
      setOrders(ordersData);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  };

  // Navigation items
  const navigationItems = [
    { id: "add-product", label: "Add Product", icon: Plus },
    { id: "manage-products", label: "Manage Products", icon: Package },
    { id: "orders", label: "Orders", icon: Package },
    { id: "requests", label: "Medicine Requests", icon: Mail },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "features", label: "Features", icon: Package },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Owner Dashboard</h1>
                <p className="text-sm text-primary-foreground/90">Manage your medical store</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={seedDatabase} className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Seed DB</span>
              </Button>
              <Button variant="default" onClick={() => navigate("/")} className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                <span className="hidden sm:inline">View Store</span>
              </Button>
              <Button variant="destructive" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-sidebar-background border-r p-4 hidden md:block relative overflow-hidden">
          <SidebarBackground />
          <div className="relative z-10 space-y-3">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "default" : "ghost"}
                  className="w-full justify-start gap-3 py-6 text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
                  onClick={() => setActiveSection(item.id)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {/* Delivery Status Banner */}
            {!deliveryEnabled && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Delivery Service Disabled</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Medicine delivery is currently disabled. Enable it in the Feature Flags section when you're ready to start deliveries.
                  </p>
                  <Button 
                    variant="link" 
                    className="text-yellow-800 p-0 h-auto font-normal mt-2"
                    onClick={() => setActiveSection("features")}
                  >
                    Go to Feature Flags →
                  </Button>
                </div>
              </div>
            )}

            {/* Mobile Navigation */}
            <div className="md:hidden mb-6">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={activeSection === item.id ? "default" : "outline"}
                      size="sm"
                      className="flex-shrink-0 flex items-center gap-2"
                      onClick={() => setActiveSection(item.id)}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Content Sections */}
            {(activeSection === "add-product" || activeSection === "manage-products") && (
              <div className="space-y-8">
                {/* Add/Edit Product Form - Only shown in Add Product section or when editing */}
                {(activeSection === "add-product" || editingProductId) && (
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle className="text-2xl">{editingProductId ? "Edit Product" : "Add New Product"}</CardTitle>
                      <CardDescription>{editingProductId ? "Modify medicine details" : "Add medicine details to your store inventory"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={editingProductId ? handleUpdateProduct : handleAddProduct} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label htmlFor="name" className="font-medium">
                                Product Name <span className="text-destructive">*</span>
                              </Label>
                            </div>
                            <Input
                              id="name"
                              value={productName}
                              onChange={(e) => setProductName(e.target.value)}
                              placeholder="e.g., Paracetamol 500mg"
                              required
                            />
                            <p className="text-xs text-muted-foreground">Enter the full name of the medicine</p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label htmlFor="category" className="font-medium">
                                Category <span className="text-destructive">*</span>
                              </Label>
                            </div>
                            <Select value={categoryId} onValueChange={setCategoryId} required>
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
                          <Label htmlFor="description" className="font-medium">Description</Label>
                          <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief product description"
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground">A short summary of the product</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="uses" className="font-medium">Uses</Label>
                          <Textarea
                            id="uses"
                            value={uses}
                            onChange={(e) => setUses(e.target.value)}
                            placeholder="What is this medicine used for?"
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground">List the primary uses of this medicine</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="composition" className="font-medium">Composition</Label>
                          <Textarea
                            id="composition"
                            value={composition}
                            onChange={(e) => setComposition(e.target.value)}
                            placeholder="Active ingredients and composition"
                            rows={2}
                          />
                          <p className="text-xs text-muted-foreground">List the active ingredients</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="side_effects" className="font-medium">Side Effects</Label>
                          <Textarea
                            id="side_effects"
                            value={sideEffects}
                            onChange={(e) => setSideEffects(e.target.value)}
                            placeholder="Possible side effects"
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground">List any known side effects</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label htmlFor="price" className="font-medium">
                                Original Price (₹) <span className="text-destructive">*</span>
                              </Label>
                            </div>
                            <Input
                              id="price"
                              type="number"
                              step="0.01"
                              value={originalPrice}
                              onChange={(e) => setOriginalPrice(e.target.value)}
                              placeholder="99.99"
                              required
                            />
                            <p className="text-xs text-muted-foreground">Enter the MRP in ₹</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="image" className="font-medium">Image URL</Label>
                            <Input
                              id="image"
                              value={imageUrl}
                              onChange={(e) => setImageUrl(e.target.value)}
                              placeholder="https://..."
                            />
                            <p className="text-xs text-muted-foreground">Paste a direct image URL (JPG/PNG)</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                          <Switch
                            id="in-stock"
                            checked={inStock}
                            onCheckedChange={setInStock}
                          />
                          <Label htmlFor="in-stock" className="font-medium">
                            In Stock
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Uncheck if this product is currently unavailable
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <Button type="submit" disabled={loading} className="w-full md:w-1/3">
                            {loading ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                <span>{editingProductId ? "Updating..." : "Adding..."}</span>
                              </div>
                            ) : (
                              editingProductId ? "Update Product" : "Add Product"
                            )}
                          </Button>
                          {editingProductId && (
                            <Button type="button" variant="outline" onClick={handleCancelEdit} className="w-full md:w-1/3">
                              Cancel
                            </Button>
                          )}
                        </div>
                      </form>
                      
                      {/* Divider - Only shown in Add Product section */}
                      {activeSection === "add-product" && (
                        <div className="my-8 border-t border-muted"></div>
                      )}
                      
                      {/* Bulk Upload Section - Only shown in Add Product section */}
                      {activeSection === "add-product" && (
                        <div className="mt-8">
                          <h3 className="text-xl font-semibold mb-4">Bulk Upload Products</h3>
                          <p className="text-muted-foreground mb-6">
                            Upload an Excel file to add multiple products at once. Download the template to see the required format.
                          </p>
                          <ExcelUpload onSuccess={() => {
                            // Refresh categories and products after successful upload
                            fetchCategories();
                            fetchProducts();
                            // Show success message
                            toast.success("Products uploaded successfully! Refresh the store to see changes.");
                            // Navigate to manage products section
                            setActiveSection("manage-products");
                          }} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Product Listing Section - Only shown in Manage Products section */}
                {activeSection === "manage-products" && !editingProductId && (
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle className="text-2xl">Manage Products</CardTitle>
                      <CardDescription>View and manage your product inventory</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Search and Filter Controls */}
                      <div className="mb-6 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-1">
                            <Input
                              placeholder="Search products..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Categories" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select value={stockStatusFilter} onValueChange={(value: any) => setStockStatusFilter(value)}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="in-stock">In Stock</SelectItem>
                                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {(searchQuery || selectedCategoryFilter || stockStatusFilter !== "all") && (
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground">
                              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                            </p>
                            <Button variant="outline" size="sm" onClick={handleResetFilters}>
                              Reset Filters
                            </Button>
                          </div>
                        )}
                      </div>

                      {productsLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <>
                          {filteredProducts.length === 0 ? (
                            <div className="text-center py-8">
                              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                              <h3 className="text-lg font-medium mb-2">No products found</h3>
                              <p className="text-muted-foreground">
                                {products.length === 0 
                                  ? "Add your first product using the \"Add Product\" section."
                                  : "Try adjusting your search or filter criteria."}
                              </p>
                              {products.length === 0 && (
                                <Button onClick={() => setActiveSection("add-product")} className="mt-4">
                                  Add Product
                                </Button>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">
                                Showing {filteredProducts.length} of {products.length} products
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredProducts.map((product) => (
                                  <div key={product.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-lg truncate">{product.name}</h3>
                                        <p className="text-sm text-muted-foreground">₹{product.original_price?.toFixed(2)}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            product.in_stock 
                                              ? "bg-green-100 text-green-800" 
                                              : "bg-red-100 text-red-800"
                                          }`}>
                                            {product.in_stock ? "In Stock" : "Out of Stock"}
                                          </span>
                                          {product.category_id && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                              {categories.find(cat => cat.id === product.category_id)?.name || "Uncategorized"}
                                            </span>
                                          )}
                                        </div>
                                        {/* Stock Quantity Controls */}
                                        <div className="flex items-center gap-2 mt-3">
                                          <span className="text-sm font-medium">Stock:</span>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => handleUpdateStock(product.id, Math.max(0, (product.stock_quantity || 0) - 1))}
                                          >
                                            -
                                          </Button>
                                          <span className="w-10 text-center text-sm font-medium">
                                            {product.stock_quantity || 0}
                                          </span>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => handleUpdateStock(product.id, (product.stock_quantity || 0) + 1)}
                                          >
                                            +
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="flex gap-2 ml-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleEditProduct(product)}
                                        >
                                          <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => handleDeleteProduct(product.id, product.name)}
                                        >
                                          <Trash className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Orders Management Section */}
            {activeSection === "orders" && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Package className="w-6 h-6" />
                    Order Management
                  </CardTitle>
                  <CardDescription>
                    {deliveryEnabled 
                      ? "Manage customer orders and deliveries" 
                      : "Manage customer in-store pickup orders"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Delivery Status Banner */}
                    {!deliveryEnabled && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-yellow-800">In-Store Pickup Mode</h4>
                            <p className="text-sm text-yellow-700 mt-1">
                              Orders are for in-store pickup only. Enable delivery in Feature Flags to manage deliveries.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Orders List */}
                    <div className="space-y-4">
                      {ordersLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : orders.length === 0 ? (
                        <div className="text-center py-8">
                          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                          <p className="text-muted-foreground">
                            {deliveryEnabled 
                              ? "Orders will appear here when customers place them." 
                              : "Pickup orders will appear here when customers place them."}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {orders.map((order) => (
                            <div key={order.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm text-muted-foreground">#{order.order_number}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                      order.status === 'processing' ? 'bg-purple-100 text-purple-800' :
                                      order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {new Date(order.created_at).toLocaleDateString()} • ₹{order.total_amount.toFixed(2)}
                                  </p>
                                  <p className="text-sm mt-1">
                                    {deliveryEnabled 
                                      ? `${order.delivery_address?.full_name || 'N/A'} • ${order.delivery_address?.city || 'N/A'}` 
                                      : `${order.delivery_address?.full_name || 'N/A'} • In-Store Pickup`}
                                  </p>
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      // TODO: Implement order details view
                                      toast.info("Order details feature coming soon");
                                    }}
                                  >
                                    View Details
                                  </Button>
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    onClick={() => {
                                      // TODO: Implement order status update
                                      toast.info("Order status update feature coming soon");
                                    }}
                                  >
                                    Update Status
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Delivery/Pickup Info */}
                              <div className="mt-3 pt-3 border-t text-sm">
                                {deliveryEnabled ? (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Truck className="w-4 h-4" />
                                    <span>Delivery to {order.delivery_address?.city || 'N/A'}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Store className="w-4 h-4" />
                                    <span>In-Store Pickup</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "requests" && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Mail className="w-6 h-6" />
                    Customer Medicine Requests
                  </CardTitle>
                  <CardDescription>
                    View and manage requests from customers for medicines that are currently unavailable
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">Recent Requests</h3>
                        <p className="text-sm text-muted-foreground">
                          Customers requesting unavailable medicines
                        </p>
                      </div>
                      <RequestMedicineSheet>
                        <Button variant="secondary" className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          New Request
                        </Button>
                      </RequestMedicineSheet>
                    </div>
                    
                    {requestsLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : requests.length === 0 ? (
                      <div className="border rounded-lg p-6 text-center">
                        <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No requests yet</h3>
                        <p className="text-muted-foreground mb-4">
                          When customers request medicines that are not currently available, they will appear here.
                        </p>
                        <RequestMedicineSheet>
                          <Button variant="secondary" className="flex items-center gap-2 mx-auto">
                            <Mail className="w-4 h-4" />
                            Create Test Request
                          </Button>
                        </RequestMedicineSheet>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {requests.map((request) => (
                          <div key={request.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold">{request.medicine_name}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {request.status.replace('_', ' ')}
                                  </span>
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <p>Requested by: {request.customer_name}</p>
                                  <p>Contact: {request.email} | {request.phone}</p>
                                  {request.message && (
                                    <p className="mt-2 p-2 bg-muted rounded">
                                      <MessageSquare className="w-3 h-3 inline mr-1" />
                                      {request.message}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    // TODO: Implement request details view
                                    toast.info("Request details feature coming soon");
                                  }}
                                >
                                  View Details
                                </Button>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => {
                                    // TODO: Implement request status update
                                    toast.info("Request status update feature coming soon");
                                  }}
                                >
                                  Update Status
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleDeleteRequest(request.id, request.medicine_name)}
                                >
                                  <Trash className="w-4 h-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                              Requested on {new Date(request.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "settings" && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-2xl">Store Settings</CardTitle>
                  <CardDescription>Configure store-wide discount percentage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Percent className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="discount" className="text-lg font-semibold">
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
                    <Button onClick={handleUpdateDiscount} disabled={loading} className="w-full md:w-1/3">
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                          <span>Updating...</span>
                        </div>
                      ) : (
                        "Update Discount"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "features" && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Package className="w-6 h-6" />
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
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Owner;