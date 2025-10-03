import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface CategoryCardProps {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  productCount?: number;
}

const CategoryCard = ({ id, name, description, imageUrl, productCount }: CategoryCardProps) => {
  const navigate = useNavigate();

  return (
    <Card 
      className="group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg"
      onClick={() => navigate(`/?category=${id}`)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">🏥</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="font-bold text-xl mb-1">{name}</h3>
          {description && (
            <p className="text-sm text-white/90 line-clamp-2">{description}</p>
          )}
          {productCount !== undefined && (
            <p className="text-xs text-white/80 mt-2">{productCount} products</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CategoryCard;
