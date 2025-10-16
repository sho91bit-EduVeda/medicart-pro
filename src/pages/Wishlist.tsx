import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "@/hooks/useWishlist";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useAuth } from "@/hooks/useAuth";

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

export default function Wishlist() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { items: wishlistIds, loadWishlist } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [loading, setLoading] = useState(true);

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

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*, categories(name)')
        .in('id', wishlistIds);

      if (productsError) throw productsError;

      setProducts(productsData || []);

      const { data: settingsData } = await supabase
        .from('store_settings')
        .select('discount_percentage')
        .maybeSingle();

      setDiscountPercentage(settingsData?.discount_percentage || 0);
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
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">My Wishlist</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading wishlist...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-24 h-24 mx-auto mb-6 text-muted-foreground" />
            <h2 className="text-3xl font-bold mb-4">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-8">
              Start adding products you love to your wishlist
            </p>
            <Button onClick={() => navigate("/")}>
              Browse Products
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold">
                {products.length} {products.length === 1 ? 'item' : 'items'} in your wishlist
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          </>
        )}
      </div>
    </div>
  );
}
