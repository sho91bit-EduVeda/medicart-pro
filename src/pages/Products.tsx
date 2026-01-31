import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/firebase/config";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Package, Store, Search, Pill, Baby, Stethoscope, Syringe, Menu } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import NotificationBell from "@/components/common/NotificationBell";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { UserAccountDropdown } from "@/components/common/UserAccountDropdown";
import { UnifiedAuth } from "@/components/common/UnifiedAuth";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { motion, useReducedMotion } from "framer-motion";
import logoImage from "@/assets/Logo.png";
import CommonHeader from "@/components/layout/CommonHeader";
import CompleteFooter from "@/components/layout/CompleteFooter";

// Import animations
import allergyAnim from "@/assets/animations/category-allergy.json";
import antibioticsAnim from "@/assets/animations/category-antibiotics.json";
import babyAnim from "@/assets/animations/category-baby.json";
import coldFluAnim from "@/assets/animations/category-cold-flu.json";
import painAnim from "@/assets/animations/category-pain.json";
import vitaminsAnim from "@/assets/animations/category-vitamins.json";

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
  stock_quantity?: number;
  average_rating?: number;
  review_count?: number;
  categories?: {
    name: string;
  };
  composition?: string;
}

const Products = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { isAuthenticated } = useAuth();
  const { isAuthenticated: isCustomerAuthenticated } = useCustomerAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Handle search submission
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      // Filter products based on search query
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.composition && product.composition.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredProducts(filtered);
    } else {
      // Show all products when search is cleared
      setFilteredProducts(products);
    }
  };
  const [loading, setLoading] = useState(true);
  const [discountPercentage] = useState(0); // In a real app, this would come from settings

  // Define Category interface
  interface Category {
    id: string;
    name: string;
    description?: string;
  }

  // Define category animations
  const categoryAnimations: Record<string, any> = {
    "Baby Products": babyAnim,
    "Allergy": allergyAnim,
    "Cold & Flu": coldFluAnim,
    "Antibiotics": antibioticsAnim,
    "Pain Relief": painAnim,
    "Vitamins": vitaminsAnim,
    "Proton Pump Inhibitor": painAnim,
  };

  // Actually, let's fetch categories separately
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, "categories"));
        const querySnapshot = await getDocs(q);
        const categoriesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];
        
        setCategories(categoriesData);
      } catch (error) {
        // Error logging removed for production
      }
    };

    fetchCategories();
  }, []);

  // Function to get category name by ID
  const getCategoryNameById = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : '';
  };

  // Function to get animation data for a category
  const getCategoryAnimation = (categoryName: string) => {
    // Return specific animation if exists, otherwise default to pain animation
    return categoryAnimations[categoryName] || painAnim;
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, "products"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any)
        })) as Product[];
        
        setProducts(productsData);
        setFilteredProducts(productsData);
      } catch (error) {
        // Error logging removed for production
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.categories && product.categories.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.composition && product.composition.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  // Map category names to appropriate icons
  const getCategoryIcon = (categoryName: string) => {
    const lowerName = categoryName.toLowerCase();
    if (lowerName.includes("baby")) return Baby;
    if (lowerName.includes("medicine") || lowerName.includes("tablet")) return Pill;
    if (lowerName.includes("health") || lowerName.includes("care")) return Stethoscope;
    return Syringe;
  };

  return (
    <div className="min-h-screen bg-background">
      <CommonHeader 
        showStoreButton={true} 
        showSearchBar={true}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
      />

      {/* Main Content with animations */}
      <motion.div 
        className="container mx-auto px-4 py-12"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
        <motion.div 
          className="text-center mb-12"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.5 }}
        >
          <motion.h1 
            className="text-4xl font-bold mb-4"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            Our Products
          </motion.h1>
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ delay: 0.1 }}
          >
            Explore our wide range of quality medicines and healthcare products
          </motion.p>
        </motion.div>

        {/* Search Bar with animation */}
        <motion.div 
          className="max-w-2xl mx-auto mb-12"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileFocus={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Input
                type="search"
                placeholder="Search for medicines, brands, or categories..."
                className="pl-12 pr-4 py-6 text-base rounded-2xl border-2 border-muted shadow-sm focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit();
                  }
                }}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Products Grid with animation */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ delay: 0.3 }}
        >
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-muted/50">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? "Try adjusting your search terms" : "We currently don't have any products listed"}
              </p>
              <Button onClick={() => setSearchQuery("")} variant="default" className="rounded-full">
                Clear Search
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {searchQuery ? "Search Results" : "All Products"}
                </h2>
                <p className="text-muted-foreground">
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                </p>
              </div>
              
              <motion.div 
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.03
                    }
                  }
                }}
              >
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                  >
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      original_price={product.original_price}
                      discountPercentage={discountPercentage}
                      productDiscountPercentage={product.discount_percentage}
                      image_url={product.image_url}
                      in_stock={product.in_stock}
                      quantity={product.stock_quantity || 0}
                      requires_prescription={product.requires_prescription}
                      category_animation_data={product.category_id ? getCategoryAnimation(getCategoryNameById(product.category_id)) : undefined}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}
        </motion.div>
      </motion.div>
      <CompleteFooter />
  </div>
  );
};

export default Products;