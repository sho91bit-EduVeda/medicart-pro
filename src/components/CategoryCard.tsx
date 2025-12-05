import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Pill, Stethoscope, Baby, Syringe } from "lucide-react";
import { motion } from "framer-motion";

interface CategoryCardProps {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  productCount?: number;
  variants?: any;
}

// Map category names to appropriate icons
const getCategoryIcon = (categoryName: string) => {
  const lowerName = categoryName.toLowerCase();
  if (lowerName.includes("baby")) return Baby;
  if (lowerName.includes("medicine") || lowerName.includes("tablet")) return Pill;
  if (lowerName.includes("health") || lowerName.includes("care")) return Stethoscope;
  return Syringe;
};

const CategoryCard = ({ id, name, description, imageUrl, productCount, variants }: CategoryCardProps) => {
  const navigate = useNavigate();
  const IconComponent = getCategoryIcon(name);

  return (
    <motion.div
      className="group overflow-hidden cursor-pointer rounded-xl border-0 bg-gradient-to-br from-card to-muted shadow-sm"
      onClick={() => navigate(`/category/${id}`)}
      whileHover={{
        y: -8,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        backgroundColor: "hsl(var(--primary) / 0.05)"
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      variants={variants || {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      <div className="relative aspect-video overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
            <IconComponent className="w-12 h-12 text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
          New
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <div className="flex items-center gap-1.5 mb-1">
            <IconComponent className="w-4 h-4" />
            <h3 className="font-bold text-base group-hover:text-white transition-colors">{name}</h3>
          </div>
          {description && (
            <p className="text-xs text-white/90 line-clamp-2 mb-1">{description}</p>
          )}
          {productCount !== undefined && (
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs text-white">
              <span>{productCount} products</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CategoryCard;