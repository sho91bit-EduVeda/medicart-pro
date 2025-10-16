import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import UnavailableMedicinesSheet from "@/components/UnavailableMedicinesSheet";
import { ProductFilters, FilterOptions } from "@/components/ProductFilters";
import { StockStatus } from "@/components/StockStatus";
import { ShieldCheck, Search, Store, Package } from "lucide-react";
import { toast } from "sonner";
import { whatsappService } from "@/services/whatsappService";
import heroBanner from "@/assets/hero-banner.jpg";
import babyImage from "@/assets/category-baby.jpg";
import allergyImage from "@/assets/category-allergy.jpg";
import coldFluImage from "@/assets/category-cold-flu.jpg";
import antibioticsImage from "@/assets/category-antibiotics.jpg";

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Product {
  id: string;
  name: string;
  category_id?: string;
  original_price: number;
  image_url?: string;
  in_stock: boolean;
  brand?: string;
  medicine_type?: string;
  expiry_date?: string;
  requires_prescription?: boolean;
  quantity?: number;
  categories?: {
    name: string;
  };
}

const categoryImages: Record<string, string> = {
  "Baby Products": babyImage,
  "Allergy": allergyImage,
  "Cold & Flu": coldFluImage,
  "Antibiotics": antibioticsImage,
};

const Index = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, signOut, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, []);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const selectedCategory = searchParams.get("category");

  useEffect(() => {
    fetchData();
    // Initialize WhatsApp service
    whatsappService.initialize();
  }, [selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch products
      let query = supabase
        .from("products")
        .select("*, categories(name)")
        .order("name");

      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory);
      }

      const { data: productsData, error: productsError } = await query;

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Fetch discount
      const { data: settingsData, error: settingsError } = await supabase
        .from("store_settings")
        .select("discount_percentage")
        .single();

      if (settingsError) throw settingsError;
      setDiscountPercentage(settingsData?.discount_percentage || 0);
    } catch (error: any) {
      toast.error("Failed to load store data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Debounced search tracking function
  const trackSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;

    const resultsCount = filteredProducts.length;
    
    // Log the search
    await whatsappService.logSearch(query, resultsCount);

    // If no results found, track as unavailable medicine
    if (resultsCount === 0) {
      await whatsappService.trackUnavailableMedicine(query);
    }
  }, [filteredProducts.length]);

  // Handle search input change with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for tracking
    const timeout = setTimeout(() => {
      trackSearch(value);
    }, 1000); // 1 second delay

    setSearchTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <div className="p-2 rounded-lg bg-primary/10">
                <Store className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">MedStore</h1>
                <p className="text-xs text-muted-foreground">Your Trusted Pharmacy</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UnavailableMedicinesSheet>
                <Button variant="outline" size="sm">
                  <Package className="w-4 h-4 mr-2" />
                  Track Medicines
                </Button>
              </UnavailableMedicinesSheet>
              {isAuthenticated ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => navigate("/owner")}> 
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    signOut();
                    navigate("/");
                  }}>
                    Logout
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => navigate("/auth")}> 
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Owner Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative h-[400px] overflow-hidden">
        <img
          src={heroBanner}
          alt="Medical Store"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/60 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl text-white">
              <h2 className="text-5xl font-bold mb-4">Your Health, Our Priority</h2>
              <p className="text-xl mb-6 text-white/90">
                Quality medicines with detailed information at your fingertips
              </p>
              {discountPercentage > 0 && (
                <div className="inline-block bg-destructive text-destructive-foreground px-6 py-3 rounded-full font-bold text-lg">
                  🎉 {discountPercentage}% OFF on all products!
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Categories Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">Shop by Category</h2>
            {selectedCategory && (
              <Button variant="outline" onClick={() => navigate("/")}>
                Clear Filter
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                id={category.id}
                name={category.name}
                description={category.description}
                imageUrl={categoryImages[category.name]}
              />
            ))}
          </div>
        </section>

        {/* Search Bar and Filters */}
        <section className="mb-8">
          <div className="relative max-w-2xl mx-auto mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="search"
              placeholder="Search for medicines..."
              className="pl-12 h-12 text-lg"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          
          <ProductFilters
            onFilterChange={(filters) => {
              // Apply filters to products
              const filtered = products.filter((product) => {
                const price = product.original_price * (1 - discountPercentage / 100);
                const matchesPrice = price >= filters.priceRange[0] && price <= filters.priceRange[1];
                const matchesBrand = filters.brand === 'all' || product.brand === filters.brand;
                // Add more filter conditions here
                return matchesPrice && matchesBrand;
              });
              setProducts(filtered);
            }}
            brands={["Brand 1", "Brand 2"]} // Replace with actual brands
            medicineTypes={["Tablet", "Syrup", "Injection"]} // Replace with actual types
            maxPrice={2000} // Replace with actual max price
          />
</section>
        {/* Products Grid */}
        <section>
          <h2 className="text-3xl font-bold mb-6">
            {selectedCategory
              ? categories.find((c) => c.id === selectedCategory)?.name || "Products"
              : "All Products"}
          </h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  category={product.categories?.name || "Uncategorized"}
                  originalPrice={product.original_price}
                  discountPercentage={discountPercentage}
                  imageUrl={product.image_url}
                  inStock={product.in_stock}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-muted mt-20 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Store className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">MedStore</span>
          </div>
          <p className="text-muted-foreground">
            Your trusted online medical store with quality products and detailed information.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            © 2025 MedStore. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
