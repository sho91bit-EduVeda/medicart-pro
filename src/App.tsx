import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LazyMotion, domAnimation, useReducedMotion } from "framer-motion";
import Index from "./pages/Index";
import Owner from "./pages/Owner";
import ProductDetail from "./pages/ProductDetail";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import CategoryPage from "./pages/Category";
import Reviews from "./pages/Reviews";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Products from "./pages/Products";
import Offers from "./pages/Offers";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ShippingPolicy from "./pages/ShippingPolicy";
import NotFound from "./pages/NotFound";
import ProductSelectorDemo from "./pages/ProductSelectorDemo";
import AccordionDemo from "./components/AccordionDemo";

const queryClient = new QueryClient();

const MotionWrapper = ({ children }: { children: React.ReactNode }) => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <LazyMotion features={domAnimation}>
      {prefersReducedMotion ? (
        <div>{children}</div>
      ) : (
        children
      )}
    </LazyMotion>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MotionWrapper>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/owner" element={<Owner />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/category/:id" element={<CategoryPage />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/products" element={<Products />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/product-selector-demo" element={<ProductSelectorDemo />} />
            <Route path="/accordion-demo" element={<AccordionDemo />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </MotionWrapper>
  </QueryClientProvider>
);

export default App;