import { useEffect, useState, useRef, useCallback } from "react";
import { db } from "@/integrations/firebase/config";
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc, DocumentData } from "firebase/firestore";
import ProductCard from "./ProductCard";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { motion, useInView, useAnimation } from "framer-motion";

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
  category_id?: string;
}

interface ProductRecommendationsProps {
  currentProductId?: string;
  categoryId?: string;
  limit?: number;
  onProductClick?: (productName: string) => void;
}

export function ProductRecommendations({
  currentProductId,
  categoryId,
  limit: limitCount = 4,
  onProductClick,
}: ProductRecommendationsProps) {
  const { productRecommendations } = useFeatureFlags();
  const [products, setProducts] = useState<Product[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Animation refs and controls
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-20% 0px" });
  const controls = useAnimation();

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      // Simplified query without composite index requirement
      let q;
      
      if (categoryId) {
        // Query by category first, then filter in stock and sort by rating client-side
        q = query(
          collection(db, 'products'),
          where('category_id', '==', categoryId),
          limit(limitCount * 3) // Get more items to filter later
        );
      } else {
        // General query, get products and filter/sort client-side
        q = query(
          collection(db, 'products'),
          limit(limitCount * 3) // Get more items to filter later
        );
      }

      const querySnapshot = await getDocs(q);
      let productsData = querySnapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          name: data.name || '',
          original_price: data.original_price || 0,
          image_url: data.image_url,
          in_stock: data.in_stock || false,
          average_rating: data.average_rating,
          review_count: data.review_count,
          stock_quantity: data.stock_quantity,
          categories: data.categories,
          category_id: data.category_id
        } as Product;
      });

      // Client-side filtering for in_stock and sorting by rating
      productsData = productsData
        .filter(product => product.in_stock)
        .sort((a, b) => {
          const ratingA = a.average_rating || 0;
          const ratingB = b.average_rating || 0;
          return ratingB - ratingA;
        })
        .slice(0, limitCount); // Limit to the requested count

      // Client-side filtering for currentProductId
      if (currentProductId) {
        productsData = productsData.filter(p => p.id !== currentProductId);
      }

      setProducts(productsData);

      const settingsRef = doc(db, "settings", "store");
      const settingsSnap = await getDoc(settingsRef);

      if (settingsSnap.exists()) {
        setDiscountPercentage(settingsSnap.data().discount_percentage || 0);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryId, currentProductId, limitCount]);

  useEffect(() => {
    if (productRecommendations) {
      loadRecommendations();
    }
  }, [currentProductId, categoryId, productRecommendations, loadRecommendations]);

  // Don't show recommendations if disabled
  if (!productRecommendations || loading || products.length === 0) {
    return null;
  }

  return (
    <motion.section 
      ref={ref}
      className="py-6 bg-muted/30 rounded-2xl px-6 mb-6"  // Further reduced padding and margin
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.05,
            duration: 0.4
          }
        }
      }}
    >
      <motion.h2 
        className="text-3xl font-bold mb-8"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 }
        }}
      >
        {currentProductId ? 'You May Also Like' : 'Recommended For You'}
      </motion.h2>
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.05
            }
          }
        }}
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            original_price={product.original_price}
            discountPercentage={discountPercentage}
            productDiscountPercentage={product.discount_percentage}
            image_url={product.image_url}
            in_stock={product.in_stock}
            quantity={product.stock_quantity || 0}
            onClick={onProductClick ? () => onProductClick(product.name) : undefined}
            showRequestOption={false}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
          />
        ))}
      </motion.div>
    </motion.section>
  );
}