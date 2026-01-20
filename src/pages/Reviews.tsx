import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StoreReviews from "@/components/user/StoreReviews";
import StoreReviewForm from "@/components/user/StoreReviewForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

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
            <div className="flex items-center gap-3">
              <motion.button 
                className="rounded-full border border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 w-10 text-primary-foreground hover:bg-white/20"
                onClick={() => navigate(-1)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div>
                <motion.h1 
                  className="text-2xl font-bold"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Store Reviews
                </motion.h1>
                <motion.p 
                  className="text-sm text-primary-foreground/90"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Share your experience with us
                </motion.p>
              </div>
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
    </div>
  );
};

export default Reviews;