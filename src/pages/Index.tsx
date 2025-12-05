import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/integrations/firebase/config";
import { collection, getDocs, query, where, orderBy, doc, getDoc, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import { ProductFilters, FilterOptions } from "@/components/ProductFilters";
import { StockStatus } from "@/components/StockStatus";
import { ShieldCheck, Search, Store, Package, Heart, User, LogOut, LogIn, Pill, Star } from "lucide-react";
import { toast } from "sonner";
import { whatsappService } from "@/services/whatsappService";
import { ShoppingCart } from "@/components/ShoppingCart";
import { NotificationBell } from "@/components/NotificationBell";
import { ProductRecommendations } from "@/components/ProductRecommendations";
import { HeroBanner } from "@/components/HeroBanner";
import { SearchPopup } from "@/components/SearchPopup";
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
import StoreReviewForm from "@/components/StoreReviewForm";
import StoreReviews from "@/components/StoreReviews";
import RequestMedicineSheet from "@/components/RequestMedicineSheet";
import { MobileMenu } from "@/components/MobileMenu";
import AnnouncementMarquee from "@/components/AnnouncementMarquee";
import KalyanamLogo from "@/components/svgs/KalyanamLogo";
import { LoginPopup } from "@/components/LoginPopup";
import { QuickLinksSidebar } from "@/components/QuickLinksSidebar";
import babyImage from "@/assets/category-baby.jpg";
import allergyImage from "@/assets/category-allergy.jpg";
import coldFluImage from "@/assets/category-cold-flu.jpg";
import antibioticsImage from "@/assets/category-antibiotics.jpg";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, useScroll, useTransform, useReducedMotion, useAnimation, useInView } from "framer-motion";

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Product {
  id: string;
  name: string;
  category_id?: string;
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
}

const categoryImages: Record<string, string> = {
  "Baby Products": babyImage,
  "Allergy": allergyImage,
  "Cold & Flu": coldFluImage,
  "Antibiotics": antibioticsImage,
};

