import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { db, auth } from "@/integrations/firebase/config";
import { collection, getDocs, addDoc, doc, getDoc, setDoc, query, orderBy, deleteDoc, updateDoc, where, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FeatureFlagsPanel } from "@/components/common/FeatureFlagsPanel";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { LogOut, Plus, Percent, Package, Settings, MessageSquare, Database, Store, AlertTriangle, Truck, Trash, Pencil, Mail, Bell, TrendingUp, FileSpreadsheet, ChartBar, CheckCircle, Download, Receipt, Info, AlertCircle, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ExcelUpload } from "@/components/common/ExcelUpload";
import { IndianMedicineDatasetImport } from "@/components/admin/IndianMedicineDatasetImport";
import { StorePurchase } from "@/components/layout/StorePurchase";

import { seedDatabase } from "@/utils/seedData";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import SidebarBackground from "@/components/svgs/SidebarBackground";
import RequestMedicineSheet from "@/components/common/RequestMedicineSheet";
import RequestDetailsModal from "@/components/common/RequestDetailsModal";
import NotificationBell from "@/components/common/NotificationBell";
import LogoutButton from "@/components/common/LogoutButton";
import KalyanamLogo from "@/components/svgs/KalyanamLogo";
import SalesReporting from "@/components/admin/SalesReporting"; // Import SalesReporting component
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Menu } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";


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

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}

