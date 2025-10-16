import { useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { StockStatus } from "./StockStatus";
import { useFeatureFlags } from "../hooks/useFeatureFlags";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";
import { ShoppingCart, Heart, Star } from "lucide-react";
import { toast } from "sonner";

interface ProductCardProps {
  id: string;
  name: string;
  category: string;
  originalPrice: number;
  discountPercentage: number;
  imageUrl?: string;
  inStock: boolean;
  quantity?: number;
  averageRating?: number;
  reviewCount?: number;
}

const ProductCard = ({
  id,
  name,
  category,
  originalPrice,
  discountPercentage,
  imageUrl,
  inStock,
  quantity = 0,
  averageRating = 0,
  reviewCount = 0,
}: ProductCardProps) => {
  const navigate = useNavigate();
  const { shoppingCart, wishlist: wishlistEnabled, productReviews } = useFeatureFlags();
  const { addItem } = useCart();
  const { toggleItem, isInWishlist, loadWishlist } = useWishlist();

  useEffect(() => {
    if (wishlistEnabled) {
      loadWishlist();
    }
  }, [wishlistEnabled]);

  const discountedPrice = originalPrice * (1 - discountPercentage / 100);
  const savings = originalPrice - discountedPrice;
  const isWishlisted = isInWishlist(id);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!inStock) {
      toast.error('Product is out of stock');
      return;
    }
    await addItem(id, 1);
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleItem(id);
  };

  return (
    <Card
      className="group overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer border-2 hover:border-primary/20"
      onClick={() => navigate(`/product/${id}`)}
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted/50 to-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl opacity-50">💊</span>
          </div>
        )}

        {discountPercentage > 0 && (
          <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground shadow-lg text-sm px-3 py-1">
            {discountPercentage}% OFF
          </Badge>
        )}

        <div className="absolute top-3 left-3">
          <StockStatus quantity={quantity} />
        </div>

        {wishlistEnabled && (
          <Button
            size="icon"
            variant="secondary"
            className={`absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all ${
              isWishlisted ? 'opacity-100' : ''
            }`}
            onClick={handleWishlistToggle}
          >
            <Heart
              className={`w-4 h-4 ${
                isWishlisted ? 'fill-red-500 text-red-500' : ''
              }`}
            />
          </Button>
        )}

        {shoppingCart && inStock && (
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all">
            <Button
              size="sm"
              onClick={handleQuickAdd}
              className="shadow-lg"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <Badge variant="secondary" className="text-xs font-medium">
          {category}
        </Badge>

        <h3 className="font-bold text-lg line-clamp-2 min-h-[3.5rem] leading-tight group-hover:text-primary transition-colors">
          {name}
        </h3>

        {productReviews && reviewCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {averageRating.toFixed(1)} ({reviewCount})
            </span>
          </div>
        )}

        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl font-bold text-primary">
            ₹{discountedPrice.toFixed(2)}
          </span>
          {discountPercentage > 0 && (
            <>
              <span className="text-sm text-muted-foreground line-through">
                ₹{originalPrice.toFixed(2)}
              </span>
              <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                Save ₹{savings.toFixed(2)}
              </Badge>
            </>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full font-semibold"
          disabled={!inStock}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/product/${id}`);
          }}
          variant={inStock ? "default" : "secondary"}
        >
          {inStock ? "View Details" : "Out of Stock"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
