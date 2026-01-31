import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, PackagePlus, ShoppingCart, Pill, Stethoscope, Baby, Syringe, Package, Bandage, Thermometer, HeartPulse } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { StockStatus } from "@/components/common/StockStatus";
import RequestMedicineSheet from "@/components/common/RequestMedicineSheet";
import { motion, useAnimation, Variants } from "framer-motion";
import LottieAnimation from "../common/LottieAnimation";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

interface ProductCardProps {
  id: string;
  name: string;
  original_price: number;
  image_url?: string;
  in_stock: boolean;
  quantity?: number;
  requires_prescription?: boolean;
  discountPercentage?: number;
  productDiscountPercentage?: number;
  onClick?: () => void;
  variants?: Variants;
  custom?: Record<string, unknown>;
  category_id?: string;
  category_animation_data?: any;
  showRequestOption?: boolean;
}

// Map product names to appropriate icons
const getProductIcon = (productName: string) => {
  const lowerName = productName.toLowerCase();
  if (lowerName.includes("baby") || lowerName.includes("infant")) return Baby;
  if (lowerName.includes("syringe") || lowerName.includes("inject")) return Syringe;
  if (lowerName.includes("bottle") || lowerName.includes("liquid") || lowerName.includes("syrup")) return Package;
  if (lowerName.includes("health") || lowerName.includes("care") || lowerName.includes("wellness")) return Stethoscope;
  if (lowerName.includes("wound") || lowerName.includes("bandage") || lowerName.includes("first aid")) return Bandage;
  if (lowerName.includes("temperature") || lowerName.includes("fever") || lowerName.includes("thermometer")) return Thermometer;
  if (lowerName.includes("heart") || lowerName.includes("cardio")) return HeartPulse;
  return Pill; // Default icon for pills, tablets, capsules, etc.
};

export default function ProductCard({
  id,
  name,
  original_price,
  image_url,
  in_stock,
  quantity = 0,
  requires_prescription = false,
  discountPercentage = 0,
  productDiscountPercentage,
  onClick,
  variants,
  custom,
  category_animation_data,
  showRequestOption = true,
}: ProductCardProps) {
  const { deliveryEnabled } = useFeatureFlags();
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();
  
  const [isWishlisted, setIsWishlisted] = useState(false);
  const lowStockControls = useAnimation();
  const IconComponent = getProductIcon(name);

  useEffect(() => {
    setIsWishlisted(isInWishlist(id));
  }, [wishlistItems, id, isInWishlist]);

  // Pulse animation for low stock items
  useEffect(() => {
    if (quantity > 0 && quantity <= 2) { // Low stock threshold
      lowStockControls.start({
        scale: [1, 1.05, 1],
        transition: {
          duration: 1.5,
          repeat: Infinity,
          repeatType: "reverse"
        }
      });
    }
  }, [quantity, lowStockControls]);

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

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!in_stock) {
      toast.error('Cannot add out of stock item to cart');
      return;
    }
    
    await addToCart(id);
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

  // Use product-specific discount if available, otherwise use global discount
  const effectiveDiscount = productDiscountPercentage !== undefined && productDiscountPercentage > 0 
    ? productDiscountPercentage 
    : discountPercentage;
  const discountedPrice = original_price * (1 - effectiveDiscount / 100);

  // Show request button only when out of stock AND showRequestOption is true
  const showRequestButton = quantity === 0 && showRequestOption;

  return (
    <motion.div 
      className="group relative bg-card rounded-lg border overflow-hidden shadow-xs hover:shadow-sm transition-all duration-300 cursor-pointer h-full"
      onClick={handleClick}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      variants={variants || {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      <div className="aspect-square relative overflow-hidden">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : category_animation_data ? (
          <div className="w-full h-full bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16">
              <LottieAnimation animationData={category_animation_data} />
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
            <IconComponent className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
          </div>
        )}
        
        <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2">
          <motion.div animate={quantity > 0 && quantity <= 2 ? lowStockControls : {}}>
            <StockStatus quantity={quantity} />
          </motion.div>
        </div>
        
        {deliveryEnabled && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 rounded-full bg-white/80 hover:bg-white shadow-sm p-1 sm:p-1.5"
            onClick={handleWishlistToggle}
          >
            <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </Button>
        )}

        <div className="absolute bottom-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
          {in_stock && deliveryEnabled && (
            <Button
              size="sm"
              className="rounded-full shadow-md bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 h-6 sm:h-7 px-1.5 sm:px-2"
              onClick={handleAddToCart}
              disabled={!in_stock}
            >
              <ShoppingCart className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
              <span className="text-[0.65rem] sm:text-xs">Cart</span>
            </Button>
          )}
          {showRequestButton && (
            <RequestMedicineSheet medicineName={name} isFromProductSection={true}>
              <Button
                size="sm"
                className="rounded-full shadow-md bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 h-6 sm:h-7 px-1.5 sm:px-2"
                onClick={(e) => {
                  // Prevent event from bubbling up to the card
                  e.stopPropagation();
                }}
              >
                <PackagePlus className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                <span className="text-[0.65rem] sm:text-xs">Request</span>
              </Button>
            </RequestMedicineSheet>
          )}
        </div>
      </div>
      
      <div className="p-2 sm:p-3">
        <h3 className="font-medium text-sm sm:text-sm line-clamp-2 mb-1 sm:mb-1.5">{name}</h3>
        
        <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
          <span className="font-bold text-sm sm:text-base">₹{discountedPrice.toFixed(2)}</span>
          {effectiveDiscount > 0 && (
            <>
              <span className="text-muted-foreground line-through text-xs">
                ₹{original_price.toFixed(2)}
              </span>
              <span className="text-[0.65rem] sm:text-xs bg-destructive/10 text-destructive px-1 py-0.5 rounded">
                {effectiveDiscount}% OFF
              </span>
            </>
          )}
        </div>
        
        {requires_prescription && (
          <span className="inline-flex items-center px-1 py-0.5 text-[0.6rem] sm:text-xs font-medium bg-blue-100 text-blue-800 rounded-full mb-1.5 sm:mb-2">
            Prescription Required
          </span>
        )}
        
        {/* Show request button only when out of stock */}
        {showRequestButton && (
          <div className="flex flex-col gap-1.5">
            <RequestMedicineSheet medicineName={name} isFromProductSection={true}>
              <Button 
                size="sm"
                className="w-full rounded-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 h-7 sm:h-8 text-[0.65rem] sm:text-xs px-1.5 sm:px-2"
                onClick={(e) => {
                  // Prevent event from bubbling up to the card
                  e.stopPropagation();
                }}
              >
                <PackagePlus className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                Request
              </Button>
            </RequestMedicineSheet>
          </div>
        )}
      </div>
    </motion.div>
  );
}