const Index = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, signOut, checkAuth, user } = useAuth();
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
  }, []);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [searchQuery, setSearchQuery] = useState(""); // For header search bar
  const [productsSearchQuery, setProductsSearchQuery] = useState(""); // For products section search bar
  const [loading, setLoading] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const { deliveryEnabled } = useFeatureFlags();
  const { loadWishlist, items: wishlistItems } = useWishlist();
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

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

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    setShowSearchPopup(true);
    trackSearch(product.name);
  };

  // Handle search submission (Enter key or button click)
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      setShowSearchPopup(true);
      trackSearch(searchQuery);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSuggestions) {
        const searchContainer = document.querySelector('.relative.w-full');
        if (searchContainer && !searchContainer.contains(event.target as Node)) {
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
      setSearchQuery(productsSearchQuery); // Sync with main search query to show results
      setShowSearchPopup(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Quick Links Sidebar - Only show when authenticated */}
      {isAuthenticated && <QuickLinksSidebar />}
      
      {/* Header with scroll-aware animation */}
      <motion.header 
        className="sticky top-0 z-50 bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg"
        initial={{ y: prefersReducedMotion ? 0 : -100 }}
        animate={headerControls}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          mass: 1
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm border border-white/10 shadow-lg">
                <KalyanamLogo className="w-8 h-8" />
              </div>
              <div>
                {/* Desktop view - Full business name */}
                <h1 className="hidden md:block text-2xl font-bold">Kalyanam Pharmaceuticals</h1>
                <p className="hidden md:block text-sm text-primary-foreground/90">Your Trusted Healthcare Partner</p>
                
                {/* Mobile view - Shortened business name */}
                <div className="md:hidden">
                  <h1 className="text-xl font-bold">Kalyanam</h1>
                  <p className="text-[0.6rem] text-primary-foreground/90 uppercase tracking-wider">Pharmaceuticals</p>
                </div>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-1">
              <Button 
                variant="ghost" 
                className="text-primary-foreground hover:bg-white/20"
                onClick={() => setShowReviews(true)}
              >
                Reviews
              </Button>
              {isAuthenticated && (
                <Button 
                  variant="ghost" 
                  className="text-primary-foreground hover:bg-white/20"
                  onClick={() => navigate("/owner#manage-products")}
                >
                  Inventory
                </Button>
              )}
              {!isAuthenticated && (
                <RequestMedicineSheet>
                  <Button variant="ghost" className="text-primary-foreground hover:bg-white/20">
                    Request Medicine
                  </Button>
                </RequestMedicineSheet>
              )}
            </nav>
                
            {/* Search Box - Hidden on mobile */}
            <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-foreground/70 w-4 h-4 z-10" />
                <Input
                  type="search"
                  placeholder="Search medicines..."
                  className="pl-10 pr-12 py-2 w-full rounded-full bg-white/20 border-none text-primary-foreground placeholder:text-primary-foreground/70 focus-visible:ring-2 focus-visible:ring-white/50"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchSubmit();
                    }
                  }}
                />
                <motion.button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full p-1 text-primary-foreground hover:bg-white/20 z-10"
                  onClick={handleSearchSubmit}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Search className="w-4 h-4" />
                </motion.button>
              </div>
              
              {/* Autocomplete Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border z-50 max-h-60 overflow-y-auto">
                  {suggestions.map((product) => (
                    <div
                      key={product.id}
                      className="px-4 py-3 hover:bg-muted cursor-pointer flex items-center gap-3 border-b border-muted last:border-b-0"
                      onClick={() => handleSuggestionSelect(product)}
                    >
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-foreground truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            ₹{product.original_price.toFixed(2)}
                          </p>
                          {!product.in_stock && (
                            <span className="text-xs text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
                
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <NotificationBell />
              
              {/* Owner Login/Logout buttons on the extreme right */}
              <div className="hidden md:flex items-center gap-1">
                {isAuthenticated ? (
                  <>
                    <motion.button 
                      className="rounded-full px-4 py-2 text-primary-foreground hover:bg-white/20 transition-colors font-medium"
                      onClick={() => navigate("/owner")}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      Dashboard
                    </motion.button>
                    <motion.button 
                      className="rounded-full p-2 transition-colors flex items-center justify-center bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={async () => {
                        await signOut();
                        toast.success("Logged out successfully");
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </motion.button>
                  </>
                ) : (
                  <LoginPopup
                    trigger={
                      <motion.button 
                        className="rounded-full px-4 py-2 text-primary-foreground hover:bg-white/20 transition-colors font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        Owner Login
                      </motion.button>
                    }
                  />
                )}
              </div>

              <div className="hidden md:flex items-center gap-1">
                {deliveryEnabled && (
                  <motion.button 
                    className="rounded-full p-2 text-primary-foreground hover:bg-white/20 transition-colors"
                    onClick={() => navigate("/wishlist")}
                    title="Wishlist"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Heart className="w-5 h-5" />
                    {wishlistItems.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-white text-primary rounded-full w-5 h-5 text-xs flex items-center justify-center">
                        {wishlistItems.length}
                      </span>
                    )}
                  </motion.button>
                )}
              </div>
        
              <div title="Shopping Cart">
                <ShoppingCart discountPercentage={discountPercentage} />
              </div>
              
              {/* Mobile menu button - Pass onReviewsClick and onOwnerLoginClick props */}
              <MobileMenu 
                onReviewsClick={() => setShowReviews(true)}
                onOwnerLoginClick={() => document.getElementById('mobile-owner-login-trigger')?.click()}
              />
            </div>
          </div>
          
          {/* Mobile Search Box - Visible only on mobile */}
          <div className="md:hidden mt-3 px-2 relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-foreground/70 w-4 h-4 z-10" />
              <Input
                type="search"
                placeholder="Search medicines..."
                className="pl-10 pr-12 py-2 w-full rounded-full bg-white/20 border-none text-primary-foreground placeholder:text-primary-foreground/70 focus-visible:ring-2 focus-visible:ring-white/50"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit();
                  }
                }}
              />
              <motion.button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full p-1 text-primary-foreground hover:bg-white/20 z-10"
                onClick={handleSearchSubmit}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Search className="w-4 h-4" />
              </motion.button>
            </div>
            
            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border z-50 max-h-60 overflow-y-auto">
                {suggestions.map((product) => (
                  <div
                    key={product.id}
                    className="px-4 py-3 hover:bg-muted cursor-pointer flex items-center gap-3 border-b border-muted last:border-b-0"
                    onClick={() => handleSuggestionSelect(product)}
                  >
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          ₹{product.original_price.toFixed(2)}
                        </p>
                        {!product.in_stock && (
                          <span className="text-xs text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* Announcement Marquee */}
      <AnnouncementMarquee />

      {/* Hidden LoginPopup trigger for mobile */}
      <div className="hidden">
        <LoginPopup
          trigger={
            <button id="mobile-owner-login-trigger" />
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
          // Clear the search query when closing the popup to show all products
          setSearchQuery("");
        }} 
      />

      <div className="container mx-auto px-4 py-12">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                id={category.id}
                name={category.name}
                description={category.description}
                imageUrl={categoryImages[category.name]}
                productCount={products.filter(p => p.category_id === category.id).length}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              />
            ))}
          </div>
        </motion.section>

        {/* Search Bar and Filters */}
        <section className="mb-12">
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
          className="mb-16"
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                All Products
              </h2>
              <p className="text-muted-foreground text-sm">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} available
              </p>
            </div>
            <div className="flex gap-2">
              <motion.button className="rounded-full hidden sm:flex border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors duration-300 h-8 px-3 text-xs"
                whileHover={{ y: -2 }}
                whileTap={{ y: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
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
                Filter
              </motion.button>
              <motion.button className="rounded-full hidden sm:flex border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors duration-300 h-8 px-3 text-xs"
                whileHover={{ y: -2 }}
                whileTap={{ y: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <path d="m3 16 4 4 4-4"></path>
                  <path d="M7 20V4"></path>
                  <path d="m21 8-4-4-4 4"></path>
                  <path d="M17 4v16"></path>
                </svg>
                Sort
              </motion.button>
              <motion.button className="rounded-full sm:hidden border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors duration-300 h-8 w-8"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              </motion.button>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-muted-foreground text-sm">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
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
              <motion.button onClick={() => setSearchQuery("")} className="rounded-full h-8 px-4 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                Clear Search
              </motion.button>
            </motion.div>
          ) : (
            <motion.div 
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.03
                  }
                }
              }}
            >
              {filteredProducts.map((product) => (
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
                  onClick={() => {
                    setSearchQuery(product.name);
                    setShowSearchPopup(true);
                  }}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                />
              ))}
            </motion.div>
          )}
        </motion.section>

        {/* Product Recommendations */}
        <section className="mb-16">
          <ProductRecommendations 
            onProductClick={(productName) => {
              setSearchQuery(productName);
              setShowSearchPopup(true);
            }}
          />
        </section>
      </div>

      {/* Reviews Dialog */}
      <Dialog open={showReviews} onOpenChange={setShowReviews}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Store Reviews</DialogTitle>
          </DialogHeader>
          <StoreReviews />
        </DialogContent>
      </Dialog>

      {/* Footer with scroll-triggered animation */}
      <motion.footer 
        ref={footerRef}
        className="bg-muted py-12 mt-16 border-t"
        initial="hidden"
        animate={isFooterInView ? "visible" : "hidden"}
        variants={{
          visible: { opacity: 1, y: 0 },
          hidden: { opacity: 0, y: 20 }
        }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-16">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            <motion.div className="space-y-4" variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-md">
                  <Store className="w-6 h-6 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Kalyanam Pharmaceuticals</h2>
              </div>
              <p className="text-muted-foreground text-sm">
                Your trusted healthcare partner delivering quality pharmaceutical products and expert solutions right to your doorstep.
              </p>
              <div className="flex gap-3">
                <motion.button className="rounded-full p-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground" whileHover={{ y: -3 }} whileTap={{ y: 1 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </motion.button>
                <motion.button className="rounded-full p-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground" whileHover={{ y: -3 }} whileTap={{ y: 1 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </motion.button>
                <motion.button className="rounded-full p-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground" whileHover={{ y: -3 }} whileTap={{ y: 1 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </motion.button>
              </div>
            </motion.div>
            
            <motion.div variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <motion.button 
                    onClick={() => navigate("/")} 
                    className="text-left text-muted-foreground hover:text-primary transition-colors text-sm w-full"
                    whileHover={{ x: 5 }}
                  >
                    Home
                  </motion.button>
                </li>
                <li>
                  <motion.button 
                    onClick={() => navigate("/about")} 
                    className="text-left text-muted-foreground hover:text-primary transition-colors text-sm w-full"
                    whileHover={{ x: 5 }}
                  >
                    About Us
                  </motion.button>
                </li>
                <li>
                  <motion.button 
                    onClick={() => navigate("/products")} 
                    className="text-left text-muted-foreground hover:text-primary transition-colors text-sm w-full"
                    whileHover={{ x: 5 }}
                  >
                    Products
                  </motion.button>
                </li>
                <li>
                  <motion.button 
                    onClick={() => navigate("/offers")} 
                    className="text-left text-muted-foreground hover:text-primary transition-colors text-sm w-full"
                    whileHover={{ x: 5 }}
                  >
                    Offers
                  </motion.button>
                </li>
                <li>
                  <motion.button 
                    onClick={() => navigate("/contact")} 
                    className="text-left text-muted-foreground hover:text-primary transition-colors text-sm w-full"
                    whileHover={{ x: 5 }}
                  >
                    Contact
                  </motion.button>
                </li>
              </ul>
            </motion.div>
            
            <motion.div variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}>
              <h3 className="text-lg font-semibold mb-4">Categories</h3>
              <ul className="space-y-3">
                {categories.slice(0, 5).map((category) => (
                  <li key={category.id}>
                    <motion.button 
                      onClick={() => navigate(`/category/${category.id}`)} 
                      className="text-left text-muted-foreground hover:text-primary transition-colors text-sm w-full"
                      whileHover={{ x: 5 }}
                    >
                      {category.name}
                    </motion.button>
                  </li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}>
              <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-1 flex-shrink-0">
                    <path d="M20 10c0-4.4-3.6-8-8-8s-8 3.6-8 8 3.6 8 8 8 8-3.6 8-8z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span className="text-sm">Mansarovar Yojna, 2/50, Kanpur Rd, Sector O, Mansarovar, Transport Nagar, Lucknow, Uttar Pradesh 226012</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <span className="text-sm">079053 82771</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                  <span className="text-sm">info@kalyanampharmacy.com</span>
                </li>
              </ul>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex flex-col items-center md:items-start gap-1">
              <p className="text-muted-foreground text-sm">
                © 2025 Kalyanam Pharmaceuticals. All rights reserved.
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-muted-foreground text-sm cursor-help underline decoration-dashed">
                      Created By Shobhit Shukla (+91-9643000619)
                    </p>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs text-muted-foreground">
                      If you need to move your business online as well, contact here.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex gap-6">
              <motion.button 
                onClick={() => navigate("/privacy-policy")} 
                className="text-left text-muted-foreground hover:text-primary text-sm transition-colors"
                whileHover={{ y: -2 }}
              >
                Privacy Policy
              </motion.button>
              <motion.button 
                onClick={() => navigate("/terms-of-service")} 
                className="text-left text-muted-foreground hover:text-primary text-sm transition-colors"
                whileHover={{ y: -2 }}
              >
                Terms of Service
              </motion.button>
              <motion.button 
                onClick={() => navigate("/shipping-policy")} 
                className="text-left text-muted-foreground hover:text-primary text-sm transition-colors"
                whileHover={{ y: -2 }}
              >
                Shipping Policy
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
};

export default Index;
