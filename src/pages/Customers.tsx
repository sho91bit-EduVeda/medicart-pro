import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { db, auth } from "@/integrations/firebase/config";
import { collection, getDocs, query, orderBy, Timestamp, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { getAuth, listUsers, UserMetadata } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { motion } from "framer-motion";
import { Users as UsersIcon, Edit, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import CommonHeader from "@/components/layout/CommonHeader";
import { QuickLinksSidebar } from "@/components/layout/QuickLinksSidebar";
import { adminNavigationItems } from "@/config/adminNavigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: Timestamp | string;
  status: "active" | "inactive";
  last_order_date?: Timestamp | string;
  total_orders?: number;
}

const Customers = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user, isLoading, checkAuth } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;

  // Filter navigation items for admin dashboard
  const navigationItems = adminNavigationItems.filter(item => 
    item.adminOnly !== false && item.requiresAuth !== false
  );

  // Log when component mounts
  useEffect(() => {
    console.log("=== Customers Page Mounted ===");
    console.log("Current URL:", window.location.href);
    console.log("Current hash:", window.location.hash);
    console.log("Initial auth state:", {
      isAuthenticated,
      isAdmin,
      user: user?.email,
      isLoading
    });
  }, []);

  // Debug authentication state changes
  useEffect(() => {
    console.log("Customers page - Auth state updated:", {
      isAuthenticated,
      isAdmin,
      user: user?.email,
      isLoading
    });
  }, [isAuthenticated, isAdmin, user, isLoading]);

  // Initialize auth on component mount
  useEffect(() => {
    console.log("Customers page - Initializing auth check...");
    checkAuth();
  }, [checkAuth]);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    console.log("Customers page - Checking redirect conditions:", {
      isLoading,
      isAuthenticated,
      isAdmin,
      shouldRedirect: !isLoading && (!isAuthenticated || !isAdmin)
    });
    
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      console.log("Redirecting to auth - not authenticated or not admin");
      navigate("/auth");
    }
  }, [isAuthenticated, isAdmin, isLoading, navigate]);

  // Fetch customers data
  useEffect(() => {
    console.log("Customers page - Data fetching useEffect triggered:", {
      isAuthenticated,
      isAdmin,
      shouldFetch: isAuthenticated && isAdmin
    });
    
    const fetchCustomers = async () => {
      if (!isAuthenticated || !isAdmin) {
        console.log("Customers page - Skipping data fetch: not authenticated or not admin");
        return;
      }
      
      console.log("Customers page - Starting data fetch...");
      setLoading(true);
      try {
        // First, try to fetch from users collection (more reliable)
        console.log("Attempting to fetch from users collection...");
        const usersQuery = query(
          collection(db, "users"),
          orderBy("created_at", "desc")
        );
        
        console.log("Executing users query...");
        const usersSnapshot = await getDocs(usersQuery);
        console.log(`Users query completed. Found ${usersSnapshot.size} documents.`);
        
        const usersData: Customer[] = [];
        
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          console.log(`Processing user document ${doc.id}:`, userData);
          // Only include users with customer or owner roles
          if (userData.role === 'CUSTOMER' || userData.role === 'OWNER' || userData.role === 'customer' || userData.role === 'owner') {
            // Try to get the actual Firebase Auth user to access metadata
            const firebaseUser = auth.currentUser;
            let lastLoginDate = null;
            
            // If this is the current user, use their metadata
            if (firebaseUser && firebaseUser.uid === doc.id && firebaseUser.metadata.lastSignInTime) {
              lastLoginDate = new Date(firebaseUser.metadata.lastSignInTime);
              console.log(`Using Firebase Auth metadata for current user: ${lastLoginDate}`);
            } 
            // Otherwise, use the last_login from Firestore if available
            else if (userData.last_login) {
              const loginTime = userData.last_login;
              if (loginTime instanceof Timestamp) {
                lastLoginDate = loginTime.toDate();
              } else if (typeof loginTime === 'string') {
                lastLoginDate = new Date(loginTime);
              } else if (loginTime && loginTime.seconds) {
                lastLoginDate = new Date(loginTime.seconds * 1000);
              }
              console.log(`Using Firestore last_login field: ${lastLoginDate}`);
            }
            // Fallback to updated_at if no last_login
            else if (userData.updated_at) {
              const updateTime = userData.updated_at;
              if (updateTime instanceof Timestamp) {
                lastLoginDate = updateTime.toDate();
              } else if (typeof updateTime === 'string') {
                lastLoginDate = new Date(updateTime);
              } else if (updateTime && updateTime.seconds) {
                lastLoginDate = new Date(updateTime.seconds * 1000);
              }
              console.log(`Using updated_at as fallback: ${lastLoginDate}`);
            }
            
            usersData.push({
              id: doc.id,
              name: userData.name || userData.displayName || 'Unknown User',
              email: userData.email || 'No email',
              phone: userData.phone || 'No phone',
              created_at: userData.created_at ? new Date(userData.created_at) : new Date(),
              status: userData.role === 'OWNER' || userData.role === 'owner' ? 'active' : 'active',
              last_order_date: lastLoginDate,
              total_orders: 0 // We don't have order data in users collection
            });
            console.log(`Added user ${userData.name || userData.email} with last login: ${lastLoginDate}`);
          } else {
            console.log(`Skipped user ${userData.name || userData.email} with role ${userData.role}`);
          }
        });
        
        console.log(`Found ${usersData.length} users in users collection`);
        
        if (usersData.length > 0) {
          setCustomers(usersData);
          return;
        }
        
        // Fallback to customers collection if users collection is empty
        console.log("No users found in users collection, trying customers collection...");
        const customersQuery = query(
          collection(db, "customers"),
          orderBy("created_at", "desc")
        );
        
        const customersSnapshot = await getDocs(customersQuery);
        const customersData: Customer[] = customersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Customer, 'id'>)
        }));
        
        console.log(`Found ${customersData.length} customers in customers collection`);
        setCustomers(customersData);
        
      } catch (error: any) {
        console.error("Error fetching customers:", error);
        
        // Check if the error is due to missing collection, permissions, or other Firebase issues
        if (error.code === 'permission-denied' || 
            error.message?.includes('permission') || 
            error.message?.includes('insufficient')) {
          // For permission errors, show empty array
          console.warn("Customers collection permission denied, showing empty state");
          setCustomers([]);
        } else if (error.code === 'unavailable' || 
                   error.message?.includes('unavailable') ||
                   error.message?.includes('offline')) {
          // For offline/unavailable errors, show empty array
          console.warn("Customers service unavailable, showing empty state");
          setCustomers([]);
        } else {
          // For other errors (including missing collection), show toast and use mock data
          console.warn("Using mock customer data due to fetch error");
          toast.error("Failed to load customers data. Showing sample data.");
          
          // Provide mock data for demonstration purposes
          const mockCustomers: Customer[] = [
            {
              id: "1",
              name: "Rajesh Kumar",
              email: "rajesh.kumar@email.com",
              phone: "+91 98765 43210",
              created_at: new Date("2024-01-15"),
              status: "active",
              last_order_date: new Date("2024-03-20"),
              total_orders: 12
            },
            {
              id: "2",
              name: "Priya Sharma",
              email: "priya.sharma@email.com",
              phone: "+91 98765 43211",
              created_at: new Date("2024-02-03"),
              status: "active",
              last_order_date: new Date("2024-03-18"),
              total_orders: 8
            },
            {
              id: "3",
              name: "Amit Patel",
              email: "amit.patel@email.com",
              phone: "+91 98765 43212",
              created_at: new Date("2024-01-28"),
              status: "inactive",
              last_order_date: new Date("2024-02-15"),
              total_orders: 3
            },
            {
              id: "4",
              name: "Sneha Gupta",
              email: "sneha.gupta@email.com",
              phone: "+91 98765 43213",
              created_at: new Date("2024-03-10"),
              status: "active",
              last_order_date: new Date("2024-03-22"),
              total_orders: 5
            },
            {
              id: "5",
              name: "Vikram Singh",
              email: "vikram.singh@email.com",
              phone: "+91 98765 43214",
              created_at: new Date("2024-02-22"),
              status: "active",
              last_order_date: new Date("2024-03-19"),
              total_orders: 15
            }
          ];
          setCustomers(mockCustomers);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [isAuthenticated, isAdmin]);

  const formatDate = (date: Timestamp | string | Date): string => {
    if (date instanceof Timestamp) {
      return date.toDate().toLocaleDateString();
    }
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString();
    }
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === "active" ? "default" : "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Handle edit customer
  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name,
      phone: customer.phone
    });
    setIsEditDialogOpen(true);
  };

  // Handle save edited customer
  const handleSaveCustomer = async () => {
    if (!editingCustomer) return;
    
    try {
      const customerRef = doc(db, "users", editingCustomer.id);
      await updateDoc(customerRef, {
        name: editForm.name,
        phone: editForm.phone,
        updated_at: new Date()
      });
      
      // Update local state
      setCustomers(customers.map(c => 
        c.id === editingCustomer.id 
          ? { ...c, name: editForm.name, phone: editForm.phone }
          : c
      ));
      
      toast.success("Customer updated successfully!");
      setIsEditDialogOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      console.error("Error updating customer:", error);
      toast.error("Failed to update customer");
    }
  };

  // Handle delete customer
  const handleDeleteCustomer = (customer: Customer) => {
    // Prevent deletion of owner accounts
    if (customer.email.includes('shbhtshukla930')) {
      toast.error("Cannot delete owner account");
      return;
    }
    
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete customer
  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    
    try {
      const customerRef = doc(db, "users", customerToDelete.id);
      await deleteDoc(customerRef);
      
      // Update local state
      setCustomers(customers.filter(c => c.id !== customerToDelete.id));
      
      toast.success("Customer deleted successfully!");
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer");
    }
  };

  if (isLoading) {
    console.log("Customers page - Showing loading state");
    // Show loading state while authenticating
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    );
  }

  console.log("Customers page - Render conditions:", {
    isAuthenticated,
    isAdmin,
    shouldRender: isAuthenticated && isAdmin
  });

  if (!isAuthenticated || !isAdmin) {
    // Redirect to auth if not authenticated or not admin
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CommonHeader />
      <div className="flex flex-1">
        {/* Sidebar Navigation with animation - Hidden on mobile */}
        <motion.nav 
          className="w-64 bg-gradient-to-b from-blue-900/20 via-indigo-900/20 to-purple-900/20 border-r p-4 hidden md:block relative overflow-hidden"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative z-10 space-y-3">
            {/* Group navigation items by category */}
            {Array.from(new Set(navigationItems.map(item => item.category))).map((category, categoryIndex) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-white/80 px-4 py-2">{category}</h3>
                {navigationItems
                  .filter(item => item.category === category)
                  .map((item, itemIndex) => {
                    const Icon = item.icon;
                    const isActive = item.id === "customers"; // Customers page is always active when on this page
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + (categoryIndex * 0.1) + (itemIndex * 0.05) }}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          className="w-full justify-start gap-3 py-6 text-left text-gray-800 dark:text-white transition-all duration-200 pl-8"
                          onClick={() => {
                            console.log("Customers sidebar - Item clicked:", {
                              itemId: item.id,
                              label: item.label,
                              path: item.path,
                              isExternal: item.external,
                              currentPath: window.location.pathname
                            });
                            
                            // Handle external navigation
                            if (item.external && item.path) {
                              console.log("Customers sidebar - External navigation to:", item.path);
                              navigate(item.path);
                              return;
                            }
                            
                            // Handle internal navigation to Owner page sections
                            // Map navigation items to their corresponding sections in Owner page
                            const sectionMap: Record<string, string> = {
                              'dashboard': 'dashboard-home',
                              'store-purchase': 'store-purchase',
                              'announcements': 'announcements',
                              'orders': 'orders',
                              'customers': 'customers', // This will navigate to the customers page
                              'settings': 'settings'
                            };
                            
                            const targetSection = sectionMap[item.id];
                            if (targetSection) {
                              console.log("Customers sidebar - Navigating to section:", targetSection);
                              // Navigate to Owner page with hash
                              navigate(`/owner#${targetSection}`);
                            } else {
                              console.log("Customers sidebar - No section mapping found for:", item.id);
                            }
                          }}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </Button>
                      </motion.div>
                    );
                  })}
              </div>
            ))}
          </div>
        </motion.nav>
        
        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Registered Users</h1>
              <p className="text-muted-foreground">
                View all registered users and customers
              </p>
            </div>
            <div className="flex items-center gap-2">
              <UsersIcon className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">{customers.length}</span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Users</CardDescription>
                <CardTitle className="text-3xl">{customers.length}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Customers</CardDescription>
                <CardTitle className="text-3xl">
                  {customers.filter(c => c.status === "active").length}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>New This Month</CardDescription>
                <CardTitle className="text-3xl">
                  {customers.filter(c => {
                    const createdDate = c.created_at instanceof Timestamp 
                      ? c.created_at.toDate() 
                      : new Date(c.created_at);
                    const oneMonthAgo = new Date();
                    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                    return createdDate > oneMonthAgo;
                  }).length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Customers Table */}
          <Card>
            <CardHeader>
              <CardTitle>User List</CardTitle>
              <CardDescription>
                All registered users in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : customers.length === 0 ? (
                <div className="text-center py-12">
                  <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No users found</h3>
                  <p className="text-muted-foreground mb-4">
                    {loading ? "Loading users..." : "Users will appear here once they register on your store"}
                  </p>
                  {loading && (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Registration Date</TableHead>
                        <TableHead className="hidden md:table-cell">Last Activity</TableHead>
                        <TableHead className="hidden sm:table-cell">Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell className="text-muted-foreground">{customer.email}</TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell>{formatDate(customer.created_at)}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {customer.last_order_date 
                              ? formatDate(customer.last_order_date) 
                              : "No activity recorded"
                            }
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline">
                              {customer.email.includes('shbhtshukla930') ? 'OWNER' : 'CUSTOMER'}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(customer.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCustomer(customer)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCustomer(customer)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={customer.email.includes('shbhtshukla930')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    
    {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Edit customer name and phone number. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone *
              </Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCustomer}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone.
              {customerToDelete && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="font-medium text-red-800">Customer to delete:</p>
                  <p className="text-red-700">{customerToDelete.name} ({customerToDelete.email})</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteCustomer}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;