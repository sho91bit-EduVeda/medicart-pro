import React from 'react';
import LottieAnimation from './LottieAnimation';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import shopCartAnimation from '@/assets/animations/shop-cart.json';

interface CartIconWithAnimationProps {
  itemCount: number;
  className?: string;
}

const CartIconWithAnimation = React.forwardRef<HTMLButtonElement, CartIconWithAnimationProps>(({
  itemCount,
  className
}, ref) => {
  return (
    <Button 
      ref={ref}
      variant="outline" 
      size="icon"
      className={`relative hidden sm:flex items-center justify-center border-white/20 rounded-full ${className}`}
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
        <Badge className="absolute -top-1 -right-0 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full">
          {itemCount}
        </Badge>
      )}
    </Button>
  );
});

export default CartIconWithAnimation;