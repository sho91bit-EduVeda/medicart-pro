import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, PackagePlus } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { StockStatus } from "@/components/StockStatus";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import RequestMedicineSheet from "@/components/RequestMedicineSheet";

interface ProductCardProps {
  id: string;
  name: string;
  original_price: number;
  image_url?: string;
  in_stock: boolean;
  quantity?: number;
  requires_prescription?: boolean;
  discountPercentage?: number;
  onClick?: () => void;
}

export default function ProductCard({
  id,
  name,
  original_price,
  image_url,
  in_stock,
  quantity = 0,
  requires_prescription = false,
  discountPercentage = 0,
  onClick,
}: ProductCardProps) {
  const { deliveryEnabled } = useFeatureFlags(); // Only use deliveryEnabled
  const { items, addItem } = useCart();
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setIsWishlisted(isInWishlist(id));
  }, [wishlistItems, id, isInWishlist]);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isWishlisted) {
      await removeFromWishlist(id);
    } else {
      await addToWishlist(id);
    }
    setIsWishlisted(!isWishlisted);
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsAdding(true);
    try {
      await addItem(id);
    } finally {
      setIsAdding(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click when clicking on interactive elements
    if (e.target instanceof HTMLElement && e.target.closest('button')) {
      return;
    }
    
    if (onClick) {
      onClick();
    }
  };

  const discountedPrice = original_price * (1 - discountPercentage / 100);

  return (
    <div 
      className="group relative bg-card rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
      onClick={handleClick}
    >
      <div className="aspect-square relative overflow-hidden">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-4xl">💊</span>
          </div>
        )}
        
        <div className="absolute top-4 left-4">
          <StockStatus quantity={quantity} />
        </div>

        {/* Use deliveryEnabled for wishlist functionality */}
        {deliveryEnabled && (
          <Button
            size="icon"
            variant="secondary"
            className={`absolute top-4 left-4 rounded-full shadow-lg transition-all duration-300 ${
              isWishlisted 
                ? 'bg-red-500 hover:bg-red-600 text-white opacity-100' 
                : 'bg-background/80 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100'
            }`}
            onClick={handleWishlistToggle}
          >
            <Heart
              className={`w-4 h-4 ${
                isWishlisted ? 'fill-current' : ''
              }`}
            />
          </Button>
        )}

        {/* Use deliveryEnabled for shopping cart functionality */}
        {deliveryEnabled && in_stock && (
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <Button
              size="sm"
              onClick={handleQuickAdd}
              disabled={isAdding}
              className="rounded-full shadow-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {isAdding ? 'Adding...' : 'Add'}
            </Button>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold line-clamp-2 mb-2">{name}</h3>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="font-bold text-lg">₹{discountedPrice.toFixed(2)}</span>
          {discountPercentage > 0 && (
            <>
              <span className="text-muted-foreground line-through text-sm">
                ₹{original_price.toFixed(2)}
              </span>
              <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                {discountPercentage}% OFF
              </span>
            </>
          )}
        </div>
        
        {requires_prescription && (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mb-3">
            Prescription Required
          </span>
        )}
        
        {/* Use deliveryEnabled for shopping cart functionality */}
        {deliveryEnabled && in_stock && (
          <Button 
            className="w-full rounded-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            onClick={handleQuickAdd}
            disabled={isAdding}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isAdding ? 'Adding to Cart...' : 'Add to Cart'}
          </Button>
        )}
        
        {!in_stock && (
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full rounded-full" disabled>
              Out of Stock
            </Button>
            <RequestMedicineSheet medicineName={name}>
              <Button variant="secondary" className="w-full rounded-full flex items-center gap-2">
                <PackagePlus className="w-4 h-4" />
                Request Availability
              </Button>
            </RequestMedicineSheet>
          </div>
        )}
      </div>
    </div>
  );
}
