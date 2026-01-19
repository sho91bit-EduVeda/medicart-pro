import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, PackagePlus, Pill, Stethoscope, Baby, Syringe, Package, Bandage, Thermometer, HeartPulse } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { StockStatus } from "@/components/StockStatus";
import RequestMedicineSheet from "@/components/RequestMedicineSheet";
import { motion, useAnimation } from "framer-motion";
import LottieAnimation from "./LottieAnimation";

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
  variants?: any;
  custom?: any;
  category_id?: string;
  category_animation_data?: any;
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
  onClick,
  variants,
  custom,
  category_animation_data,
}: ProductCardProps) {
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

  // Show request button only when out of stock
  const showRequestButton = quantity === 0;

  return (
    <motion.div 
      className="group relative bg-card rounded-lg border overflow-hidden shadow-xs hover:shadow-sm transition-all duration-300 cursor-pointer"
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
            <div className="w-16 h-16">
              <LottieAnimation animationData={category_animation_data} />
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
            <IconComponent className="w-16 h-16 text-primary" />
          </div>
        )}
        
        <div className="absolute top-2 left-2">
          <motion.div animate={quantity > 0 && quantity <= 2 ? lowStockControls : {}}>
            <StockStatus quantity={quantity} />
          </motion.div>
        </div>

        {showRequestButton && (
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <RequestMedicineSheet medicineName={name}>
              <Button
                size="sm"
                className="rounded-full shadow-md bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 h-7 px-2"
              >
                <PackagePlus className="w-3 h-3 mr-1" />
                <span className="text-xs">Request</span>
              </Button>
            </RequestMedicineSheet>
          </div>
        )}
      </div>
      
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 mb-1.5">{name}</h3>
        
        <div className="flex items-center gap-1.5 mb-2">
          <span className="font-bold text-base">₹{discountedPrice.toFixed(2)}</span>
          {discountPercentage > 0 && (
            <>
              <span className="text-muted-foreground line-through text-xs">
                ₹{original_price.toFixed(2)}
              </span>
              <span className="text-xs bg-destructive/10 text-destructive px-1 py-0.5 rounded">
                {discountPercentage}% OFF
              </span>
            </>
          )}
        </div>
        
        {requires_prescription && (
          <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mb-2">
            Prescription Required
          </span>
        )}
        
        {/* Show request button only when out of stock */}
        {showRequestButton && (
          <div className="flex flex-col gap-1.5">
            <RequestMedicineSheet medicineName={name}>
              <Button 
                size="sm"
                className="w-full rounded-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 h-8 text-xs px-2"
              >
                <PackagePlus className="w-3 h-3 mr-1" />
                Request
              </Button>
            </RequestMedicineSheet>
          </div>
        )}
      </div>
    </motion.div>
  );
}