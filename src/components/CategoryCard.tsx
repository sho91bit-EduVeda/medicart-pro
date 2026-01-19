import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Pill, Stethoscope, Baby, Syringe, Package, Bandage, Thermometer, Heart, ArrowRight } from "lucide-react";
import LottieAnimation from "./LottieAnimation";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  productCount?: number;
  variants?: any;
  animationData?: any;
}

// Map category names to appropriate icons
const getCategoryIcon = (categoryName: string) => {
  const lowerName = categoryName.toLowerCase();
  if (lowerName.includes("baby") || lowerName.includes("infant")) return Baby;
  if (lowerName.includes("medicine") || lowerName.includes("tablet") || lowerName.includes("capsule")) return Pill;
  if (lowerName.includes("health") || lowerName.includes("care") || lowerName.includes("wellness")) return Stethoscope;
  if (lowerName.includes("inject") || lowerName.includes("syringe")) return Syringe;
  if (lowerName.includes("bottle") || lowerName.includes("liquid") || lowerName.includes("syrup")) return Package;
  if (lowerName.includes("wound") || lowerName.includes("bandage") || lowerName.includes("first aid")) return Bandage;
  if (lowerName.includes("temperature") || lowerName.includes("fever")) return Thermometer;
  if (lowerName.includes("heart") || lowerName.includes("cardio")) return Heart;
  return Pill; // Default icon
};

const CategoryCard = ({ id, name, description, imageUrl, productCount, variants, animationData }: CategoryCardProps) => {
  const navigate = useNavigate();
  const IconComponent = getCategoryIcon(name);

  return (
    <motion.div
      variants={variants || {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      className="group h-[240px] w-full [perspective:1000px]"
    >
      <div
        onClick={() => navigate(`/category/${id}`)}
        className="relative h-full w-full transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] cursor-pointer"
      >
        {/* Front Face */}
        <div className="absolute inset-0 h-full w-full rounded-xl bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 border border-zinc-200 dark:border-zinc-800 shadow-md [backface-visibility:hidden] overflow-hidden">
          {/* Background Gradient/Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/5" />

          <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
            {/* New Badge */}
            <div className="absolute top-3 right-3">
              <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                NEW
              </span>
            </div>

            {/* Icon or Animation */}
            <div className="mb-4 transform transition-transform duration-300 group-hover:scale-110">
              {animationData ? (
                <div className="w-20 h-20">
                  <LottieAnimation animationData={animationData} />
                </div>
              ) : imageUrl ? (
                <img
                  src={imageUrl}
                  alt={name}
                  className="w-20 h-20 object-cover rounded-full shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <IconComponent className="w-10 h-10 text-primary" />
                </div>
              )}
            </div>

            <h3 className="font-bold text-lg text-foreground px-2 w-full truncate">
              {name}
            </h3>

            {/* Subtle Product Count on Front */}
            {productCount !== undefined && (
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {productCount} items
              </p>
            )}
          </div>
        </div>

        {/* Back Face */}
        <div className="absolute inset-0 h-full w-full rounded-xl bg-gradient-to-br from-primary to-secondary/90 text-primary-foreground [transform:rotateY(180deg)] [backface-visibility:hidden] p-6 flex flex-col items-center justify-center text-center shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/30" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

          <div className="relative z-10 flex flex-col items-center h-full justify-between py-2">
            <div>
              <IconComponent className="w-10 h-10 mb-3 text-white/90 mx-auto" />
              <h3 className="font-bold text-xl mb-2">{name}</h3>
              {description && (
                <p className="text-sm text-white/90 leading-relaxed line-clamp-3">
                  {description}
                </p>
              )}
            </div>

            <div className="mt-auto w-full">
              <button className="w-full bg-white text-primary font-semibold text-sm py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-white/90 transition-colors shadow-sm">
                Explore
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CategoryCard;