import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  User, 
  ShoppingCart, 
  Heart, 
  Package, 
  LogOut,
  UserRound,
  Home,
  Phone
} from 'lucide-react';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

export function CustomerAccountDropdown() {
  const { user, isAuthenticated, signOut, isLoading } = useCustomerAuth();
  const { deliveryEnabled } = useFeatureFlags();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initialize auth state
    if (mounted) {
      // The hook should already handle initialization
    }
  }, [mounted]);

  if (!isAuthenticated || !user || isLoading || !deliveryEnabled) {
    return null; // Don't render if not authenticated, loading, or delivery is disabled
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out. Please try again.');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative hidden sm:flex rounded-full"
        >
          <User className="w-4 h-4" />
          <span className="ml-2 hidden sm:inline-block">
            {user.displayName || user.email?.split('@')[0] || 'Customer'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">
              {user.displayName || user.email?.split('@')[0] || 'Customer'}
            </p>
            <p className="text-xs text-muted-foreground">
              {user.email || 'No email'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => navigate('/')}>
          <Home className="mr-2 h-4 w-4" />
          <span>Home</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/wishlist')}>
          <Heart className="mr-2 h-4 w-4" />
          <span>Wishlist</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/cart')}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          <span>Cart</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/orders')}>
          <Package className="mr-2 h-4 w-4" />
          <span>My Orders</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <UserRound className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => navigate('/contact')}>
          <Phone className="mr-2 h-4 w-4" />
          <span>Contact Support</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}