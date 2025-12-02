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

interface MobileMenuProps {
  onSearchClick?: () => void;
}

export function MobileMenu({ onSearchClick }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, signOut } = useAuth();
  const { deliveryEnabled } = useFeatureFlags();
  const { items: wishlistItems } = useWishlist();

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setOpen(false);
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const menuItems = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      action: () => handleNavigation("/"),
      active: location.pathname === "/"
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: Star,
      action: () => handleNavigation("/reviews"),
      active: location.pathname === "/reviews"
    },
    ...(deliveryEnabled ? [{
      id: "wishlist",
      label: "Wishlist",
      icon: Heart,
      action: () => handleNavigation("/wishlist"),
      active: location.pathname === "/wishlist",
      badge: wishlistItems.length > 0 ? wishlistItems.length.toString() : undefined
    }] : []),
    {
      id: "dashboard",
      label: isAuthenticated ? "Dashboard" : "Owner Login",
      icon: User,
      action: () => handleNavigation(isAuthenticated ? "/owner" : "/auth"),
      active: location.pathname === "/owner" || location.pathname === "/auth"
    }
  ];

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
      <SheetContent side="left" className="w-[300px] sm:w-[340px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Store className="w-6 h-6" />
            <span>Kalyanam Pharmaceuticals</span>
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={item.active ? "default" : "ghost"}
                className="justify-start gap-3 py-6 text-left"
                onClick={item.action}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-white text-primary rounded-full w-6 h-6 text-xs flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Button>
            );
          })}
          
          {isAuthenticated && (
            <Button
              variant="outline"
              className="justify-start gap-3 py-6 text-left text-destructive hover:text-destructive hover:border-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </Button>
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