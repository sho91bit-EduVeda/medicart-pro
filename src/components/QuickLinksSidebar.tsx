import { useState } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface QuickLink {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  requiresAuth?: boolean;
}

export function QuickLinksSidebar() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Don't render anything if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }
  
  const quickLinks: QuickLink[] = [
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
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      path: "/owner",
      requiresAuth: true
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      path: "/owner",
      requiresAuth: true
    }
  ];

  const handleLinkClick = (link: QuickLink) => {
    // Navigate to the specified path
    if (link.path.startsWith("/")) {
      navigate(link.path);
    } else {
      // Handle hash navigation
      const [basePath, hash] = link.path.split("#");
      if (hash) {
        window.location.hash = `#${hash}`;
      }
      navigate(basePath);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 md:bottom-8 md:right-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className="w-14 h-14 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <Zap className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[340px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Access
            </SheetTitle>
            <p className="text-sm text-muted-foreground">Urgent actions for store management</p>
          </SheetHeader>
          
          <div className="mt-6 flex flex-col gap-2">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Button
                  key={link.id}
                  variant="ghost"
                  className="justify-start gap-3 py-6 text-left"
                  onClick={() => handleLinkClick(link)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                </Button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}