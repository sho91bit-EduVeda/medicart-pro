import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, TrendingUp, Mail, Plus, Database, Percent, MessageSquare, ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect, useState } from "react";

interface DashboardHomeProps {
  onNavigate: (section: string) => void;
  stats: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    todaySales: number;
  };
}

export const DashboardHome = ({ onNavigate, stats }: DashboardHomeProps) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 638);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 638);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      {isMobile ? (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="quick-stats">
            <AccordionTrigger className="text-lg font-semibold">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Quick Stats
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-4 pt-4">
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onNavigate('manage-inventory')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-100">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Products</p>
                        <p className="text-lg font-bold">{stats.totalProducts}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onNavigate('manage-inventory')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-yellow-100">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Low Stock</p>
                        <p className="text-lg font-bold">{stats.lowStock}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onNavigate('manage-inventory')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-red-100">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Out of Stock</p>
                        <p className="text-lg font-bold">{stats.outOfStock}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onNavigate('orders')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-100">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Today's Sales</p>
                        <p className="text-lg font-bold">₹{stats.todaySales}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onNavigate('manage-inventory')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onNavigate('manage-inventory')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-100">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold">{stats.lowStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onNavigate('manage-inventory')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-red-100">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Out of Stock</p>
                  <p className="text-2xl font-bold">{stats.outOfStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onNavigate('orders')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today's Sales</p>
                  <p className="text-2xl font-bold">₹{stats.todaySales}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Primary Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          className="cursor-pointer"
          onClick={() => onNavigate('manage-inventory')}
        >
          <Card className="h-48 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 hover:border-primary/40 transition-all">
            <CardContent className="flex flex-col items-center justify-center h-full">
              <Package className="w-16 h-16 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-2">Inventory Management</h3>
              <p className="text-muted-foreground text-center">
                Manage products, stock levels, and categories
              </p>
            </CardContent>
          </Card>
        </div>

        <div 
          className="cursor-pointer"
          onClick={() => onNavigate('sales-reporting')}
        >
          <Card className="h-48 bg-gradient-to-br from-green-500/10 to-green-500/5 border-2 border-green-500/20 hover:border-green-500/40 transition-all">
            <CardContent className="flex flex-col items-center justify-center h-full">
              <TrendingUp className="w-16 h-16 text-green-600 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Sales Reporting</h3>
              <p className="text-muted-foreground text-center">
                View sales analytics, reports, and trends
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate('add-product')}
        >
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Plus className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-sm font-medium text-center">Add Product</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate('features')}
        >
          <CardContent className="flex flex-col items-center justify-center p-6">
            <ChevronDown className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-sm font-medium text-center">Features</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate('offers')}
        >
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Percent className="w-8 h-8 text-orange-600 mb-2" />
            <p className="text-sm font-medium text-center">Offers</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate('requests')}
        >
          <CardContent className="flex flex-col items-center justify-center p-6">
            <MessageSquare className="w-8 h-8 text-cyan-600 mb-2" />
            <p className="text-sm font-medium text-center">Requests</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};