import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import {
  Home,
  Star,
  Heart,
  User,
  LogOut,
  LogIn,
  Store,
  Package
} from "lucide-react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useWishlist } from "@/hooks/useWishlist";
import { toast } from "sonner";
import KalyanamLogo from "@/components/svgs/KalyanamLogo";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { UserAccountDropdown } from "@/components/common/UserAccountDropdown";

interface MobileMenuProps {
  onSearchClick?: () => void;
  onReviewsClick?: () => void;
  onUnifiedLoginClick?: () => void; // Updated prop name
}

export function MobileMenu({ onSearchClick, onReviewsClick, onUnifiedLoginClick }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, signOut, isAdmin } = useAuth();
  const { deliveryEnabled } = useFeatureFlags();
  const { items: wishlistItems } = useWishlist();
  const { user: customerUser, isAuthenticated: isCustomerAuthenticated, isLoading: isCustomerLoading } = useCustomerAuth();

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const handleLogout = async () => {
    try {
      // Check which user type is authenticated and sign out accordingly
      if (isCustomerAuthenticated) {
        // Sign out customer
        await signOut();
      } else {
        // Sign out owner
        await signOut();
      }
      setOpen(false);
      navigate('/');
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };


  // Build menu items dynamically based on authentication state
  const getMenuItems = () => {
    let items = [
      {
        id: "home",
        label: "Home",
        icon: Home,
        action: () => handleNavigation("/"),
        active: location.pathname === "/"
      },
      {
        id: "products",
        label: "Products",
        icon: Package,
        action: () => handleNavigation("/products"),
        active: location.pathname === "/products"
      },
      {
        id: "about",
        label: "About",
        icon: Store,
        action: () => handleNavigation("/about"),
        active: location.pathname === "/about"
      },
      {
        id: "contact",
        label: "Contact Us",
        icon: User,
        action: () => handleNavigation("/contact"),
        active: location.pathname === "/contact"
      }
    ];

    // Add offers and reviews if authenticated
    if (isAuthenticated) {
      items.push({
        id: "offers",
        label: "Offers",
        icon: Store,
        action: () => handleNavigation("/offers"),
        active: location.pathname === "/offers"
      });
    }

    if (deliveryEnabled && !isAuthenticated) {
      items.push({
        id: "reviews",
        label: "Reviews",
        icon: Star,
        action: () => {
          if (onReviewsClick) {
            onReviewsClick();
          } else {
            handleNavigation("/reviews");
          }
          setOpen(false);
        },
        active: location.pathname === "/reviews"
      });
    }

    // Add wishlist if customer is authenticated
    if (isCustomerAuthenticated && deliveryEnabled) {
      items.push({
        id: "wishlist",
        label: `Wishlist (${wishlistItems.length})`,
        icon: Heart,
        action: () => handleNavigation("/wishlist"),
        active: location.pathname === "/wishlist"
      });
    }

    // Add owner-specific items if authenticated as owner
    if (isAuthenticated) {
      items.push({
        id: "owner",
        label: "Owner Dashboard",
        icon: Store,
        action: () => handleNavigation("/owner"),
        active: location.pathname.startsWith("/owner")
      });
      items.push({
        id: "logout-owner",
        label: "Logout",
        icon: LogOut,
        action: handleLogout,
        active: false
      });
    }
    // Add customer logout if authenticated as customer
    else if (isCustomerAuthenticated) {
      items.push({
        id: "logout-customer",
        label: "Logout",
        icon: LogOut,
        action: handleLogout,
        active: false
      });
    }

    return items;
  };

  const menuItems = getMenuItems();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden rounded-full p-2 text-primary-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
          </svg>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[340px] h-full bg-gradient-to-br from-blue-500/10 via-indigo-600/10 to-purple-600/10">
        <SheetHeader>
          <SheetTitle className="text-gray-800 dark:text-white font-bold">Menu</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-100px)]">
          <div className="flex-1 overflow-y-auto mt-4 flex flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={item.active ? "default" : "ghost"}
                  className="justify-start gap-3 py-6 text-left text-gray-800 dark:text-white"
                  onClick={item.action}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              );
            })}
          </div>

          {/* User Account Dropdown - Only show when logged in */}
          {(isCustomerAuthenticated || isAuthenticated) && (
            <div className="pt-4 pb-4">
              <UserAccountDropdown />
            </div>
          )}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-center text-xs text-muted-foreground">
            © 2025 Kalyanam Pharmaceuticals
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}