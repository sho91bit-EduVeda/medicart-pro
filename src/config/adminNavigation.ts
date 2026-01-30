import { 
  Home, 
  LayoutDashboard, 
  Receipt, 
  Bell, 
  Package, 
  Settings,
  Database,
  TrendingUp,
  Users,
  FileSpreadsheet,
  Store,
  ShoppingCart,
  MessageSquare,
  AlertTriangle,
  Percent
} from "lucide-react";

export interface AdminNavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  external?: boolean;
  path?: string;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

export const adminNavigationItems: AdminNavigationItem[] = [
  // Navigation Group
  { id: "home", label: "Home", icon: Home, category: "Navigation", external: true, path: "/", requiresAuth: false },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, category: "Navigation", external: true, path: "/owner", requiresAuth: true, adminOnly: true },
  
  // Store Purchase Group
  { id: "store-purchase", label: "Store Purchase", icon: Receipt, category: "Store Purchase", requiresAuth: true, adminOnly: true },
  
  // Marketing & Promotions Group
  { id: "announcements", label: "Announcements", icon: Bell, category: "Marketing", requiresAuth: true, adminOnly: true },
  
  // Customer Relations Group
  { id: "orders", label: "Orders", icon: Package, category: "Customer Relations", requiresAuth: true, adminOnly: true },
  { id: "customers", label: "Customers", icon: Users, category: "Customer Relations", path: "/owner/customers", external: true, requiresAuth: true, adminOnly: true },
  
  // Store Configuration Group
  { id: "settings", label: "Settings", icon: Settings, category: "Configuration", requiresAuth: true, adminOnly: true },
];