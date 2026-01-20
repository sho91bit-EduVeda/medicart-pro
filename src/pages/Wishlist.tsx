import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "@/hooks/useWishlist";
import { db } from "@/integrations/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { useAuth } from "@/hooks/useAuth";
import { SearchPopup } from "@/components/common/SearchPopup";
import { motion, useReducedMotion } from "framer-motion";

interface Product {
  id: string;
  name: string;
  original_price: number;
  image_url?: string;
  in_stock: boolean;
  average_rating?: number;
  review_count?: number;
  stock_quantity?: number;
  categories?: {
    name: string;
  };
}

export default function Wishlist() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { isAuthenticated, user } = useAuth();
  const { items: wishlistIds, loadWishlist } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchPopup, setShowSearchPopup] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    try {
      await loadWishlist();

      if (wishlistIds.length === 0) {
        setLoading(false);
        return;
      }

      // Firestore doesn't support 'in' query for more than 10 items or document IDs directly in 'in' clause easily for this structure
      // So we fetch all products and filter (not efficient for large datasets but works for small wishlist)
      // Or better, fetch each document by ID

      const productsData: Product[] = [];
      for (const id of wishlistIds) {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          productsData.push({ id: docSnap.id, ...docSnap.data() } as Product);
        }
      }

      setProducts(productsData);

      const settingsRef = doc(db, "settings", "store");
      const settingsSnap = await getDoc(settingsRef);

      if (settingsSnap.exists()) {
        setDiscountPercentage(settingsSnap.data().discount_percentage || 0);
      }
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wishlistIds.length > 0) {
      loadData();
    } else {
      setProducts([]);
    }
  }, [wishlistIds]);

  return (
    <div className="min-h-screen bg-background">
      <motion.header 
        className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
        initial={{ y: prefersReducedMotion ? 0 : -100 }}
        animate={{ y: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          mass: 1
        }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <motion.button 
            className="rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 w-10"
            onClick={() => navigate("/")}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <motion.h1 
            className="text-xl font-bold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            My Wishlist
          </motion.h1>
        </div>
      </motion.header>

      <motion.div 
        className="container mx-auto px-4 py-8"
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
        {/* Search Popup */}
        <SearchPopup 
          searchQuery={searchQuery} 
          isOpen={showSearchPopup} 
          onClose={() => setShowSearchPopup(false)} 
          showBackButton={false} // Set to false since we're viewing individual wishlist items
        />
        
        {loading ? (
          <motion.div 
            className="text-center py-12"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ duration: 0.5 }}
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading wishlist...</p>
          </motion.div>
        ) : products.length === 0 ? (
          <motion.div 
            className="text-center py-20"
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ delay: 0.2 }}
          >
            <Heart className="w-24 h-24 mx-auto mb-6 text-muted-foreground" />
            <motion.h2 
              className="text-3xl font-bold mb-4"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ delay: 0.3 }}
            >
              Your wishlist is empty
            </motion.h2>
            <motion.p 
              className="text-muted-foreground mb-8"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ delay: 0.4 }}
            >
              Start adding products you love to your wishlist
            </motion.p>
            <motion.button 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              onClick={() => navigate("/")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ delay: 0.5, type: "spring", stiffness: 400, damping: 17 }}
            >
              Browse Products
            </motion.button>
          </motion.div>
        ) : (
          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ delay: 0.2 }}
          >
            <motion.div 
              className="mb-8"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold">
                {products.length} {products.length === 1 ? 'item' : 'items'} in your wishlist
              </h2>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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
              transition={{ delay: 0.4 }}
            >
              {products.map((product) => (
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
                    image_url={product.image_url}
                    in_stock={product.in_stock}
                    quantity={product.stock_quantity || 0}
                    onClick={() => {
                      setSearchQuery(product.name);
                      setShowSearchPopup(true);
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
