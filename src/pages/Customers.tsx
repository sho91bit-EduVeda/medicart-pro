import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/integrations/firebase/config";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
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
import { ArrowLeft, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";

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
        // Fetch customers from Firebase (assuming customers are stored in a 'customers' collection)
        const q = query(
          collection(db, "customers"),
          orderBy("created_at", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const customersData: Customer[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Customer, 'id'>)
        }));
        
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => {
                console.log("Customers page - Back button clicked");
                navigate("/owner");
              }}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Customers</h1>
              <p className="text-muted-foreground">
                Manage and view all registered customers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UsersIcon className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">{customers.length}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Customers</CardDescription>
                <CardTitle className="text-3xl">{customers.length}</CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Customers</CardDescription>
                <CardTitle className="text-3xl">
                  {customers.filter(c => c.status === "active").length}
                </CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
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
          </motion.div>
        </div>

        {/* Customers Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>
                All registered customers in the system
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
                  <h3 className="text-lg font-medium mb-2">No customers found</h3>
                  <p className="text-muted-foreground">
                    Customers will appear here once they register on your store
                  </p>
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
                        <TableHead className="hidden md:table-cell">Last Order</TableHead>
                        <TableHead className="hidden sm:table-cell">Orders</TableHead>
                        <TableHead>Status</TableHead>
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
                              : "No orders yet"
                            }
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline">
                              {customer.total_orders || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(customer.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Customers;