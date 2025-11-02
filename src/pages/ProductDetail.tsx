import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, AlertCircle, Pill, Info, ShoppingCart, Heart } from "lucide-react";
import { toast } from "sonner";
import { ProductReviewsSection } from "@/components/ProductReviewsSection";
import { ProductRecommendations } from "@/components/ProductRecommendations";
import { PrescriptionBadge } from "@/components/PrescriptionBadge";
import { PrescriptionUpload } from "@/components/PrescriptionUpload";
import { PrescriptionPreview } from "@/components/PrescriptionPreview";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { usePrescriptionUpload } from "@/hooks/usePrescriptionUpload";

interface Product {
  id: string;
  name: string;
  description?: string;
  uses?: string;
  side_effects?: string;
  composition?: string;
  original_price: number;
  image_url?: string;
  in_stock: boolean;
  requires_prescription?: boolean;
  category_id?: string;
  categories?: {
    name: string;
  };
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { toggleItem, isInWishlist, loadWishlist } = useWishlist();
  const { shoppingCart, wishlist: wishlistEnabled, prescriptionUpload: prescriptionEnabled } = useFeatureFlags();
  const {
    loadPrescriptionsForProduct,
    getPrescriptionsForProduct,
    removePrescription,
    hasPrescriptionForProduct
  } = usePrescriptionUpload();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch product
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("*, categories(name)")
          .eq("id", id)
          .single();

        if (productError) throw productError;
        setProduct(productData);

        // Fetch discount
        const { data: settingsData, error: settingsError } = await supabase
          .from("store_settings")
          .select("discount_percentage")
          .single();

        if (settingsError) throw settingsError;
        setDiscountPercentage(settingsData.discount_percentage || 0);

        // Load prescriptions if prescription is required
        if (prescriptionEnabled && productData.requires_prescription) {
          await loadPrescriptionsForProduct(productData.id);
        }
      } catch (error: any) {
        toast.error("Failed to load product details");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    if (wishlistEnabled) {
      loadWishlist();
    }
  }, [id, prescriptionEnabled, loadPrescriptionsForProduct]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/")}>Back to Store</Button>
        </Card>
      </div>
    );
  }

  const discountedPrice = product.original_price * (1 - discountPercentage / 100);
  const savings = product.original_price - discountedPrice;
  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = async () => {
    // Check if prescription is required but not uploaded
    if (product.requires_prescription && !hasPrescriptionForProduct(product.id)) {
      toast.error("Please upload a prescription before adding this item to cart");
      return;
    }
    await addItem(product.id, quantity);
  };

  const handleWishlistToggle = async () => {
    await toggleItem(product.id);
  };

  const handlePrescriptionUpload = (fileData: any) => {
    toast.success("Prescription uploaded successfully");
  };

  const handlePrescriptionError = (error: string) => {
    toast.error(error);
  };

  const handleRemovePrescription = async (prescriptionId: string) => {
    await removePrescription(prescriptionId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Product Details</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="rounded-xl overflow-hidden bg-muted">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full aspect-square object-cover"
              />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                <span className="text-9xl">💊</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {product.categories && (
                <Badge variant="secondary" className="mb-3">
                  {product.categories.name}
                </Badge>
              )}
              <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
              {!product.in_stock && (
                <Badge variant="destructive" className="mb-4">Out of Stock</Badge>
              )}
              {prescriptionEnabled && product.requires_prescription && (
                <div className="mb-4">
                  <PrescriptionBadge />
                </div>
              )}
            </div>

            {/* Pricing */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold text-primary">
                    ₹{discountedPrice.toFixed(2)}
                  </span>
                  {discountPercentage > 0 && (
                    <span className="text-xl text-muted-foreground line-through">
                      ₹{product.original_price.toFixed(2)}
                    </span>
                  )}
                </div>
                {discountPercentage > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-destructive text-destructive-foreground">
                      {discountPercentage}% OFF
                    </Badge>
                    <span className="text-secondary font-semibold">
                      You save ₹{savings.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  {shoppingCart && product.in_stock && (
                    <Button className="flex-1" size="lg" onClick={handleAddToCart}>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Add to Cart
                    </Button>
                  )}
                  {wishlistEnabled && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleWishlistToggle}
                      className={isWishlisted ? 'border-red-500 text-red-500' : ''}
                    >
                      <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500' : ''}`} />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  Description
                </h3>
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </div>
            )}

            <Separator />

            {/* Uses */}
            {product.uses && (
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Package className="w-5 h-5 text-secondary" />
                  Uses
                </h3>
                <p className="text-muted-foreground leading-relaxed">{product.uses}</p>
              </div>
            )}

            {/* Composition */}
            {product.composition && (
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-accent" />
                  Composition
                </h3>
                <p className="text-muted-foreground leading-relaxed">{product.composition}</p>
              </div>
            )}

            {/* Side Effects */}
            {product.side_effects && (
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  Side Effects
                </h3>
                <p className="text-muted-foreground leading-relaxed">{product.side_effects}</p>
              </div>
            )}
          </div>

          <div className="md:col-span-2 mt-8">
            <ProductReviewsSection productId={product.id} />
          </div>
        </div>

        <div className="container mx-auto px-4">
          <ProductRecommendations
            currentProductId={product.id}
            categoryId={product.category_id}
            limit={4}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
