import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Store, Search, Package, Home, LayoutDashboard } from "lucide-react";
import NotificationBell from "@/components/common/NotificationBell";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { UserAccountDropdown } from "@/components/common/UserAccountDropdown";
import { UnifiedAuth } from "@/components/common/UnifiedAuth";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { motion, useReducedMotion } from "framer-motion";
import logoImage from "@/assets/Logo.png";
import { Input } from "@/components/ui/input";

interface CommonHeaderProps {
  showStoreButton?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
  customTitle?: string;
  showSearchBar?: boolean;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  suggestions?: Array<{id: string, name: string, image_url?: string, original_price: number, in_stock: boolean}>;
  showSuggestions?: boolean;
  onSuggestionSelect?: (product: any) => void;
  activeSection?: string; // For admin dashboard mobile menu
}

const CommonHeader = ({
  showStoreButton = false,
  showBackButton = false,
  onBackClick,
  customTitle,
  showSearchBar = false,
  searchQuery = "",
  onSearchChange,
  onSearchSubmit,
  suggestions = [],
  showSuggestions = false,
  onSuggestionSelect,
  activeSection
}: CommonHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const { isAuthenticated, isAdmin, user } = useAuth();
  const { isAuthenticated: isCustomerAuthenticated, user: customerUser } = useCustomerAuth();

  // Debug logging
  console.log('CommonHeader - Auth State:', {
    isAuthenticated,
    isAdmin,
    user: user ? 'exists' : 'null',
    isCustomerAuthenticated,
    customerUser: customerUser ? 'exists' : 'null',
    showStoreButton,
    showBackButton
  });

  // Log when admin icons should render
  if (isAuthenticated) {
    console.log('Admin icons should be rendering');
  }

  return (
    <motion.header
      className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-600 text-white shadow-xl"
      initial={{ y: prefersReducedMotion ? 0 : -100 }}
      animate={{ y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 1
      }}
    >
      <div className="container mx-auto px-4 py-4">
        {/* Desktop: Single row with all elements */}
        {/* Mobile: Two rows (logo+icons, then search) */}
            
        <div className="header-main flex items-center justify-between w-full">
          {/* Logo Section */}
          <div
            className="logo-section flex items-center gap-3 cursor-pointer"
            onClick={() => !showBackButton ? navigate("/") : {}}
          >
            <div className="p-2 bg-white rounded-lg backdrop-blur-sm border border-white/20 shadow-lg">
              <img src={logoImage} alt="Kalyanam Pharmaceuticals Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              {/* Desktop view - Full business name */}
              <h1 className="hidden md:block text-2xl font-bold">Kalyanam Pharmaceuticals</h1>
              <p className="hidden md:block text-sm text-primary-foreground/90">Your Trusted Healthcare Partner</p>
    
              {/* Mobile view - Shortened business name */}
              <div className="md:hidden">
                <h1 className="text-xl font-bold">Kalyanam</h1>
                <p className="text-[0.6rem] text-primary-foreground/90 uppercase tracking-wider">PHARMACEUTICALS</p>
              </div>
            </div>
          </div>

          {/* Desktop/Tablet: Search bar in same line */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-foreground/70 w-5 h-5 z-10" />
              <Input
                type="search"
                placeholder="Search medicines..."
                className="pl-12 pr-4 py-3 w-full rounded-full bg-white/20 border-2 border-white/30 text-primary-foreground placeholder:text-primary-foreground/80 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:border-white/50 transition-all duration-300 shadow-lg"
                value={searchQuery}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && onSearchSubmit) {
                    onSearchSubmit();
                  }
                }}
              />
              
              {/* Autocomplete Suggestions Dropdown - Desktop */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 max-h-96 overflow-y-auto">
                  {suggestions.map((product) => (
                    <div
                      key={product.id}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                      onClick={() => onSuggestionSelect && onSuggestionSelect(product)}
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary/20">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-gray-900 truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-600 font-medium">
                            ₹{product.original_price.toFixed(2)}
                          </p>
                          {!product.in_stock && (
                            <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {suggestions.length === 0 && searchQuery.trim() && (
                    <div className="px-4 py-6 text-center text-gray-500">
                      <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No medicines found matching "{searchQuery}"</p>
                      <p className="text-xs mt-1">Try searching with different keywords</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
    
          {/* Actions */}
          <div className="header-actions flex items-center gap-1.5 md:gap-3 flex-shrink-0">
            {showBackButton && (
              <motion.button
                className="rounded-full px-4 py-2 text-primary-foreground hover:bg-white/20 transition-colors font-medium flex items-center gap-2"
                onClick={onBackClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 19-7-7 7-7" />
                  <path d="M19 12H5" />
                </svg>
                Back
              </motion.button>
            )}
    
            {showStoreButton && (
              <motion.button
                className="rounded-full px-4 py-2 text-primary-foreground hover:bg-white/20 transition-colors font-medium flex items-center gap-2 hidden md:flex"
                onClick={() => navigate("/")} 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Store className="w-4 h-4" />
                <span className="hidden md:block">View Store</span>
              </motion.button>
            )}
    

            
            {/* User Account Section - Show appropriate dropdown based on user type */}
            <div className="flex items-center gap-1.5">
              {isAuthenticated ? (
                // Admin user - show notification bell and user account dropdown
                <>
                  <NotificationBell />
                  <UserAccountDropdown />
                </>
              ) : isCustomerAuthenticated ? (
                // Customer user - show only user account dropdown
                <UserAccountDropdown />
              ) : (
                // Unauthenticated user - show login button
                <UnifiedAuth
                  trigger={
                    <motion.button
                      className="rounded-full p-2 text-white hover:bg-white/20 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      title="Login / Signup"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </motion.button>
                  }
                />
              )}
            </div>
                
            <MobileMenu activeSection={activeSection} />
          </div>
        </div>
    
        
        {/* Mobile Search - Only visible on mobile */}
        <div className="md:hidden w-full mt-3">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-foreground/70 w-5 h-5 z-10" />
            <Input
              type="search"
              placeholder="Search medicines..."
              className="pl-12 pr-4 py-3 w-full rounded-full bg-white/20 border-2 border-white/30 text-primary-foreground placeholder:text-primary-foreground/80 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:border-white/50 transition-all duration-300 shadow-lg"
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && onSearchSubmit) {
                  onSearchSubmit();
                }
              }}
            />
                    
            {/* Autocomplete Suggestions Dropdown - Mobile */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 max-h-96 overflow-y-auto w-full">
                {suggestions.map((product) => (
                  <div
                    key={product.id}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                    onClick={() => onSuggestionSelect && onSuggestionSelect(product)}
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary/20">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-gray-900 truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-600 font-medium">
                          ₹{product.original_price.toFixed(2)}
                        </p>
                        {!product.in_stock && (
                          <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                        
                {suggestions.length === 0 && searchQuery.trim() && (
                  <div className="px-4 py-6 text-center text-gray-500">
                    <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No medicines found matching "{searchQuery}"</p>
                    <p className="text-xs mt-1">Try searching with different keywords</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default CommonHeader;
