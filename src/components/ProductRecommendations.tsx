import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  quantity?: number;
  categories?: {
    name: string;
  };
}

interface ProductRecommendationsProps {
  currentProductId?: string;
  categoryId?: string;
  limit?: number;
}

export function ProductRecommendations({
  currentProductId,
  categoryId,
  limit = 4,
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
      let query = supabase
        .from('products')
        .select('*, categories(name)')
        .eq('in_stock', true)
        .limit(limit);

      if (currentProductId) {
        query = query.neq('id', currentProductId);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      query = query.order('average_rating', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      setProducts(data || []);

      const { data: settingsData } = await supabase
        .from('store_settings')
        .select('discount_percentage')
        .maybeSingle();

      setDiscountPercentage(settingsData?.discount_percentage || 0);
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
    <div className="py-12">
      <h2 className="text-3xl font-bold mb-6">
        {currentProductId ? 'You May Also Like' : 'Recommended For You'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            category={product.categories?.name || 'Uncategorized'}
            originalPrice={product.original_price}
            discountPercentage={discountPercentage}
            imageUrl={product.image_url}
            inStock={product.in_stock}
            quantity={product.quantity}
            averageRating={product.average_rating}
            reviewCount={product.review_count}
          />
        ))}
      </div>
    </div>
  );
}