const Owner = () => {
  const navigate = useNavigate();
  const { deliveryEnabled } = useFeatureFlags();
  const prefersReducedMotion = useReducedMotion();
  const [categories, setCategories] = useState<Category[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Navigation state
  const [activeSection, setActiveSection] = useState<string>("manage-inventory");
  const [activeCategory, setActiveCategory] = useState("Inventory");

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

  // State for handling reminders
  const [reminders, setReminders] = useState<any[]>([]);
  
  // State for delivery banner visibility
  const [showDeliveryBanner, setShowDeliveryBanner] = useState(true);

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
  const [importSource, setImportSource] = useState<"manual" | "csv" | "api" | "indian_dataset">("manual");
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
    if (activeSection === "manage-inventory") {      fetchProducts();
    }
  }, [activeSection]);

  // Fetch orders when orders section is active
  useEffect(() => {
    if (activeSection === "orders") {
      fetchOrders();
    }
  }, [activeSection]);

  // Fetch products when component mounts or when active section changes to manage-inventory
  useEffect(() => {
    if (activeSection === "manage-inventory") {
      fetchProducts();
    }
  }, [activeSection]);  // Listen for stock updates from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'medicart-stock-updated' && activeSection === "manage-inventory") {
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
        if (now - lastUpdate < 5000 && activeSection === "manage-inventory") {
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

  const { isAuthenticated, isLoading, checkAuth, user, userName } = useAuth();

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

  // Add useEffect to fetch reminders
  useEffect(() => {
    if (!user) return;

    // Fetch reminders for this user - simplified query to avoid composite index
    const remindersQuery = query(
      collection(db, 'notifications'),
      where('user_id', '==', user.uid)
    );

    const unsubscribe = onSnapshot(remindersQuery, (snapshot) => {
      // Client-side filtering to avoid composite index requirement
      const allNotifications: any[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter for medicine request reminders that are unread
      const remindersData = allNotifications.filter((notification: any) => 
        notification.type === 'medicine_request_reminder' && 
        notification.read === false
      );
      
      // Sort by reminder_date client-side
      remindersData.sort((a: any, b: any) => {
        const dateA = a.reminder_date ? new Date(a.reminder_date).getTime() : 0;
        const dateB = b.reminder_date ? new Date(b.reminder_date).getTime() : 0;
        return dateA - dateB; // ascending order
      });
      
      setReminders(remindersData);
    });

    return () => unsubscribe();
  }, [user]);

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
      // Navigate back to manage inventory section
      setActiveSection("manage-inventory");
    } catch (error: any) {
      toast.error(error.message || "Failed to update product");
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

  // Update navigation items to group related functionalities into logical categories
  const navigationItems = [
    // Inventory Management Group
    { id: "data-import", label: "Add Medicines", icon: Database, category: "Inventory" },
    { id: "manage-inventory", label: "Manage Inventory", icon: Package, category: "Inventory" },
    { id: "store-purchase", label: "Store Purchase", icon: Receipt, category: "Inventory" },
    
    // Marketing & Promotions Group
    { id: "offers", label: "Manage Offers", icon: Percent, category: "Marketing" },
    { id: "announcements", label: "Announcements", icon: Bell, category: "Marketing" },
    
    // Customer Relations Group
    { id: "requests", label: "Medicine Requests", icon: Mail, category: "Customer Relations" },
    { id: "orders", label: "Orders", icon: Package, category: "Customer Relations" },
    
    // Analytics & Reporting Group
    { id: "sales-reporting", label: "Sales Reporting", icon: TrendingUp, category: "Analytics" },
    
    // Store Configuration Group
    { id: "settings", label: "Settings", icon: Settings, category: "Configuration" },
    { id: "features", label: "Features", icon: Package, category: "Configuration" },
  ];
  // Effect to handle hash changes for navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        // Remove the # prefix
        const sectionId = hash.substring(1);
        // Check if this section exists in our navigation items
        const sectionExists = navigationItems.some(item => item.id === sectionId);
        if (sectionExists) {
          setActiveSection(sectionId);
        }
        // Clear the hash from the URL without triggering navigation
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    // Check initial hash on page load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

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

    return () => {
      window.removeEventListener('openMedicineRequest', handleOpenRequest as EventListener);
    };
  }, [requests]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with animation */}
      <motion.header 
        className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 100, 
          damping: 15,
          mass: 1
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg backdrop-blur-sm border border-white/20 shadow-lg">
                <div className="w-8 h-8 flex items-center justify-center">
                  <img src="/src/assets/Logo.png" alt="Kalyanam Logo" className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold hidden sm:block">Dashboard</h1>
                <div className="sm:hidden">
                  <h1 className="text-xl font-bold">Dashboard</h1>
                </div>
                <p className="text-sm text-white/90">
                  {userName ? `Welcome, ${userName}!` : "Manage your medical store"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* View Store button - Visible on all views */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/")}
                className=""
              >
                <Store className="w-5 h-5 text-white" />
              </Button>
              
              {/* Notification Bell - Only show if there are notifications */}
              <NotificationBell />
              
              {/* Mobile menu trigger - Moved to the extreme right */}
              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <motion.button 
                    className="rounded-full p-2 text-white hover:bg-white/20 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Menu className="w-6 h-6" />
                  </motion.button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[340px] overflow-y-auto max-h-screen">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="py-4 space-y-6">
                    {/* Group navigation items by category */}
                    {Array.from(new Set(navigationItems.map(item => item.category))).map((category) => (
                      <div key={category}>
                        <h3 className="text-sm font-semibold text-sidebar-accent-foreground/70 px-1 pb-2">{category}</h3>
                        <div className="space-y-1">
                          {navigationItems
                            .filter(item => item.category === category)
                            .map((item) => {
                              const Icon = item.icon;
                              return (
                                <Button
                                  key={item.id}
                                  variant={activeSection === item.id ? "default" : "ghost"}
                                  className="justify-start gap-3 w-full"
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
                        </div>
                      </div>
                    ))}
                    
                    <div className="space-y-1 pt-4 border-t">
                      <Button 
                        variant="secondary" 
                        onClick={() => {
                          setActiveSection("features");
                          // Close the sheet
                          document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'Escape'}));
                        }} 
                        className="justify-start gap-3 w-full"
                      >
                        <Settings className="w-5 h-5" />
                        <span className="font-medium">Feature Flags</span>
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={() => {
                          seedDatabase();
                          // Close the sheet
                          document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'Escape'}));
                        }} 
                        className="justify-start gap-3 w-full"
                      >
                        <Database className="w-5 h-5" />
                        <span className="font-medium">Seed Database</span>
                      </Button>
                      <div className="mt-4">
                        <LogoutButton />
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </motion.header>
      <div className="flex flex-1">
        {/* Sidebar Navigation with animation - Hidden on mobile */}
        <motion.nav 
          className="w-64 bg-sidebar-background border-r p-4 hidden md:block relative overflow-hidden"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <SidebarBackground />
          <div className="relative z-10 space-y-3">
            {/* Group navigation items by category */}
            {Array.from(new Set(navigationItems.map(item => item.category))).map((category, categoryIndex) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-sidebar-accent-foreground/70 px-4 py-2">{category}</h3>
                {navigationItems
                  .filter(item => item.category === category)
                  .map((item, itemIndex) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + (categoryIndex * 0.1) + (itemIndex * 0.05) }}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant={activeSection === item.id ? "default" : "ghost"}
                          className="w-full justify-start gap-3 py-6 text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 pl-8"
                          onClick={() => setActiveSection(item.id)}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </Button>
                      </motion.div>
                    );
                  })}
              </div>
            ))}
          </div>
        </motion.nav>

        {/* Main Content with animation */}
        <motion.main 
          className="flex-1 p-4 sm:p-6 overflow-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div 
            className="max-w-6xl mx-auto"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Delivery Status Banner with animation */}
            {!deliveryEnabled && showDeliveryBanner && (
              <motion.div 
                className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <h3 className="text-sm font-medium text-yellow-800">Delivery Service Disabled</h3>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Medicine delivery is currently disabled. Enable it in the Feature Flags section when you're ready to start deliveries.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button 
                        variant="link" 
                        className="text-yellow-800 p-0 h-auto font-normal text-sm pl-0 mt-1"
                        onClick={() => setActiveSection("features")}
                      >
                        Go to Feature Flags →
                      </Button>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100"
                    onClick={() => setShowDeliveryBanner(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
            
            {/* Quick Stats Section - Mobile Only */}
            <motion.div 
              className="md:hidden grid grid-cols-2 gap-3 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                <Package className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-blue-600">{orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length}</div>
                <div className="text-xs text-gray-600 mt-1">Today's Orders</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-green-600">₹{orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).reduce((sum, o) => sum + (o.total_amount || 0), 0).toFixed(0)}</div>
                <div className="text-xs text-gray-600 mt-1">Revenue Today</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                <AlertTriangle className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-orange-600">{products.filter(p => (p.stock_quantity || 0) < 10).length}</div>
                <div className="text-xs text-gray-600 mt-1">Low Stock</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                <Mail className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-purple-600">{requests.filter(r => r.status === 'pending').length}</div>
                <div className="text-xs text-gray-600 mt-1">Pending Requests</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                <Database className="w-6 h-6 text-teal-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-teal-600">{products.length}</div>
                <div className="text-xs text-gray-600 mt-1">Total Products</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
                <Database className="w-6 h-6 text-indigo-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-indigo-600">{categories.length}</div>
                <div className="text-xs text-gray-600 mt-1">Categories</div>
              </div>
            </motion.div>



            {/* Content Sections */}
            {activeSection === "data-import" && (
              <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Add Medicines
                    </h3>
                  </div>
                  <div className="pt-4 space-y-6">
                    <div>
                      <p className="text-muted-foreground mb-4">
                        Automatically searches your current inventory first to restock existing medicines. 
                        If not found locally, it searches the extensive Indian Medicine Dataset with over 250,000 medicines and adds them directly to your inventory.
                      </p>
                    </div>
                    <IndianMedicineDatasetImport categories={categories} onCategoriesChange={fetchCategories} />
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "store-purchase" && (
              <StorePurchase />
            )}

            {activeSection === "manage-inventory" && (
              <div className="space-y-8 w-full max-w-6xl text-left">
                {/* Product Listing Section - Only shown in Manage Inventory section */}
                {!editingProductId && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="manage-products" className="border border-gray-200 rounded-xl overflow-hidden mb-4 transition-all hover:shadow-md hover:border-primary/30">
                      <AccordionTrigger className="p-0">
                        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors">
                          <div className="flex items-center justify-between gap-3 pb-2">
                            <div className="flex items-center gap-3">
                              <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                                <Package className="w-5 h-5 text-blue-600" />
                                Manage Products
                              </h3>
                            </div>
                            <div className="text-sm text-blue-600 font-medium">({products.length} products)</div>
                          </div>
                          <div className="pt-2">
                            <p className="text-sm text-slate-600">View and manage your product inventory</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-6 bg-white border-t border-gray-200">
                        <div className="text-left">
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
                                  ? "Add your first product using the Add Medicines section."
                                  : "Try adjusting your search or filter criteria."}
                              </p>
                      
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
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {/* Category Management Section - Part of same Accordion */}
                <AccordionItem value="manage-categories" className="border border-gray-200 rounded-xl overflow-hidden mb-4 transition-all hover:shadow-md hover:border-primary/30">
                  <AccordionTrigger className="p-0">
                    <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 transition-colors">
                      <div className="flex items-center justify-between gap-3 pb-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                            <Database className="w-5 h-5 text-purple-600" />
                            Manage Categories
                          </h3>
                        </div>
                        <div className="text-sm text-purple-600 font-medium">({categories.length} categories)</div>
                      </div>
                      <div className="pt-2">
                        <p className="text-sm text-slate-600">Add, edit, or delete product categories</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 bg-white border-t border-gray-200">
                    <div className="text-left space-y-6">
                      {/* Category Form */}
                      <Card className="border border-dashed bg-muted/30">
                        <CardHeader>
                          <CardTitle className="text-sm sm:text-base">
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
                          <h3 className="text-sm font-semibold sm:text-base">Existing Categories</h3>
                          <p className="text-sm text-muted-foreground">
                            {categories.length} category{categories.length !== 1 ? 'es' : ''} in your store
                          </p>
                        </div>
                                      
                        {categories.length === 0 ? (
                          <div className="text-center py-8 border border-dashed rounded-lg">
                            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-base font-medium mb-2">No categories yet</h3>
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
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        )}
    
            {/* Orders Management Section */}
            {activeSection === "orders" && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="orders-management" className="border border-gray-200 rounded-xl overflow-hidden mb-4 transition-all hover:shadow-md hover:border-primary/30">
                  <AccordionTrigger className="p-0">
                    <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-colors">
                      <div className="flex items-center gap-3 pb-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                          <Package className="w-5 h-5 text-emerald-600" />
                          Order Management
                        </h3>
                      </div>
                      <div className="pt-2">
                        <p className="text-sm text-slate-600">Manage customer orders and pickup requests</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 bg-white border-t border-gray-200">
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
                            <h3 className="text-base font-medium mb-2">No orders yet</h3>
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
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {activeSection === "requests" && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="medicine-requests" className="border border-gray-200 rounded-xl overflow-hidden mb-4 transition-all hover:shadow-md hover:border-primary/30">
                  <AccordionTrigger className="p-0">
                    <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-colors">
                      <div className="flex items-center gap-3 pb-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                          <Mail className="w-5 h-5 text-amber-600" />
                          Customer Medicine Requests
                        </h3>
                      </div>
                      <div className="pt-2">
                        <p className="text-sm text-slate-600">Manage customer requests for unavailable medicines</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 bg-white border-t border-gray-200">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-base font-semibold">Recent Requests</h3>
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
                          <h3 className="text-base font-medium mb-2">No requests found</h3>
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
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {activeSection === "settings" && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="store-settings" className="border border-gray-200 rounded-xl overflow-hidden mb-4 transition-all hover:shadow-md hover:border-primary/30">
                  <AccordionTrigger className="p-0">
                    <div className="p-6 bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 transition-colors">
                      <div className="flex items-center gap-3 pb-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                          <Settings className="w-5 h-5 text-violet-600" />
                          Store Settings
                        </h3>
                      </div>
                      <div className="pt-2">
                        <p className="text-sm text-slate-600">Configure your store's global settings</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 bg-white border-t border-gray-200">
                    <div className="space-y-6">
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
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {/* Offers Management Section */}
            {activeSection === "offers" && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="manage-offers" className="border border-gray-200 rounded-xl overflow-hidden mb-4 transition-all hover:shadow-md hover:border-primary/30">
                  <AccordionTrigger className="p-0">
                    <div className="p-6 bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 transition-colors">
                      <div className="flex items-center gap-3 pb-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                          <Percent className="w-5 h-5 text-rose-600" />
                          Manage Offers
                        </h3>
                      </div>
                      <div className="pt-2">
                        <p className="text-sm text-slate-600">Create and manage promotional offers</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 bg-white border-t border-gray-200">
                    <div className="space-y-6">
                      {/* Offer Form */}
                      <Card className="border border-dashed bg-muted/30">
                      <CardHeader>
                        <CardTitle className="text-base">
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
                    </div>
                    {/* Offers List */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-semibold">Current Offers</h3>
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
                          <h3 className="text-base font-medium mb-2">No offers yet</h3>
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
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
            
            {activeSection === "announcements" && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="manage-announcements" className="border border-gray-200 rounded-xl overflow-hidden mb-4 transition-all hover:shadow-md hover:border-primary/30">
                  <AccordionTrigger className="p-0">
                    <div className="p-6 bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 transition-colors">
                      <div className="flex items-center gap-3 pb-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                          <Bell className="w-5 h-5 text-cyan-600" />
                          Manage Announcements
                        </h3>
                      </div>
                      <div className="pt-2">
                        <p className="text-sm text-slate-600">Create and manage store announcements</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 bg-white border-t border-gray-200">
                    <div className="space-y-6">
                      {/* Announcement Form */}
                      <Card className="border border-dashed bg-muted/30">
                        <CardHeader>
                          <CardTitle className="text-base">Create New Announcement</CardTitle>
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
                          <h3 className="text-base font-semibold">Current Announcements</h3>
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
                            <h3 className="text-base font-medium mb-2">No announcements yet</h3>
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
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {/* Sales Reporting Section */}
            {activeSection === "sales-reporting" && (
              <SalesReporting />
            )}

            {activeSection === "features" && (
              <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Feature Flags
                    </h3>
                  </div>
                  <div className="pt-4">
                    <FeatureFlagsPanel />
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </motion.main>
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
