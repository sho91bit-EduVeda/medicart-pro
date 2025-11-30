import { useEffect, useState } from "react";
import { db } from "@/integrations/firebase/config";
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";
import ProductCard from "./ProductCard";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

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

  useEffect(() => {
    if (productRecommendations) {
      loadRecommendations();
    }
  }, [currentProductId, categoryId, productRecommendations]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      let q = query(
        collection(db, 'products'),
        where('in_stock', '==', true),
        orderBy('average_rating', 'desc'),
        limit(limitCount)
      );

      if (categoryId) {
        q = query(
          collection(db, 'products'),
          where('in_stock', '==', true),
          where('category_id', '==', categoryId),
          orderBy('average_rating', 'desc'),
          limit(limitCount)
        );
      }

      const querySnapshot = await getDocs(q);
      let productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      // Client-side filtering for currentProductId since Firestore doesn't support != in combination with other filters easily in all cases or to keep it simple
      if (currentProductId) {
        productsData = productsData.filter(p => p.id !== currentProductId);
      }

      // If we filtered out a product, we might have less than limit, but that's acceptable for recommendations

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
  };

  if (!productRecommendations || loading || products.length === 0) {
    return null;
  }

  return (
    <div className="py-12 bg-muted/30 rounded-2xl px-6">
      <h2 className="text-3xl font-bold mb-8">
        {currentProductId ? 'You May Also Like' : 'Recommended For You'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            original_price={product.original_price}
            discountPercentage={discountPercentage}
            image_url={product.image_url}
            in_stock={product.in_stock}
            quantity={product.stock_quantity || 0}
            onClick={onProductClick ? () => onProductClick(product.name) : undefined}
          />
        ))}
      </div>
    </div>
  );
}