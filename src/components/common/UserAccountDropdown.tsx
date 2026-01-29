import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { UserRound, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { toast } from 'sonner';

export function UserAccountDropdown() {
  const navigate = useNavigate();
  const { isAuthenticated, signOut: ownerSignOut, user: ownerUser, isAdmin } = useAuth();
  
  // Debug ref
  const userRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    if (userRef.current) {
      const computedStyle = window.getComputedStyle(userRef.current);
      console.log('UserAccountDropdown DOM element:', {
        exists: !!userRef.current,
        offsetParent: userRef.current.offsetParent,
        offsetWidth: userRef.current.offsetWidth,
        offsetHeight: userRef.current.offsetHeight,
        display: computedStyle.display,
        visibility: computedStyle.visibility,
        opacity: computedStyle.opacity
      });
    }
  }, []);
  const { 
    isAuthenticated: isCustomerAuthenticated, 
    signOut: customerSignOut,
    user: customerUser
  } = useCustomerAuth();

  // Determine if any user is logged in
  const isAnyUserLoggedIn = isAuthenticated || isCustomerAuthenticated;
  
  // Get the current user based on which auth system is active
  const currentUser = isAuthenticated ? ownerUser : customerUser;
  const isCurrentUserOwner = isAuthenticated && isAdmin;

  // Handle logout based on user type
  const handleLogout = async () => {
    try {
      if (isAuthenticated) {
        // Logout owner
        await ownerSignOut();
      } else if (isCustomerAuthenticated) {
        // Logout customer
        await customerSignOut();
      }
      toast.success("Logged out successfully");
      navigate('/');
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  // Only render if a user is logged in
  if (!isAnyUserLoggedIn) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          ref={userRef}
          className="relative flex items-center justify-center w-10 h-10 rounded-full cursor-pointer transition-all duration-300 shadow-sm border border-white/10 bg-white/10 hover:bg-white/20"
        >
          <UserRound className="w-5 h-5 text-white" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-popover text-popover-foreground border border-border shadow-lg rounded-md overflow-hidden"
      >
        <div className="p-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {currentUser?.displayName || currentUser?.email || 'User'}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {isCurrentUserOwner ? 'Admin' : 'Customer'}
              </p>
            </div>
          </div>
        </div>
        
        <DropdownMenuItem 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 p-3 cursor-pointer"
        >
          <User className="h-4 w-4 text-muted-foreground" />
          <span>My Profile</span>
        </DropdownMenuItem>
        
        {isCurrentUserOwner && (
          <DropdownMenuItem 
            onClick={() => navigate('/owner')}
            className="flex items-center gap-3 p-3 cursor-pointer"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span>Admin Dashboard</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem 
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}