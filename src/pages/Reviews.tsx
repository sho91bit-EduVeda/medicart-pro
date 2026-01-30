import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StoreReviews from "@/components/user/StoreReviews";
import StoreReviewForm from "@/components/user/StoreReviewForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Store, Menu } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import NotificationBell from "@/components/common/NotificationBell";
import { MobileMenu } from "@/components/layout/MobileMenu";
import logoImage from "@/assets/Logo.png";
import CompleteFooter from "@/components/layout/CompleteFooter";

const Reviews = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with animation */}
      <motion.header 
        className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-600 text-white shadow-xl"
        initial={{ y: prefersReducedMotion ? 0 : -100 }}
        animate={{ y: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          mass: 1
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer" 
              onClick={() => navigate("/")}
            >
              <div className="p-2 bg-white rounded-lg backdrop-blur-sm border border-white/20 shadow-lg">
                <img src={logoImage} alt="Kalyanam Pharmaceuticals Logo" className="w-8 h-8 object-contain" />
              </div>
              <div>
                {/* Desktop view - Full business name */}
                <h1 className="hidden md:block text-2xl font-bold">Kalyanam Pharmaceuticals</h1>
                <p className="hidden md:block text-sm text-primary-foreground/90">Your Trusted Healthcare Partner</p>

                {/* Mobile view - Shortened business name */}
                <div className="md:hidden">
                  <h1 className="text-xl font-bold">Kalyanam</h1>
                  <p className="text-[0.6rem] text-primary-foreground/90 uppercase tracking-wider">Pharmaceuticals</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
            <motion.button 
              className="rounded-full px-4 py-2 text-primary-foreground hover:bg-white/20 transition-colors font-medium flex items-center gap-2 hidden md:flex"
              onClick={() => navigate("/")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Store className="w-4 h-4" />
              <span className="hidden md:block">View Store</span>
            </motion.button>
            <NotificationBell />
            <MobileMenu />
            </div>
          </div>
        </div>
      </motion.header>

      <motion.main 
        className="container mx-auto px-4 py-8"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Leave a Review</CardTitle>
                <CardDescription>
                  Share your experience with our store to help us improve
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StoreReviewForm 
                  onClose={() => {}} 
                  onSubmit={() => {}} 
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ delay: 0.4 }}
          >
            <StoreReviews />
          </motion.div>
        </div>
      </motion.main>
    <CompleteFooter />
  </div>
  );
};

export default Reviews;