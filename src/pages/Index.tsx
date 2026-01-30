import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/integrations/firebase/config";
import { collection, getDocs, query, where, orderBy, doc, getDoc, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/product/ProductCard";
import CategoryCard from "@/components/common/CategoryCard";
import { ProductFilters } from "@/components/product/ProductFilters";
import { StockStatus } from "@/components/common/StockStatus";
import { ProductFilterSidebar } from "@/components/product/ProductFilterSidebar";
import { SortDropdown } from "@/components/product/SortDropdown";
import { ShieldCheck, Search, Store, Package, Heart, User, LogOut, LogIn, Pill, Star, ChevronDown, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { whatsappService } from "@/services/whatsappService";
import { ShoppingCart } from "@/components/common/ShoppingCart";
import { ProductRecommendations } from "@/components/product/ProductRecommendations";
import { HeroBanner } from "@/components/layout/HeroBanner";
import { SearchPopup } from "@/components/common/SearchPopup";
import { useWishlist } from "@/hooks/useWishlist";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import StoreReviewForm from "@/components/user/StoreReviewForm";
import StoreReviews from "@/components/user/StoreReviews";
import RequestMedicineSheet from "@/components/common/RequestMedicineSheet";
import { MobileMenu } from "@/components/layout/MobileMenu";
import LogoutButton from "@/components/common/LogoutButton";
import MobileAnnouncementBanner from "@/components/layout/MobileAnnouncementBanner";
import MobileSearchTabs from "@/components/layout/MobileSearchTabs";
import MobileCategoryCard from "@/components/common/MobileCategoryCard";
import MobileProductCard from "@/components/product/MobileProductCard";
import AnnouncementMarquee from "@/components/layout/AnnouncementMarquee";
import logoImage from "@/assets/Logo.png";
import NotificationBell from "@/components/common/NotificationBell";
import { LoginPopup } from "@/components/user/LoginPopup";
import { UnifiedAuth } from "@/components/common/UnifiedAuth";
import { QuickLinksSidebar } from "@/components/layout/QuickLinksSidebar";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { CustomerAccountDropdown } from "@/components/common/CustomerAccountDropdown";
import CustomerLoginModal from "@/components/common/CustomerLoginModal";
import { UserAccountDropdown } from "@/components/common/UserAccountDropdown";
import CompleteFooter from "@/components/layout/CompleteFooter";
import CommonHeader from "@/components/layout/CommonHeader";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, useScroll, useTransform, useReducedMotion, useAnimation, useInView } from "framer-motion";

import allergyAnim from "@/assets/animations/category-allergy.json";
import antibioticsAnim from "@/assets/animations/category-antibiotics.json";
import babyAnim from "@/assets/animations/category-baby.json";
import coldFluAnim from "@/assets/animations/category-cold-flu.json";
import painAnim from "@/assets/animations/category-pain.json";
import vitaminsAnim from "@/assets/animations/category-vitamins.json";

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Product {
  id: string;
  name: string;
  original_price: number;
  image_url?: string;
  in_stock: boolean;
  stock_quantity?: number;
  requires_prescription?: boolean;
  category_id: string;
  average_rating?: number;
  review_count?: number;
  categories?: {
    name: string;
  };
  discount_percentage?: number;
}



export interface FilterOptions {
  priceRange: [number, number];
  categories: string[];
  stockStatus: 'all' | 'in-stock' | 'out-of-stock';
  onSale: boolean;
}

type SortOption =
  | 'price-low-high'
  | 'price-high-low'
  | 'name-a-z'
  | 'name-z-a'
  | 'newest-first'
  | 'discount-high';

interface Product {
  id: string;
  name: string;
  category_id: string;
  original_price: number;
  image_url?: string;
  in_stock: boolean;
  brand?: string;
  medicine_type?: string;
  expiry_date?: string;
  requires_prescription?: boolean;
  stock_quantity?: number;
  average_rating?: number;
  review_count?: number;
  categories?: {
    name: string;
  };
  discount_percentage?: number;
}



const categoryAnimations: Record<string, any> = {
  "Baby Products": babyAnim,
  "Allergy": allergyAnim,
  "Cold & Flu": coldFluAnim,
  "Antibiotics": antibioticsAnim,
  "Pain Relief": painAnim,
  "Vitamins": vitaminsAnim,
  "Proton Pump Inhibitor": painAnim,
};

const Index = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, signOut, checkAuth, user, isAdmin } = useAuth();
  const { user: customerUser, isAuthenticated: isCustomerAuthenticated, isLoading: isCustomerLoading, initializeAuth: initializeCustomerAuth, signIn, signUp, signOut: customerSignOut, forgotPassword, updateProfile } = useCustomerAuth();
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();

  // Animation controls for scroll effects
  const headerControls = useAnimation();
  const heroControls = useAnimation();

  // Refs for scroll-triggered animations
  const categoriesRef = useRef(null);
  const productsRef = useRef(null);
  const recommendationsRef = useRef(null);
  const footerRef = useRef(null);

  const isCategoriesInView = useInView(categoriesRef, { once: false, margin: "-20% 0px" });
  const isProductsInView = useInView(productsRef, { once: false, margin: "-20% 0px" });
  const isRecommendationsInView = useInView(recommendationsRef, { once: false, margin: "-20% 0px" });
  const isFooterInView = useInView(footerRef, { once: false, margin: "-20% 0px" });

  // Scroll direction detection
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Apply header animation based on scroll direction
  useEffect(() => {
    if (prefersReducedMotion) return;

    // Always keep header visible - removed the hiding behavior when scrolling down
    headerControls.start({
      y: 0,
      transition: { duration: 0.3 }
    });
  }, [headerControls, prefersReducedMotion]);

  useEffect(() => {
    checkAuth();
    initializeCustomerAuth();
  }, []);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [searchQuery, setSearchQuery] = useState(""); // For header search bar
  const [productsSearchQuery, setProductsSearchQuery] = useState(""); // For products section search bar
  const [productsSectionFiltered, setProductsSectionFiltered] = useState<Product[]>([]); // For products section search results
  const [loading, setLoading] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const { deliveryEnabled } = useFeatureFlags();
  const { loadWishlist, items: wishlistItems } = useWishlist();
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [isSearchResult, setIsSearchResult] = useState(false); // Track if popup is from search vs direct product view
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState("popular");

  // Filter and sort state
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({
    priceRange: [0, 1000],
    categories: [],
    stockStatus: 'all',
    onSale: false
  });
  const [currentSort, setCurrentSort] = useState<SortOption>('price-low-high');

  const handleSortChange = (sortValue: string) => {
    setCurrentSort(sortValue as SortOption);
  };

  // Calculate min/max prices from products
  const minPrice = Math.min(...products.map(p => p.original_price || 0));
  const maxPrice = Math.max(...products.map(p => p.original_price || 0));

  // Initialize default filter values
  useEffect(() => {
    if (products.length > 0) {
      setCurrentFilters(prev => ({
        ...prev,
        priceRange: [Math.floor(minPrice), Math.ceil(maxPrice)]
      }));
    }
  }, [products, minPrice, maxPrice]);

  // Function to get category name by ID
  const getCategoryNameById = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : '';
  };

  // Function to get animation data for a category
  const getCategoryAnimation = (categoryName: string) => {
    // Return specific animation if exists, otherwise default to pain animation
    return categoryAnimations[categoryName] || painAnim;
  };

  useEffect(() => {
    fetchData();
    whatsappService.initialize();
    if (deliveryEnabled) {
      loadWishlist();
    }
  }, [deliveryEnabled]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const categoriesSnapshot = await getDocs(collection(db, "categories"));
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];

      // Sort categories by name
      categoriesData.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(categoriesData);

      // Fetch products (without category filter)
      const q = query(collection(db, "products"), orderBy("name"));

      const productsSnapshot = await getDocs(q);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      setProducts(productsData);
      setProductsSectionFiltered(productsData);

      // Fetch discount
      const settingsRef = doc(db, "settings", "store");
      const settingsSnap = await getDoc(settingsRef);

      if (settingsSnap.exists()) {
        setDiscountPercentage(settingsSnap.data().discount_percentage || 0);
      }
    } catch (error: any) {
      toast.error("Failed to load store data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Apply search filter for header search only
  let searchFiltered = products;
  if (searchQuery.trim()) {
    searchFiltered = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.categories && product.categories.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }

  // Apply filters (excluding header search filter for products section)
  let filtered = products;

  // Price range filter
  filtered = filtered.filter(product =>
    product.original_price >= currentFilters.priceRange[0] &&
    product.original_price <= currentFilters.priceRange[1]
  );

  // Category filter
  if (currentFilters.categories.length > 0) {
    filtered = filtered.filter(product =>
      currentFilters.categories.includes(product.category_id || '')
    );
  }

  // Stock status filter
  if (currentFilters.stockStatus !== 'all') {
    if (currentFilters.stockStatus === 'in-stock') {
      filtered = filtered.filter(product => product.in_stock);
    } else if (currentFilters.stockStatus === 'out-of-stock') {
      filtered = filtered.filter(product => !product.in_stock);
    }
  }

  // On sale filter
  if (currentFilters.onSale) {
    filtered = filtered.filter(product =>
      (product.discount_percentage && product.discount_percentage > 0)
    );
  }

  // Apply mobile tab filtering
  let tabFiltered = [...filtered];
  
  switch (activeMobileTab) {
    case 'popular':
      // Sort by review count or popularity (using ID as proxy for now)
      tabFiltered.sort((a, b) => b.id.localeCompare(a.id));
      break;
    case 'offers':
      // Show products with discounts
      tabFiltered = tabFiltered.filter(product => 
        product.discount_percentage && product.discount_percentage > 0
      );
      break;
    case 'new':
      // Show newer products (using ID as proxy)
      tabFiltered.sort((a, b) => b.id.localeCompare(a.id));
      break;
    case 'prescriptions':
      // Show prescription required products
      tabFiltered = tabFiltered.filter(product => 
        product.requires_prescription === true
      );
      break;
    default:
      break;
  }

  // Apply sorting
  const sortedProducts = [...tabFiltered];

  switch (currentSort) {
    case 'price-low-high':
      sortedProducts.sort((a, b) => (a.original_price || 0) - (b.original_price || 0));
      break;
    case 'price-high-low':
      sortedProducts.sort((a, b) => (b.original_price || 0) - (a.original_price || 0));
      break;
    case 'name-a-z':
      sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-z-a':
      sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'newest-first':
      // Since we don't have date field, we'll sort by ID as proxy
      sortedProducts.sort((a, b) => b.id.localeCompare(a.id));
      break;
    case 'discount-high':
      sortedProducts.sort((a, b) =>
        (b.discount_percentage || 0) - (a.discount_percentage || 0)
      );
      break;
    default:
      break;
  }

  const filteredProducts = sortedProducts;

  // Products for the products section (without header search filtering)
  let productsSectionBase = products;

  // Apply filters to products section base (excluding header search)
  // Price range filter
  productsSectionBase = productsSectionBase.filter(product =>
    product.original_price >= currentFilters.priceRange[0] &&
    product.original_price <= currentFilters.priceRange[1]
  );

  // Category filter
  if (currentFilters.categories.length > 0) {
    productsSectionBase = productsSectionBase.filter(product =>
      currentFilters.categories.includes(product.category_id || '')
    );
  }

  // Stock status filter
  if (currentFilters.stockStatus !== 'all') {
    if (currentFilters.stockStatus === 'in-stock') {
      productsSectionBase = productsSectionBase.filter(product => product.in_stock);
    } else if (currentFilters.stockStatus === 'out-of-stock') {
      productsSectionBase = productsSectionBase.filter(product => !product.in_stock);
    }
  }

  // On sale filter
  if (currentFilters.onSale) {
    productsSectionBase = productsSectionBase.filter(product =>
      (product.discount_percentage && product.discount_percentage > 0)
    );
  }

  // Apply sorting
  const productsSectionSorted = [...productsSectionBase];

  switch (currentSort) {
    case 'price-low-high':
      productsSectionSorted.sort((a, b) => (a.original_price || 0) - (b.original_price || 0));
      break;
    case 'price-high-low':
      productsSectionSorted.sort((a, b) => (b.original_price || 0) - (a.original_price || 0));
      break;
    case 'name-a-z':
      productsSectionSorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-z-a':
      productsSectionSorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'newest-first':
      // Since we don't have date field, we'll sort by ID as proxy
      productsSectionSorted.sort((a, b) => b.id.localeCompare(a.id));
      break;
    case 'discount-high':
      productsSectionSorted.sort((a, b) =>
        (b.discount_percentage || 0) - (a.discount_percentage || 0)
      );
      break;
    default:
      break;
  }

  const productsSectionFilteredBase = productsSectionSorted;

  // Debounced search tracking function
  const trackSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;

    const resultsCount = filteredProducts.length;

    // Log the search
    await whatsappService.logSearch(query, resultsCount);

    // If no results found, track as unavailable medicine
    if (resultsCount === 0) {
      await whatsappService.trackUnavailableMedicine(query);
    }
  }, [filteredProducts.length]);

  // Handle search input change with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleSearchValueChange(value);
  };

  // Wrapper function for CommonHeader search change
  const handleSearchValueChange = (value: string) => {
    setSearchQuery(value);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // If there's text, show suggestions
    if (value.trim()) {
      setShowSuggestions(true);
      fetchSuggestions(value);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }

    // Set new timeout for tracking
    const timeout = setTimeout(() => {
      trackSearch(value);
    }, 1000); // 1 second delay

    setSearchTimeout(timeout);
  };

  // Fetch autocomplete suggestions
  const fetchSuggestions = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    try {
      // Get products that start with the searchTerm
      const productsQuery = query(
        collection(db, "products"),
        where("name", ">=", searchTerm),
        where("name", "<=", searchTerm + "\uf8ff"),
        limit(5)
      );

      const querySnapshot = await getDocs(productsQuery);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as Product[];

      setSuggestions(productsData);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (product: Product) => {
    setSearchQuery(product.name);
    setShowSuggestions(false);
    setIsSearchResult(false); // This is a direct product view, not a search result
    setShowSearchPopup(true);
    trackSearch(product.name);
  };

  // Handle search submission (Enter key or button click)
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      setIsSearchResult(true); // This is from a search
      setShowSearchPopup(true);
      trackSearch(searchQuery);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSuggestions) {
        const searchContainer = document.querySelector('.search-container');
        // Don't close if clicking on a suggestion or within the suggestions dropdown
        const suggestionsDropdown = document.querySelector('.absolute.top-full');

        if (searchContainer && !searchContainer.contains(event.target as Node) &&
          suggestionsDropdown && !suggestionsDropdown.contains(event.target as Node)) {
          setShowSuggestions(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Handle search input change for products section search bar
  const handleProductsSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProductsSearchQuery(value);
  };

  // Handle search submission for products section search bar
  const handleProductsSearchSubmit = () => {
    if (productsSearchQuery.trim()) {
      // Filter products based on search query without affecting header search
      const filtered = productsSectionFilteredBase.filter(product =>
        product.name.toLowerCase().includes(productsSearchQuery.toLowerCase()) ||
        (product.brand && product.brand.toLowerCase().includes(productsSearchQuery.toLowerCase())) ||
        (product.categories && product.categories.name.toLowerCase().includes(productsSearchQuery.toLowerCase()))
      );
      setProductsSectionFiltered(filtered);
    } else {
      // Show all products when search is cleared
      setProductsSectionFiltered(productsSectionFilteredBase);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Quick Links Sidebar - Only show when authenticated */}
      {isAuthenticated && <QuickLinksSidebar />}

      <CommonHeader 
        showSearchBar={true}
        searchQuery={searchQuery}
        onSearchChange={handleSearchValueChange}
        onSearchSubmit={handleSearchSubmit}
        suggestions={suggestions}
        showSuggestions={showSuggestions}
        onSuggestionSelect={handleSuggestionSelect}
      />

      {/* Mobile Announcement Banner */}
      <div className="md:hidden">
        <MobileAnnouncementBanner />
      </div>

      {/* Desktop Announcement Marquee */}
      <div className="hidden md:block">
        <AnnouncementMarquee />
      </div>

      {/* Hidden UnifiedAuth trigger for mobile */}
      <div className="hidden">
        <UnifiedAuth
          trigger={
            <button id="mobile-unified-login-trigger" />
          }
        />
      </div>

      {/* Hero Banner */}
      <HeroBanner discountPercentage={discountPercentage} />

      {/* Search Popup */}
      <SearchPopup
        searchQuery={searchQuery}
        isOpen={showSearchPopup}
        onClose={() => {
          setShowSearchPopup(false);
          setIsSearchResult(false); // Reset search context
          // Clear the search query when closing the popup to show all products
          setSearchQuery("");
        }}
        showBackButton={isSearchResult} // Only show back button when it's actually a search result
      />

      <div className="container mx-auto px-4 py-6"> 
        {/* Categories Section with scroll-triggered animation */}
        <motion.section
          ref={categoriesRef}
          className="mb-16"
          initial="hidden"
          animate={isCategoriesInView ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                staggerChildren: 0.1,
                duration: 0.5
              }
            }
          }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-1">Explore by Category</h2>
              <p className="text-muted-foreground text-sm">Browse our wide range of healthcare products</p>
            </div>
          </div>
          {/* Mobile Categories Grid */}
          <div className="md:hidden grid grid-cols-2 gap-4">
            {(() => {
              const displayedCategories = showAllCategories ? categories : categories.slice(0, 4);

              return displayedCategories.map((category) => {
                const productCount = products.filter(p => p.category_id === category.id).length;
                return (
                  <MobileCategoryCard
                    key={category.id}
                    id={category.id}
                    name={category.name}
                    description={category.description}
                    animationData={getCategoryAnimation(category.name)}
                    productCount={productCount}
                  />
                );
              });
            })()}
          </div>

          {/* Mobile View All Button */}
          <div className="md:hidden flex justify-center mt-6">
            {(() => {
              if (categories.length <= 4) return null;
              return (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm"
                  onClick={() => setShowAllCategories(!showAllCategories)}
                >
                  {showAllCategories ? 'View Less' : `View All (${categories.length})`}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${showAllCategories ? 'rotate-180' : ''}`}
                  />
                </Button>
              );
            })()}
          </div>

          {/* Desktop Categories Grid */}
          <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                id={category.id}
                name={category.name}
                description={category.description}
                animationData={getCategoryAnimation(category.name)}
                productCount={products.filter(p => p.category_id === category.id).length}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              />
            ))}
          </div>
        </motion.section>

        {/* Mobile Search Tabs */}
        <div className="md:hidden mb-6">
          <MobileSearchTabs 
            activeTab={activeMobileTab}
            onTabChange={setActiveMobileTab}
          />
        </div>

        {/* Desktop Search Bar and Filters */}
        <section className="hidden md:block mb-12">
          <div className="relative max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="search"
                placeholder="Search for medicines, health products, brands..."
                className="pl-10 pr-20 h-12 text-sm rounded-xl border-2 border-muted shadow-sm focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
                value={productsSearchQuery}
                onChange={handleProductsSearchChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleProductsSearchSubmit();
                  }
                }}
              />
              <motion.button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-lg px-4 h-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 text-sm font-medium shadow-sm"
                onClick={handleProductsSearchSubmit}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                Search
              </motion.button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <motion.button className="rounded-full px-3 py-1.5 text-xs border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors duration-300"
                whileHover={{ y: -2 }}
                whileTap={{ y: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                Popular
              </motion.button>
              <motion.button className="rounded-full px-3 py-1.5 text-xs border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors duration-300"
                whileHover={{ y: -2 }}
                whileTap={{ y: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                Offers
              </motion.button>
              <motion.button className="rounded-full px-3 py-1.5 text-xs border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors duration-300"
                whileHover={{ y: -2 }}
                whileTap={{ y: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                New Arrivals
              </motion.button>
              <motion.button className="rounded-full px-3 py-1.5 text-xs border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors duration-300"
                whileHover={{ y: -2 }}
                whileTap={{ y: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                Prescriptions
              </motion.button>
            </div>
          </div>
        </section>

        {/* Products Grid with scroll-triggered animation */}
        <motion.section
          ref={productsRef}
          className="mb-8"
          initial="hidden"
          animate={isProductsInView ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.03,
                duration: 0.4
              }
            }
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                All Products
              </h2>
              <p className="text-muted-foreground text-sm">
                {(productsSearchQuery ? productsSectionFiltered.length : filteredProducts.length)} product{(productsSearchQuery ? productsSectionFiltered.length : filteredProducts.length) !== 1 ? 's' : ''} available
              </p>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setShowFilterSidebar(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <line x1="4" y1="21" x2="4" y2="14"></line>
                  <line x1="4" y1="10" x2="4" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12" y2="3"></line>
                  <line x1="20" y1="21" x2="20" y2="16"></line>
                  <line x1="20" y1="12" x2="20" y2="3"></line>
                  <line x1="1" y1="14" x2="7" y2="14"></line>
                  <line x1="9" y1="8" x2="15" y2="8"></line>
                  <line x1="17" y1="16" x2="23" y2="16"></line>
                </svg>
                Filter {currentFilters.categories.length > 0 ||
                  currentFilters.stockStatus !== 'all' ||
                  currentFilters.onSale ||
                  currentFilters.priceRange[0] !== minPrice ||
                  currentFilters.priceRange[1] !== maxPrice ?
                  `(${[
                    currentFilters.categories.length > 0 ? 1 : 0,
                    currentFilters.stockStatus !== 'all' ? 1 : 0,
                    currentFilters.onSale ? 1 : 0,
                    currentFilters.priceRange[0] !== minPrice || currentFilters.priceRange[1] !== maxPrice ? 1 : 0
                  ].filter(Boolean).length})` : ''}
              </Button>
              <SortDropdown
                onSortChange={handleSortChange}
                currentSort={currentSort}
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-muted-foreground text-sm">Loading products...</p>
            </div>
          ) : (productsSearchQuery ? productsSectionFiltered.length === 0 : filteredProducts.length === 0) ? (
            <motion.div
              className="text-center py-12 rounded-xl bg-muted/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-1">No products found</h3>
              <p className="text-muted-foreground text-sm mb-4">Try adjusting your search or filter criteria</p>
              <motion.button onClick={() => {
                if (productsSearchQuery) {
                  setProductsSearchQuery("");
                  setProductsSectionFiltered(products);
                } else {
                  setSearchQuery("");
                }
              }} className="rounded-full h-8 px-4 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                Clear Search
              </motion.button>
            </motion.div>
          ) : (
            <>
              {/* Mobile Products Grid */}
              <div className="md:hidden grid grid-cols-2 gap-4">
                {(showAllProducts ? (productsSearchQuery ? productsSectionFiltered : productsSectionFilteredBase) : (productsSearchQuery ? productsSectionFiltered.slice(0, 4) : productsSectionFilteredBase.slice(0, 4))).map((product) => (
                  <MobileProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    original_price={product.original_price}
                    discountPercentage={discountPercentage}
                    image_url={product.image_url}
                    in_stock={product.in_stock}
                    quantity={product.stock_quantity || 0}
                    requires_prescription={product.requires_prescription}
                    category_animation_data={product.category_id ? getCategoryAnimation(getCategoryNameById(product.category_id)) : undefined}
                    onClick={() => {
                      // Don't auto-fill search query - just show product popup
                      setIsSearchResult(false); // Not a search result, direct product view
                      setShowSearchPopup(true);
                    }}
                    showRequestOption={false}
                  />
                ))}
              </div>
              {(productsSearchQuery ? productsSectionFiltered.length > 4 : productsSectionFilteredBase.length > 4) && (
                <div className="md:hidden flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllProducts(!showAllProducts)}
                    className="text-sm"
                  >
                    {showAllProducts ? 'View Less' : `View All (${productsSearchQuery ? productsSectionFiltered.length : productsSectionFilteredBase.length})`}
                  </Button>
                </div>
              )}


              {/* Desktop Products Grid */}
              <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {(productsSearchQuery ? productsSectionFiltered : productsSectionFilteredBase).map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    original_price={product.original_price}
                    discountPercentage={discountPercentage}
                    image_url={product.image_url}
                    in_stock={product.in_stock}
                    quantity={product.stock_quantity || 0}
                    requires_prescription={product.requires_prescription}
                    category_animation_data={product.category_id ? getCategoryAnimation(getCategoryNameById(product.category_id)) : undefined}
                    onClick={() => {
                      setSearchQuery(product.name);
                      setIsSearchResult(false); // Not a search result, direct product view
                      setShowSearchPopup(true);
                    }}
                    showRequestOption={false}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </motion.section>

        {/* Filter Sidebar */}
        <ProductFilterSidebar
          isOpen={showFilterSidebar}
          onClose={() => setShowFilterSidebar(false)}
          onFilterChange={setCurrentFilters}
          products={products}
          categories={categories}
          currentFilters={currentFilters}
        />

        {/* Product Recommendations */}
        {isAuthenticated && deliveryEnabled && (
          <section className="mb-8">
            <ProductRecommendations
              onProductClick={(productName) => {
                setSearchQuery(productName);
                setIsSearchResult(false); // Not a search result, direct product view
                setShowSearchPopup(true);
              }}
            />
          </section>
        )}
      </div>

      {/* Reviews Dialog */}
      <Dialog open={showReviews} onOpenChange={setShowReviews}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0 gap-0 border-none shadow-2xl">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <Star className="w-5 h-5" />
                </span>
                Store Reviews
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-50 p-6 relative max-h-[calc(90vh-100px)]">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
              backgroundSize: '30px 30px',
              opacity: 0.3
            }}></div>
            <div className="relative z-10">
              <StoreReviews />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      
      <CompleteFooter />
    </div>
  );
};

export default Index;
