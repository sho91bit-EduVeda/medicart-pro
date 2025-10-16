import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { StockStatus } from "./StockStatus";
import { useFeatureFlags } from "../hooks/useFeatureFlags";

interface ProductCardProps {
  id: string;
  name: string;
  category: string;
  originalPrice: number;
  discountPercentage: number;
  imageUrl?: string;
  inStock: boolean;
  quantity?: number;
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
}: ProductCardProps) => {
  const navigate = useNavigate();
  const discountedPrice = originalPrice * (1 - discountPercentage / 100);
  const savings = originalPrice - discountedPrice;
  const { quickAddToCart } = useFeatureFlags();
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement add to cart logic
    alert('Added to cart!');
  };

  return (
    <Card 
      className="group overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer"
      onClick={() => navigate(`/product/${id}`)}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
            <span className="text-4xl text-muted-foreground">💊</span>
          </div>
        )}
        {discountPercentage > 0 && (
          <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground">
            {discountPercentage}% OFF
          </Badge>
        )}
        <div className="absolute top-2 left-2">
          <StockStatus quantity={quantity} />
        </div>
        {quickAddToCart && inStock && (
          <Button
            size="sm"
            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleQuickAdd}
          >
            Add to Cart
          </Button>
        )}
      </div>
      <CardContent className="p-4">
        <Badge variant="secondary" className="mb-2 text-xs">
          {category}
        </Badge>
        <h3 className="font-semibold text-lg line-clamp-2 mb-2">{name}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary">
            ₹{discountedPrice.toFixed(2)}
          </span>
          {discountPercentage > 0 && (
            <>
              <span className="text-sm text-muted-foreground line-through">
                ₹{originalPrice.toFixed(2)}
              </span>
              <span className="text-xs text-secondary font-medium">
                Save ₹{savings.toFixed(2)}
              </span>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full" 
          disabled={!inStock}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/product/${id}`);
          }}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
