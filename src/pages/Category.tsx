import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "@/integrations/firebase/config";
import { collection, getDocs, query, where, orderBy, doc, getDoc, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/ProductCard";
import { Search, Package, PackagePlus, Heart, User, LogOut, Store, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { whatsappService } from "@/services/whatsappService";
import { ShoppingCart } from "@/components/ShoppingCart";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import RequestMedicineSheet from "@/components/RequestMedicineSheet";
import { MobileMenu } from "@/components/MobileMenu";
import { SearchPopup } from "@/components/SearchPopup";
import KalyanamLogo from "@/components/svgs/KalyanamLogo";
import { LoginPopup } from "@/components/LoginPopup";

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

interface Category {
  id: string;
  name: string;
  description?: string;
}

const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, signOut, checkAuth, user } = useAuth();
  const { deliveryEnabled } = useFeatureFlags();
  const { loadWishlist, items: wishlistItems, toggleItem } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (deliveryEnabled) {
      loadWishlist();
    }
  }, [deliveryEnabled]);

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
  };

  // Handle search submission (Enter key or button click)
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      setShowSearchPopup(true);
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

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Fetch category details
        const categoryDoc = await getDoc(doc(db, "categories", id));
        if (categoryDoc.exists()) {
          setCategory({ id: categoryDoc.id, ...categoryDoc.data() } as Category);
        } else {
          toast.error("Category not found");
          navigate("/");
          return;
        }

        // Fetch products in this category
        const productsQuery = query(
          collection(db, "products"),
          where("category_id", "==", id)
          // Removed orderBy to avoid needing composite index
        );
        
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        
        // Sort products by name client-side
        productsData.sort((a, b) => a.name.localeCompare(b.name));
        
        setProducts(productsData);

        // Fetch discount
        const settingsRef = doc(db, "settings", "store");
        const settingsSnap = await getDoc(settingsRef);

        if (settingsSnap.exists()) {
          setDiscountPercentage(settingsSnap.data().discount_percentage || 0);
        }
      } catch (error: any) {
        // Handle Firebase index required error
        if (error.code === 'failed-precondition' && error.message.includes('query requires an index')) {
          toast.error("Database index required. Please check console for setup link.");
          console.error("Firebase index required. Visit this link to create the index:", error.message);
        } else {
          toast.error("Failed to load category data");
          console.error(error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm border border-white/10 shadow-lg">
                <KalyanamLogo className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Kalyanam Pharmaceuticals</h1>
                <p className="text-sm text-primary-foreground/90">Your Trusted Healthcare Partner</p>
              </div>
            </div>
            
            {/* Desktop Navigation - Simplified for category page */}
            <nav className="hidden md:flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-full px-4 py-2 text-primary-foreground hover:bg-white/20 transition-colors font-medium"
                onClick={() => navigate("/")}
              >
                Home
              </Button>
              {/* Show Track Unavailable Medicines only when delivery is enabled */}
              {deliveryEnabled && (
                <RequestMedicineSheet>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-full px-4 py-2 text-primary-foreground hover:bg-white/20 transition-colors font-medium"
                  >
                    Track Unavailable Medicines
                  </Button>
                </RequestMedicineSheet>
              )}
              {/* Request Medicine Button */}
              <RequestMedicineSheet>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full px-4 py-2 text-primary-foreground hover:bg-white/20 transition-colors font-medium flex items-center gap-2"
                >
                  <PackagePlus className="w-4 h-4" />
                  Request Medicine
                </Button>
              </RequestMedicineSheet>
            </nav>
                
            {/* Search Box - Hidden on mobile */}
            <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-foreground/70 w-4 h-4 z-10" />
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
                <Button 
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full p-1 text-primary-foreground hover:bg-white/20 z-10"
                  onClick={handleSearchSubmit}
                >
                  <Search className="w-4 h-4" />
                </Button>
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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-full px-4 py-2 text-primary-foreground hover:bg-white/20 transition-colors font-medium"
                      onClick={() => navigate("/owner")}
                    >
                      Dashboard
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="rounded-full px-4 py-2 transition-colors font-medium flex items-center gap-2"
                      onClick={async () => {
                        await signOut();
                        toast.success("Logged out successfully");
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </Button>
                  </>
                ) : (
                  <LoginPopup
                    trigger={
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-full px-4 py-2 text-primary-foreground hover:bg-white/20 transition-colors font-medium"
                      >
                        Owner Login
                      </Button>
                    }
                  />
                )}
              </div>
              
              <div className="hidden md:flex items-center gap-1">
                {deliveryEnabled && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-full p-2 text-primary-foreground hover:bg-white/20 transition-colors"
                    onClick={() => navigate("/wishlist")}
                    title="Wishlist"
                  >
                    <Heart className="w-5 h-5" />
                    {wishlistItems.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-white text-primary rounded-full w-5 h-5 text-xs flex items-center justify-center">
                        {wishlistItems.length}
                      </span>
                    )}
                  </Button>
                )}
              </div>
        
              <div title="Shopping Cart">
                <ShoppingCart discountPercentage={discountPercentage} />
              </div>
              
              {/* Mobile menu button - Pass onOwnerLoginClick prop */}
              <MobileMenu 
                onOwnerLoginClick={() => document.getElementById('mobile-owner-login-trigger')?.click()}
              />
            </div>
          </div>
          
          {/* Mobile Search Box - Visible only on mobile */}
          <div className="md:hidden mt-3 px-2 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-foreground/70 w-4 h-4 z-10" />
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
              <Button 
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full p-1 text-primary-foreground hover:bg-white/20 z-10"
                onClick={handleSearchSubmit}
              >
                <Search className="w-4 h-4" />
              </Button>
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
      </header>

      {/* Hidden LoginPopup trigger for mobile */}
      <div className="hidden">
        <LoginPopup
          trigger={
            <button id="mobile-owner-login-trigger" />
          }
        />
      </div>

      {/* Search Popup */}
      <SearchPopup 
        searchQuery={searchQuery} 
        isOpen={showSearchPopup} 
        onClose={() => setShowSearchPopup(false)} 
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{category?.name || "Category"}</h1>
            {category?.description && (
              <p className="text-muted-foreground mt-1">{category.description}</p>
            )}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">
              There are no products in this category yet.
            </p>
            <div className="flex flex-col gap-4 items-center">
              <Button onClick={() => navigate("/")}>Back to Home</Button>
              <RequestMedicineSheet>
                <Button variant="secondary" className="rounded-full flex items-center gap-2">
                  <PackagePlus className="w-4 h-4" />
                  Request Medicine in this Category
                </Button>
              </RequestMedicineSheet>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;