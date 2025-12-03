import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, PackagePlus } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { StockStatus } from "@/components/StockStatus";
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
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  
  const [isWishlisted, setIsWishlisted] = useState(false);

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

  // Show request button only when out of stock
  const showRequestButton = quantity === 0;

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

        {showRequestButton && (
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <RequestMedicineSheet medicineName={name}>
              <Button
                size="sm"
                className="rounded-full shadow-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                <PackagePlus className="w-4 h-4 mr-2" />
                Request
              </Button>
            </RequestMedicineSheet>
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
        
        {/* Show stock status prominently */}
        <div className="mb-3">
          <StockStatus quantity={quantity} />
        </div>
        
        {/* Show request button only when out of stock */}
        {showRequestButton && (
          <div className="flex flex-col gap-2">
            <RequestMedicineSheet medicineName={name}>
              <Button 
                className="w-full rounded-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                <PackagePlus className="w-4 h-4 mr-2" />
                Request Availability
              </Button>
            </RequestMedicineSheet>
          </div>
        )}
      </div>
    </div>
  );
}