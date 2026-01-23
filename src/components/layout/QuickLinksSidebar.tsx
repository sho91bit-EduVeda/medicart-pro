import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Package,
  Mail,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  ShoppingCart,
  Bell,
  User,
  Zap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import RequestMedicineSheet from "@/components/common/RequestMedicineSheet";
import LottieAnimation from "@/components/common/LottieAnimation";
import quickLinksAnim from "@/assets/animations/quick-links.json";

interface QuickLink {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  requiresAuth?: boolean;
}

export function QuickLinksSidebar() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Define links for authenticated users (owners)
  const ownerLinks: QuickLink[] = [
    {
      id: "inventory",
      label: "Inventory",
      icon: Package,
      path: "/owner#manage-products",
      requiresAuth: true
    },
    {
      id: "requests",
      label: "Medicine Requests",
      icon: Mail,
      path: "/owner#requests",
      requiresAuth: true
    },
    {
      id: "reports",
      label: "Sales Reporting",
      icon: TrendingUp,
      path: "/owner#sales-reporting",
      requiresAuth: true
    },
    {
      id: "orders",
      label: "Orders",
      icon: ShoppingCart,
      path: "/owner#orders",
      requiresAuth: true
    }
  ];

  // Define links for non-authenticated users
  const guestLinks: QuickLink[] = [
    {
      id: "contact",
      label: "Contact Us",
      icon: Mail,
      path: "/contact"
    },
    {
      id: "request-medicine",
      label: "Request Medicine",
      icon: Package,
      path: "#request-medicine"
    }
  ];

  // Select appropriate links based on authentication status
  const quickLinks = isAuthenticated ? ownerLinks : guestLinks;

  const handleLinkClick = (link: QuickLink) => {
    // Special handling for request medicine for non-authenticated users
    if (!isAuthenticated && link.id === "request-medicine") {
      // For guests, we'll just close the menu and let the hash navigation handle it
      setIsOpen(false);
      return;
    }

    // Navigate to the specified path
    if (link.path.startsWith("/")) {
      // For owner dashboard links, we need to handle hash navigation properly
      if (link.path.includes("#")) {
        const [basePath, hash] = link.path.split("#");
        navigate(basePath);
        // Use setTimeout to ensure navigation completes before setting hash
        setTimeout(() => {
          if (hash) {
            window.location.hash = `#${hash}`;
          }
        }, 100);
      } else {
        navigate(link.path);
      }
    } else {
      // Handle hash navigation for non-dashboard paths
      const [basePath, hash] = link.path.split("#");
      if (hash) {
        window.location.hash = `#${hash}`;
      }
      if (basePath) {
        navigate(basePath);
      }
    }
    setIsOpen(false); // Close the bubble menu after clicking
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 md:bottom-8 md:right-8">
      {/* Main trigger button */}
      <Button
        variant="default"
        size="icon"
        className="w-14 h-14 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300"
        onClick={() => setIsOpen(!isOpen)}
      >
        <LottieAnimation animationData={quickLinksAnim} width={65} height={65} />
      </Button>

      {/* Bubble menu with animations */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for closing when clicking outside */}
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Bubble menu container */}
            <motion.div
              className="absolute bottom-16 right-0 w-64 bg-background border rounded-xl shadow-xl p-2 z-50"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
            >
              <div className="flex flex-col gap-1">
                {quickLinks.map((link) => {
                  const Icon = link.icon;

                  // Special handling for request medicine for guests
                  if (!isAuthenticated && link.id === "request-medicine") {
                    return (
                      <RequestMedicineSheet key={link.id}>
                        <motion.div
                          className="relative"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: quickLinks.indexOf(link) * 0.05 }}
                          onMouseEnter={() => setHoveredItem(link.id)}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 py-4 text-left relative"
                            onClick={() => setIsOpen(false)} // Close menu when opening sheet
                          >
                            <motion.div
                              animate={hoveredItem === link.id ? { rotate: 360 } : { rotate: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Icon className="w-5 h-5" />
                            </motion.div>
                            <span className="font-medium">{link.label}</span>

                            {/* Hover animation indicator */}
                            {hoveredItem === link.id && (
                              <motion.div
                                className="absolute inset-0 bg-primary/5 rounded-lg"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                              />
                            )}
                          </Button>
                        </motion.div>
                      </RequestMedicineSheet>
                    );
                  }

                  return (
                    <motion.div
                      key={link.id}
                      className="relative"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: quickLinks.indexOf(link) * 0.05 }}
                      onMouseEnter={() => setHoveredItem(link.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 py-4 text-left relative"
                        onClick={() => handleLinkClick(link)}
                      >
                        <motion.div
                          animate={hoveredItem === link.id ? { rotate: 360 } : { rotate: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Icon className="w-5 h-5" />
                        </motion.div>
                        <span className="font-medium">{link.label}</span>

                        {/* Hover animation indicator */}
                        {hoveredItem === link.id && (
                          <motion.div
                            className="absolute inset-0 bg-primary/5 rounded-lg"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}