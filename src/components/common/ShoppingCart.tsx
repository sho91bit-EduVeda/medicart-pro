import { useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { ShoppingCart as CartIcon, Trash2, Plus, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import CartIconWithAnimation from "./CartIconWithAnimation";
import LottieAnimation from "./LottieAnimation";
import shopCartAnimation from "@/assets/animations/shop-cart.json";

interface ShoppingCartProps {
  discountPercentage: number;
}

export function ShoppingCart({ discountPercentage }: ShoppingCartProps) {
  const { items, isLoading, loadCart, removeItem, updateQuantity, getItemCount, getTotal } = useCart();
  const { deliveryEnabled } = useFeatureFlags(); // Use deliveryEnabled to control in-store pickup cart visibility
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  // Use deliveryEnabled to control in-store pickup cart visibility
  if (!deliveryEnabled) return null;

  const itemCount = getItemCount();
  const total = getTotal(discountPercentage);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <CartIconWithAnimation
          itemCount={itemCount}
          className=""
        />
      </SheetTrigger>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="relative sm:hidden flex items-center justify-center border-white/20 rounded-full"
          title="Shopping Cart"
        >
          <div className="w-8 h-8">
            <LottieAnimation 
              animationData={shopCartAnimation} 
              width={32}
              height={32}
              loop={true}
              autoplay={true}
              className="w-full h-full"
            />
          </div>
          {itemCount > 0 && (
            <Badge className="absolute -top-1 -right-0 h-4 w-4 flex items-center justify-center p-0 text-[10px] rounded-full">
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full h-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>In-Store Pickup Cart ({itemCount} items)</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full py-6">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <div className="w-24 h-24 mx-auto mb-4">
                  <LottieAnimation 
                    animationData={shopCartAnimation} 
                    width={96}
                    height={96}
                    loop={true}
                    autoplay={true}
                  />
                </div>
                <p className="text-muted-foreground">Your in-store pickup cart is empty</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto space-y-4">
                {items.map((item) => {
                  const price = item.product?.original_price || 0;
                  const discountedPrice = price * (1 - discountPercentage / 100);
                  const itemTotal = discountedPrice * item.quantity;

                  return (
                    <div key={item.product_id} className="flex gap-4 p-4 border rounded-lg">
                      {item.product?.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <span>💊</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-sm line-clamp-2">{item.product?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ₹{discountedPrice.toFixed(2)} × {item.quantity}
                        </p>
                        <p className="font-semibold">₹{itemTotal.toFixed(2)}</p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => updateQuantity(item.product_id, Math.max(1, item.quantity - 1))}
                              disabled={isLoading}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                              disabled={isLoading}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive rounded-full"
                            onClick={() => removeItem(item.product_id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4 pt-4">
                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                  {discountPercentage > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({discountPercentage}%)</span>
                      <span>Applied</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <Button className="w-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-600 hover:from-blue-700 hover:via-indigo-800 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300" size="lg" onClick={() => navigate('/checkout')}>
                  Proceed to In-Store Pickup
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}