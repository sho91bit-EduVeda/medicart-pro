import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, PackagePlus, Pill, Stethoscope, Baby, Syringe, Package, Bandage, Thermometer, HeartPulse } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import RequestMedicineSheet from "@/components/common/RequestMedicineSheet";
import { motion, useAnimation, Variants } from "framer-motion";
import LottieAnimation from "../common/LottieAnimation";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

interface MobileProductCardProps {
  id: string;
  name: string;
  original_price: number;
  image_url?: string;
  in_stock: boolean;
  quantity?: number;
  requires_prescription?: boolean;
  discountPercentage?: number;
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

export default function MobileProductCard({
  id,
  name,
  original_price,
  image_url,
  in_stock,
  quantity = 0,
  requires_prescription = false,
  discountPercentage = 0,
  onClick,
  variants,
  custom,
  category_animation_data,
  showRequestOption = true,
}: MobileProductCardProps) {
  const { deliveryEnabled } = useFeatureFlags();
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  
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

  // Show request button only when out of stock AND showRequestOption is true
  const showRequestButton = quantity === 0 && showRequestOption;

  // Clean stock status badges
  const getStockBadge = () => {
    if (quantity === 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          Out of stock
        </span>
      );
    } else if (quantity <= 2) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          Low stock ({quantity})
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          In stock
        </span>
      );
    }
  };

  return (
    <motion.div 
      className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
      onClick={handleClick}
      whileHover={{ y: -4 }}
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
          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
            <div className="w-16 h-16">
              <LottieAnimation animationData={category_animation_data} />
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
            <IconComponent className="w-16 h-16 text-blue-600" />
          </div>
        )}
        
        {/* Clean stock badge */}
        <div className="absolute top-2 left-2">
          {getStockBadge()}
        </div>
        
        {deliveryEnabled && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 rounded-full bg-white/80 hover:bg-white shadow-sm p-1.5"
            onClick={handleWishlistToggle}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </Button>
        )}
        
        {showRequestButton && (
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <RequestMedicineSheet medicineName={name} isFromProductSection={true}>
              <Button
                size="sm"
                className="rounded-full shadow-md bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 text-xs"
                onClick={(e) => {
                  // Prevent event from bubbling up to the card
                  e.stopPropagation();
                }}
              >
                <PackagePlus className="w-3 h-3 mr-1" />
                Request
              </Button>
            </RequestMedicineSheet>
          </div>
        )}
      </div>
      
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">{name}</h3>
        
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="font-bold text-base text-gray-900">₹{discountedPrice.toFixed(2)}</span>
          {discountPercentage > 0 && (
            <>
              <span className="text-gray-500 line-through text-sm">
                ₹{original_price.toFixed(2)}
              </span>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                {discountPercentage}% OFF
              </span>
            </>
          )}
        </div>
        
        {requires_prescription && (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full mb-2">
            Rx Required
          </span>
        )}
        
        {/* Show request button only when out of stock */}
        {showRequestButton && (
          <div className="mt-2">
            <RequestMedicineSheet medicineName={name} isFromProductSection={true}>
              <Button 
                size="sm"
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm"
                onClick={(e) => {
                  // Prevent event from bubbling up to the card
                  e.stopPropagation();
                }}
              >
                <PackagePlus className="w-4 h-4 mr-2" />
                Request Medicine
              </Button>
            </RequestMedicineSheet>
          </div>
        )}
      </div>
    </motion.div>
  );
}