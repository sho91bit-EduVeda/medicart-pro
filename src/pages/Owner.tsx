import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/integrations/firebase/config";
import { collection, getDocs, addDoc, doc, getDoc, setDoc, query, orderBy, deleteDoc, updateDoc, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FeatureFlagsPanel } from "@/components/FeatureFlagsPanel";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LogOut, Plus, Percent, Package, Settings, MessageSquare, Database, Store, AlertTriangle, Truck, Trash, Pencil, Mail, Bell, TrendingUp, FileSpreadsheet, ChartBar, CheckCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ExcelUpload } from "@/components/ExcelUpload";
import { seedDatabase } from "@/utils/seedData";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import SidebarBackground from "@/components/svgs/SidebarBackground";
import RequestMedicineSheet from "@/components/RequestMedicineSheet";
import RequestDetailsModal from "@/components/RequestDetailsModal";
import { NotificationBell } from "@/components/NotificationBell";
import KalyanamLogo from "@/components/svgs/KalyanamLogo";
import SalesReporting from "@/components/SalesReporting"; // Import SalesReporting component
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";


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

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
  validity: string;
  category: string;
  terms: string;
  enabled: boolean;
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
  // Medicine requests filter and sort state
  const [requestSearchQuery, setRequestSearchQuery] = useState("");
  const [requestStatusFilter, setRequestStatusFilter] = useState<"all" | "pending" | "in_progress" | "resolved">("all");
  const [requestSortBy, setRequestSortBy] = useState<"created_at" | "medicine_name" | "customer_name">("created_at");
  const [requestSortOrder, setRequestSortOrder] = useState<"asc" | "desc">("desc");

  // State for selected request and modal
  const [selectedRequest, setSelectedRequest] = useState<MedicineRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter and sort medicine requests
  const filteredAndSortedRequests = requests.filter(request => {
    // Search filter
    const matchesSearch = request.medicine_name.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
                         request.customer_name.toLowerCase().includes(requestSearchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = requestStatusFilter === "all" || request.status === requestStatusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    let comparison = 0;
    
    switch (requestSortBy) {
      case "medicine_name":
        comparison = a.medicine_name.localeCompare(b.medicine_name);
        break;
      case "customer_name":
        comparison = a.customer_name.localeCompare(b.customer_name);
        break;
      case "created_at":
      default:
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
    }
    
    return requestSortOrder === "asc" ? comparison : -comparison;
  });

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
  const [stockQuantity, setStockQuantity] = useState(0);

  // Category form state
  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // Announcements form state
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementPriority, setAnnouncementPriority] = useState<"normal" | "high">("normal");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);

  // Offers state
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  
  // Offer form state
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [offerDiscount, setOfferDiscount] = useState("");
  const [offerValidity, setOfferValidity] = useState("");
  const [offerCategory, setOfferCategory] = useState("");
  const [offerTerms, setOfferTerms] = useState("");
  const [offerEnabled, setOfferEnabled] = useState(true);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);

  // State for medicine data import
  const [importSource, setImportSource] = useState<"manual" | "csv" | "api">("manual");
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

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

  // Fetch products when component mounts or when active section changes to manage-products
  useEffect(() => {
    if (activeSection === "manage-products" || activeSection === "add-product") {
      fetchProducts();
    }
  }, [activeSection]);

  // Listen for stock updates from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'medicart-stock-updated' && activeSection === "manage-products") {
        // Refresh products when stock is updated in another component
        fetchProducts();
      }
    };

    // Also check localStorage periodically in case storage events don't fire
    const interval = setInterval(() => {
      const stockUpdated = localStorage.getItem('medicart-stock-updated');
      if (stockUpdated) {
        const lastUpdate = parseInt(stockUpdated, 10);
        const now = Date.now();
        // Only refresh if the update was recent (within last 5 seconds)
        if (now - lastUpdate < 5000 && activeSection === "manage-products") {
          fetchProducts();
          // Clear the flag after processing
          localStorage.removeItem('medicart-stock-updated');
        }
      }
    }, 1000);

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [activeSection]);

  // Fetch announcements when announcements section is active
  useEffect(() => {
    if (activeSection === "announcements") {
      fetchAnnouncements();
    }
  }, [activeSection]);

  // Fetch offers when offers section is active
  useEffect(() => {
    if (activeSection === "offers") {
      fetchOffers();
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

  const fetchAnnouncements = async () => {
    setAnnouncementsLoading(true);
    try {
      const q = query(
        collection(db, "announcements"),
        orderBy("created_at", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const announcementsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));
      
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
      toast.error("Failed to load announcements");
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  // Offer management functions
  const fetchOffers = async () => {
    setOffersLoading(true);
    try {
      const q = query(
        collection(db, "offers"),
        orderBy("created_at", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const offersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as Offer[];
      
      setOffers(offersData);
    } catch (error) {
      console.error("Failed to fetch offers:", error);
      toast.error("Failed to load offers");
    } finally {
      setOffersLoading(false);
    }
  };
  
  const handleAddOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!offerTitle.trim()) {
      toast.error("Offer title is required");
      return;
    }
    
    if (!offerDiscount.trim()) {
      toast.error("Discount value is required");
      return;
    }
    
    if (!offerValidity) {
      toast.error("Validity date is required");
      return;
    }
    
    try {
      await addDoc(collection(db, "offers"), {
        title: offerTitle.trim(),
        description: offerDescription.trim(),
        discount: offerDiscount.trim(),
        validity: offerValidity,
        category: offerCategory.trim(),
        terms: offerTerms.trim(),
        enabled: offerEnabled,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      toast.success("Offer added successfully!");
      resetOfferForm();
      fetchOffers();
    } catch (error: any) {
      toast.error(error.message || "Failed to add offer");
    }
  };
  
  const handleEditOffer = (offer: Offer) => {
    setEditingOfferId(offer.id);
    setOfferTitle(offer.title);
    setOfferDescription(offer.description);
    setOfferDiscount(offer.discount);
    setOfferValidity(offer.validity);
    setOfferCategory(offer.category);
    setOfferTerms(offer.terms);
    setOfferEnabled(offer.enabled);
  };
  
  const handleUpdateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingOfferId) return;
    
    // Validate required fields
    if (!offerTitle.trim()) {
      toast.error("Offer title is required");
      return;
    }
    
    if (!offerDiscount.trim()) {
      toast.error("Discount value is required");
      return;
    }
    
    if (!offerValidity) {
      toast.error("Validity date is required");
      return;
    }
    
    try {
      const offerRef = doc(db, "offers", editingOfferId);
      await updateDoc(offerRef, {
        title: offerTitle.trim(),
        description: offerDescription.trim(),
        discount: offerDiscount.trim(),
        validity: offerValidity,
        category: offerCategory.trim(),
        terms: offerTerms.trim(),
        enabled: offerEnabled,
        updated_at: new Date().toISOString()
      });

      toast.success("Offer updated successfully!");
      setEditingOfferId(null);
      resetOfferForm();
      fetchOffers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update offer");
    }
  };
  
  const handleDeleteOffer = async (offerId: string, offerTitle: string) => {
    try {
      await deleteDoc(doc(db, "offers", offerId));
      toast.success(`Offer "${offerTitle}" deleted successfully!`);
      fetchOffers();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete offer");
    }
  };
  
  const handleToggleOffer = async (offerId: string, enabled: boolean) => {
    try {
      const offerRef = doc(db, "offers", offerId);
      await updateDoc(offerRef, {
        enabled: !enabled,
        updated_at: new Date().toISOString()
      });
      
      toast.success(`Offer ${!enabled ? 'enabled' : 'disabled'} successfully!`);
      fetchOffers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update offer status");
    }
  };
  
  const resetOfferForm = () => {
    setOfferTitle("");
    setOfferDescription("");
    setOfferDiscount("");
    setOfferValidity("");
    setOfferCategory("");
    setOfferTerms("");
    setOfferEnabled(true);
    setEditingOfferId(null);
  };
  
  const handleCancelOfferEdit = () => {
    resetOfferForm();
  };

  // Category management functions
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      await addDoc(collection(db, "categories"), {
        name: categoryName.trim(),
        created_at: new Date().toISOString()
      });

      toast.success("Category added successfully!");
      setCategoryName("");
      // Refresh categories list
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to add category");
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCategoryId) return;
    
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const categoryRef = doc(db, "categories", editingCategoryId);
      await updateDoc(categoryRef, {
        name: categoryName.trim(),
        updated_at: new Date().toISOString()
      });

      toast.success("Category updated successfully!");
      setEditingCategoryId(null);
      setCategoryName("");
      // Refresh categories list
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to update category");
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    // Check if category has products
    try {
      const productsQuery = query(
        collection(db, "products"),
        where("category_id", "==", categoryId)
      );
      
      const productsSnapshot = await getDocs(productsQuery);
      
      if (productsSnapshot.size > 0) {
        toast.error(`Cannot delete category "${categoryName}" because it has ${productsSnapshot.size} product(s). Delete the products first.`);
        return;
      }

      await deleteDoc(doc(db, "categories", categoryId));
      toast.success(`Category "${categoryName}" deleted successfully!`);
      // Refresh categories list
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category");
    }
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategoryId(null);
    setCategoryName("");
  };

  // Announcement management functions
  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!announcementText.trim()) {
      toast.error("Announcement text is required");
      return;
    }

    try {
      await addDoc(collection(db, "announcements"), {
        text: announcementText.trim(),
        priority: announcementPriority,
        created_at: new Date().toISOString()
      });

      toast.success("Announcement added successfully!");
      setAnnouncementText("");
      setAnnouncementPriority("normal");
      // Refresh announcements list
      fetchAnnouncements();
    } catch (error: any) {
      toast.error(error.message || "Failed to add announcement");
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      await deleteDoc(doc(db, "announcements", announcementId));
      toast.success("Announcement deleted successfully!");
      // Refresh announcements list
      fetchAnnouncements();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete announcement");
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
    setStockQuantity(product.stock_quantity || 0);
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
    setStockQuantity(0);
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
        stock_quantity: stockQuantity,
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
        stock_quantity: stockQuantity,
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

  const handleUpdateRequestStatus = async (requestId: string, newStatus: MedicineRequest['status']) => {
    try {
      const requestRef = doc(db, "medicine_requests", requestId);
      await updateDoc(requestRef, {
        status: newStatus,
        updated_at: new Date().toISOString()
      });
      
      toast.success("Request status updated successfully!");
      // Refresh requests list
      fetchMedicineRequests();
    } catch (error) {
      console.error("Failed to update request status:", error);
      toast.error("Failed to update request status");
    }
  };

  // Medicine data import functions
  const handleApiImport = async () => {
    if (!apiEndpoint) {
      toast.error("Please enter an API endpoint");
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Simulate API import process
      // In a real implementation, this would connect to an actual medicine database API
      for (let i = 0; i <= 100; i += 10) {
        setImportProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      toast.success("Medicine data imported successfully!");
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import medicine data");
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  // Update navigation items to include Data Import
  const navigationItems = [
    { id: "add-product", label: "Add Product", icon: Plus },
    { id: "manage-products", label: "Manage Products", icon: Package },
    { id: "manage-categories", label: "Manage Categories", icon: Package },
    { id: "offers", label: "Manage Offers", icon: Percent },
    { id: "announcements", label: "Announcements", icon: Bell },
    { id: "orders", label: "Orders", icon: Package },
    { id: "requests", label: "Medicine Requests", icon: Mail },
    { id: "sales-reporting", label: "Sales Reporting", icon: TrendingUp },
    { id: "data-import", label: "Data Import", icon: Database }, // Added Data Import section
    { id: "settings", label: "Settings", icon: Settings },
    { id: "features", label: "Features", icon: Package },
  ];

  // Effect to handle medicine request notifications
  useEffect(() => {
    const handleOpenRequest = (event: CustomEvent) => {
      const requestId = event.detail;
      // Find the request by ID
      const request = requests.find(r => r.id === requestId);
      if (request) {
        setSelectedRequest(request);
        setIsModalOpen(true);
        // Switch to requests tab if not already there
        setActiveSection("requests");
      }
    };

    // Add event listener for opening medicine requests
    window.addEventListener('openMedicineRequest', handleOpenRequest as EventListener);

    // Check if we need to open a specific request on initial load (for navigation from main page)
    const hash = window.location.hash;
    if (hash === '#requests') {
      // Clear the hash
      window.history.replaceState(null, '', window.location.pathname);
      // Set the active section to requests
      setActiveSection("requests");
    }

    return () => {
      window.removeEventListener('openMedicineRequest', handleOpenRequest as EventListener);
    };
  }, [requests]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm border border-white/10 shadow-lg">
                <KalyanamLogo className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold hidden sm:block">Dashboard</h1>
                <div className="sm:hidden">
                  <h1 className="text-xl font-bold">Dashboard</h1>
                </div>
                <p className="text-sm text-primary-foreground/90 hidden sm:block">Manage your medical store</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* View Store Button - Visible on mobile and desktop */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden text-primary-foreground hover:bg-white/20 rounded-full"
                onClick={() => navigate("/")}
              >
                <Store className="w-6 h-6" />
              </Button>
              
              {/* Notification Bell */}
              <NotificationBell />

              
              <Button variant="secondary" onClick={seedDatabase} className="flex items-center gap-2 hidden md:flex">
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Seed DB</span>
              </Button>
              <Button variant="default" onClick={() => navigate("/")} className="flex items-center gap-2 hidden md:flex">
                <Store className="w-5 h-5" />
                <span className="hidden sm:inline">View Store</span>
              </Button>
              <Button variant="destructive" onClick={handleLogout} className="flex items-center gap-2 hidden md:flex">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
              
              {/* Mobile menu trigger - Moved to the extreme right */}
              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon" className="text-primary-foreground">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[340px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <KalyanamLogo className="w-8 h-8" />
                      <span className="hidden sm:inline">Dashboard</span>
                      <span className="sm:hidden text-xl">Dashboard</span>
                    </SheetTitle>
                    <p className="text-sm text-muted-foreground hidden sm:block">Manage your medical store</p>
                  </SheetHeader>
                  
                  <div className="mt-6 flex flex-col gap-2">
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Button
                          key={item.id}
                          variant={activeSection === item.id ? "default" : "ghost"}
                          className="justify-start gap-3 py-6 text-left"
                          onClick={() => {
                            setActiveSection(item.id);
                            // Close the sheet using the proper Radix UI API
                            document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'Escape'}));
                          }}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </Button>
                      );
                    })}
                    
                    <div className="mt-4 pt-4 border-t">
                      <Button 
                        variant="secondary" 
                        onClick={() => {
                          seedDatabase();
                          // Close the sheet
                          document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'Escape'}));
                        }} 
                        className="w-full justify-start gap-3 py-6 text-left"
                      >
                        <Database className="w-5 h-5" />
                        <span className="font-medium">Seed Database</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          navigate("/");
                          // Close the sheet
                          document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'Escape'}));
                        }} 
                        className="w-full justify-start gap-3 py-6 text-left mt-2"
                      >
                        <Store className="w-5 h-5" />
                        <span className="font-medium">View Store</span>
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => {
                          handleLogout();
                          // Close the sheet
                          document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'Escape'}));
                        }} 
                        className="w-full justify-start gap-3 py-6 text-left mt-2"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation - Hidden on mobile */}
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
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
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

            {/* Mobile Navigation - Improved for better accessibility */}
            <div className="md:hidden mb-6">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
                      <span className="whitespace-nowrap">{item.label}</span>
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

                        <div className="space-y-2">
                          <Label htmlFor="stock-quantity" className="font-medium">
                            Stock Quantity
                          </Label>
                          <Input
                            id="stock-quantity"
                            type="number"
                            min="0"
                            value={stockQuantity}
                            onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                          <p className="text-xs text-muted-foreground">
                            Enter the current quantity available in stock
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
                              <SelectTrigger className="w-[120px] sm:w-[180px]">
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
                              <SelectTrigger className="w-[120px] sm:w-[180px]">
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

            {/* Data Import Section */}
            {activeSection === "data-import" && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Database className="w-6 h-6" />
                    Medicine Data Import
                  </CardTitle>
                  <CardDescription>
                    Import medicine data from various sources
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card 
                      className={`cursor-pointer border-2 ${importSource === "manual" ? "border-primary" : ""}`}
                      onClick={() => setImportSource("manual")}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Plus className="w-5 h-5" />
                          Manual Entry
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Add medicines one by one using the manual form
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className={`cursor-pointer border-2 ${importSource === "csv" ? "border-primary" : ""}`}
                      onClick={() => setImportSource("csv")}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileSpreadsheet className="w-5 h-5" />
                          CSV/Excel Import
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Upload a spreadsheet with multiple medicine records
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className={`cursor-pointer border-2 ${importSource === "api" ? "border-primary" : ""}`}
                      onClick={() => setImportSource("api")}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Database className="w-5 h-5" />
                          API Import
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Connect to external medicine databases (coming soon)
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {importSource === "manual" && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">Manual Entry</h3>
                      <p className="text-muted-foreground mb-4">
                        Use the "Add Product" section to manually enter medicine details.
                      </p>
                      <Button onClick={() => setActiveSection("add-product")}>
                        Go to Add Product
                      </Button>
                    </div>
                  )}

                  {importSource === "csv" && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">CSV/Excel Import</h3>
                      <ExcelUpload onSuccess={() => {
                        fetchProducts();
                        toast.success("Products uploaded successfully! Refresh the store to see changes.");
                      }} />
                    </div>
                  )}

                  {importSource === "api" && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">API Import</h3>
                      <p className="text-muted-foreground mb-4">
                        Connect to external medicine databases. Note: This feature requires a valid API endpoint and key.
                      </p>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="api-endpoint">API Endpoint</Label>
                          <Input
                            id="api-endpoint"
                            value={apiEndpoint}
                            onChange={(e) => setApiEndpoint(e.target.value)}
                            placeholder="https://api.medicinedatabase.com/v1/medicines"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="api-key">API Key</Label>
                          <Input
                            id="api-key"
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter your API key"
                          />
                        </div>
                        
                        {isImporting && (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Importing data...</p>
                            <div className="w-full bg-secondary rounded-full h-2.5">
                              <div 
                                className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                                style={{ width: `${importProgress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-muted-foreground text-right">{importProgress}%</p>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleApiImport} 
                            disabled={isImporting}
                          >
                            {isImporting ? "Importing..." : "Import Data"}
                          </Button>
                          
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setApiEndpoint("https://api.example.com/medicines");
                              setApiKey("sample-api-key-12345");
                            }}
                          >
                            Use Sample Credentials
                          </Button>
                        </div>
                        
                        <Card className="mt-6 border border-dashed bg-muted/30">
                          <CardHeader>
                            <CardTitle className="text-md">Note</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              Currently, there are no freely available public APIs for Indian medicine data. 
                              This feature is designed to work with commercial medicine databases that you may subscribe to.
                              When you obtain access to such an API, you can use this interface to import medicine data automatically.
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                              For now, we recommend using the CSV/Excel import option with our template for bulk data entry.
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
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
                    Manage customer in-store pickup orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Delivery Status Banner */}
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-yellow-800">In-Store Pickup Mode</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Orders are for in-store pickup only.
                          </p>
                        </div>
                      </div>
                    </div>

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
                            Pickup orders will appear here when customers place them.
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
                                    {order.delivery_address?.full_name || 'N/A'} • In-Store Pickup
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
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Store className="w-4 h-4" />
                                  <span>In-Store Pickup</span>
                                </div>
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
                    
                    {/* Filter and Sort Controls */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <Input
                          placeholder="Search requests..."
                          value={requestSearchQuery}
                          onChange={(e) => setRequestSearchQuery(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Select value={requestStatusFilter} onValueChange={(value: any) => setRequestStatusFilter(value)}>
                          <SelectTrigger className="w-[120px] sm:w-[180px]">
                            <SelectValue placeholder="All Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={requestSortBy} onValueChange={(value: any) => setRequestSortBy(value)}>
                          <SelectTrigger className="w-[120px] sm:w-[180px]">
                            <SelectValue placeholder="Sort By" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="created_at">Date</SelectItem>
                            <SelectItem value="medicine_name">Medicine</SelectItem>
                            <SelectItem value="customer_name">Customer</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="outline" 
                          onClick={() => setRequestSortOrder(requestSortOrder === "asc" ? "desc" : "asc")}
                          className="flex items-center gap-2"
                        >
                          {requestSortOrder === "asc" ? "↑" : "↓"}
                        </Button>
                        {(requestSearchQuery || requestStatusFilter !== "all") && (
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setRequestSearchQuery("");
                              setRequestStatusFilter("all");
                            }}
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {requestsLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : filteredAndSortedRequests.length === 0 ? (
                      <div className="border rounded-lg p-6 text-center">
                        <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No requests found</h3>
                        <p className="text-muted-foreground mb-4">
                          {requests.length === 0 
                            ? "When customers request medicines that are not currently available, they will appear here."
                            : "No requests match your current filters. Try adjusting your search or filter criteria."}
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
                        {filteredAndSortedRequests.map((request) => (
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
                                    setSelectedRequest(request);
                                    setIsModalOpen(true);
                                  }}
                                >
                                  View Details
                                </Button>
                                <Select 
                                  value={request.status} 
                                  onValueChange={(value: any) => handleUpdateRequestStatus(request.id, value)}
                                >
                                  <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                  </SelectContent>
                                </Select>
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
                        className="max-w-[120px] sm:max-w-xs"
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

            {activeSection === "manage-categories" && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-2xl">Manage Categories</CardTitle>
                  <CardDescription>Add, edit, or delete product categories</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Category Form */}
                  <Card className="border border-dashed bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {editingCategoryId ? "Edit Category" : "Add New Category"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={editingCategoryId ? handleUpdateCategory : handleAddCategory} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="category-name">Category Name</Label>
                          <Input
                            id="category-name"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            placeholder="Enter category name"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" disabled={loading}>
                            {loading ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                <span>{editingCategoryId ? "Updating..." : "Adding..."}</span>
                              </div>
                            ) : editingCategoryId ? (
                              "Update Category"
                            ) : (
                              "Add Category"
                            )}
                          </Button>
                          {editingCategoryId && (
                            <Button type="button" variant="outline" onClick={handleCancelCategoryEdit}>
                              Cancel
                            </Button>
                          )}
                        </div>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Categories List */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">Existing Categories</h3>
                      <p className="text-sm text-muted-foreground">
                        {categories.length} category{categories.length !== 1 ? 'es' : ''} in your store
                      </p>
                    </div>
                    
                    {categories.length === 0 ? (
                      <div className="text-center py-8 border border-dashed rounded-lg">
                        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No categories yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Add your first category to organize your products.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map((category) => (
                          <Card key={category.id} className="flex items-center justify-between p-4">
                            <div>
                              <h4 className="font-medium">{category.name}</h4>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteCategory(category.id, category.name)}
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Offers Management Section */}
            {activeSection === "offers" && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Percent className="w-6 h-6" />
                    Manage Offers
                  </CardTitle>
                  <CardDescription>
                    Create and manage special offers and discounts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Offer Form */}
                  <Card className="border border-dashed bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {editingOfferId ? "Edit Offer" : "Create New Offer"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={editingOfferId ? handleUpdateOffer : handleAddOffer} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="offer-title">Offer Title <span className="text-destructive">*</span></Label>
                            <Input
                              id="offer-title"
                              value={offerTitle}
                              onChange={(e) => setOfferTitle(e.target.value)}
                              placeholder="e.g., Summer Health Sale"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="offer-discount">Discount <span className="text-destructive">*</span></Label>
                            <Input
                              id="offer-discount"
                              value={offerDiscount}
                              onChange={(e) => setOfferDiscount(e.target.value)}
                              placeholder="e.g., 20% or BOGO"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="offer-description">Description</Label>
                          <Textarea
                            id="offer-description"
                            value={offerDescription}
                            onChange={(e) => setOfferDescription(e.target.value)}
                            placeholder="Brief description of the offer"
                            rows={2}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="offer-validity">Validity Date <span className="text-destructive">*</span></Label>
                            <Input
                              id="offer-validity"
                              type="date"
                              value={offerValidity}
                              onChange={(e) => setOfferValidity(e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="offer-category">Category</Label>
                            <Input
                              id="offer-category"
                              value={offerCategory}
                              onChange={(e) => setOfferCategory(e.target.value)}
                              placeholder="e.g., Vitamins & Supplements"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="offer-terms">Terms & Conditions</Label>
                          <Textarea
                            id="offer-terms"
                            value={offerTerms}
                            onChange={(e) => setOfferTerms(e.target.value)}
                            placeholder="Terms and conditions for this offer"
                            rows={3}
                          />
                        </div>
                        
                        <div className="flex items-center gap-3 pt-2">
                          <Switch
                            id="offer-enabled"
                            checked={offerEnabled}
                            onCheckedChange={setOfferEnabled}
                          />
                          <Label htmlFor="offer-enabled" className="font-medium">
                            Offer Enabled
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Toggle to enable or disable this offer
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button type="submit" disabled={loading}>
                            {loading ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                <span>{editingOfferId ? "Updating..." : "Creating..."}</span>
                              </div>
                            ) : editingOfferId ? (
                              "Update Offer"
                            ) : (
                              "Create Offer"
                            )}
                          </Button>
                          {editingOfferId && (
                            <Button type="button" variant="outline" onClick={handleCancelOfferEdit}>
                              Cancel
                            </Button>
                          )}
                        </div>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Offers List */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">Current Offers</h3>
                      <p className="text-sm text-muted-foreground">
                        {offers.length} offer{offers.length !== 1 ? 's' : ''} in your store
                      </p>
                    </div>
                    
                    {offersLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : offers.length === 0 ? (
                      <div className="text-center py-8 border border-dashed rounded-lg">
                        <Percent className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No offers yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Create your first offer to attract customers.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {offers.map((offer) => (
                          <Card key={offer.id} className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">{offer.title}</h4>
                                  <Badge variant={offer.enabled ? "default" : "secondary"}>
                                    {offer.enabled ? "Enabled" : "Disabled"}
                                  </Badge>
                                  <Badge variant="secondary">
                                    {offer.discount} OFF
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {offer.description}
                                </p>
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  <span>Valid till: {offer.validity}</span>
                                  {offer.category && <span>• Category: {offer.category}</span>}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditOffer(offer)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant={offer.enabled ? "secondary" : "default"}
                                  size="sm"
                                  onClick={() => handleToggleOffer(offer.id, offer.enabled)}
                                >
                                  {offer.enabled ? "Disable" : "Enable"}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteOffer(offer.id, offer.title)}
                                >
                                  <Trash className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            {offer.terms && (
                              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                                <span className="font-medium">Terms:</span> {offer.terms}
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {activeSection === "announcements" && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-2xl">Manage Announcements</CardTitle>
                  <CardDescription>Create and manage announcements that appear at the top of the store homepage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Announcement Form */}
                  <Card className="border border-dashed bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-lg">Create New Announcement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddAnnouncement} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="announcement-text">Announcement Text</Label>
                          <Textarea
                            id="announcement-text"
                            value={announcementText}
                            onChange={(e) => setAnnouncementText(e.target.value)}
                            placeholder="Enter your announcement text"
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Priority Level</Label>
                          <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                id="priority-normal"
                                name="priority"
                                value="normal"
                                checked={announcementPriority === "normal"}
                                onChange={() => setAnnouncementPriority("normal")}
                                className="h-4 w-4 text-primary"
                              />
                              <Label htmlFor="priority-normal">Normal</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                id="priority-high"
                                name="priority"
                                value="high"
                                checked={announcementPriority === "high"}
                                onChange={() => setAnnouncementPriority("high")}
                                className="h-4 w-4 text-primary"
                              />
                              <Label htmlFor="priority-high">High (will show a visual indicator)</Label>
                            </div>
                          </div>
                        </div>
                        <Button type="submit" disabled={loading}>
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                              <span>Adding...</span>
                            </div>
                          ) : (
                            "Add Announcement"
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Announcements List */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">Current Announcements</h3>
                      <p className="text-sm text-muted-foreground">
                        {announcements.length} announcement{announcements.length !== 1 ? 's' : ''} currently active
                      </p>
                    </div>
                    
                    {announcementsLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : announcements.length === 0 ? (
                      <div className="text-center py-8 border border-dashed rounded-lg">
                        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No announcements yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Create your first announcement to display important information to customers.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {announcements.map((announcement) => (
                          <Card key={announcement.id} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">{announcement.text}</h4>
                                  {announcement.priority === "high" && (
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                      High Priority
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Posted: {new Date(announcement.created_at).toLocaleDateString()} at {new Date(announcement.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteAnnouncement(announcement.id)}
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sales Reporting Section */}
            {activeSection === "sales-reporting" && (
              <SalesReporting />
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
      <RequestDetailsModal
        request={selectedRequest}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onUpdate={fetchMedicineRequests}
      />
    </div>
  );
};

export default Owner;
