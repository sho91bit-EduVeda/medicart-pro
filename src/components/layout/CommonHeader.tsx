import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Store, Menu } from "lucide-react";
import NotificationBell from "@/components/common/NotificationBell";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { UserAccountDropdown } from "@/components/common/UserAccountDropdown";
import { UnifiedAuth } from "@/components/common/UnifiedAuth";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { motion, useReducedMotion } from "framer-motion";
import logoImage from "@/assets/Logo.png";

interface CommonHeaderProps {
  showStoreButton?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
  customTitle?: string;
}

const CommonHeader = ({
  showStoreButton = false,
  showBackButton = false,
  onBackClick,
  customTitle
}: CommonHeaderProps) => {
  const navigate = useNavigate();
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
        <div className="flex items-center justify-between w-full">
          <div
            className="flex items-center gap-3 cursor-pointer"
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
                <p className="text-[0.6rem] text-primary-foreground/90 uppercase tracking-wider">Pharmaceuticals</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
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

            {/* Admin-specific icons - Only show when admin is authenticated */}
            {isAuthenticated && (
              <div className="flex items-center gap-1.5">
                <NotificationBell />
                <UserAccountDropdown />
              </div>
            )}

            {/* Login/Signup buttons - Only show when no one is logged in */}
            {!isAuthenticated && !isCustomerAuthenticated && (
              <div className="flex items-center gap-1">
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
              </div>
            )}

            <MobileMenu />
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default CommonHeader;
