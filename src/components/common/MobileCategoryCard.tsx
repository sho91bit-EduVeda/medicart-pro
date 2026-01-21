import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Pill, Baby, Syringe, Package, Bandage, Thermometer, Heart, ArrowRight } from "lucide-react";
import LottieAnimation from "./LottieAnimation";
import { cn } from "@/lib/utils";

interface MobileCategoryCardProps {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  productCount?: number;
  animationData?: Record<string, unknown>;
}

// Map category names to appropriate icons
const getCategoryIcon = (categoryName: string) => {
  const lowerName = categoryName.toLowerCase();
  if (lowerName.includes("baby") || lowerName.includes("infant")) return Baby;
  if (lowerName.includes("medicine") || lowerName.includes("tablet") || lowerName.includes("capsule")) return Pill;
  if (lowerName.includes("inject") || lowerName.includes("syringe")) return Syringe;
  if (lowerName.includes("bottle") || lowerName.includes("liquid") || lowerName.includes("syrup")) return Package;
  if (lowerName.includes("wound") || lowerName.includes("bandage") || lowerName.includes("first aid")) return Bandage;
  if (lowerName.includes("temperature") || lowerName.includes("fever")) return Thermometer;
  if (lowerName.includes("heart") || lowerName.includes("cardio")) return Heart;
  return Pill; // Default icon
};

const MobileCategoryCard = ({ id, name, description, imageUrl, productCount, animationData }: MobileCategoryCardProps) => {
  const navigate = useNavigate();
  const IconComponent = getCategoryIcon(name);



  return (
    <motion.div
      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        onClick={() => navigate(`/category/${id}`)}
        className="cursor-pointer"
      >
        {/* Card Header with Icon/Animation */}
        <div className="p-4 flex flex-col items-center">
          <div className="mb-3">
            {animationData ? (
              <div className="w-16 h-16">
                <LottieAnimation animationData={animationData} />
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="w-16 h-16 object-cover rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <IconComponent className="w-8 h-8 text-blue-600" />
              </div>
            )}
          </div>

          {/* Category Name */}
          <h3 className="font-semibold text-gray-900 text-center text-sm mb-1 line-clamp-2">
            {name}
          </h3>

          {/* Product Count */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">
              {productCount} {productCount === 1 ? 'product' : 'products'}
            </span>
          </div>

          {/* Coming Soon Badge for 0 products - with consistent spacing */}
          {productCount === 0 ? (
            <span className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              Coming soon
            </span>
          ) : (
            <div className="h-8"></div> /* Spacer to maintain consistent height */
          )}
        </div>

        {/* Action Button */}
        <div className="px-4 pb-4">
          <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md">
            Explore
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileCategoryCard;