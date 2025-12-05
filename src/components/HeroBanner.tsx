import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  Clock, 
  Store,
  Heart, 
  Pill, 
  Stethoscope,
  ChevronDown,
  ChevronUp,
  Star
} from "lucide-react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import StoreReviewForm from "@/components/StoreReviewForm";
import { motion, useScroll, useTransform, useInView, useAnimation } from "framer-motion";

export const HeroBanner = ({ discountPercentage }: { discountPercentage: number }) => {
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const { deliveryEnabled, storeClosed } = useFeatureFlags(); // Use the new feature flags
  
  // Animation refs and controls
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-20% 0px" });
  const controls = useAnimation();

  // Function to check if store is currently open (based on time)
  const isStoreOpenByTime = () => {
    const now = new Date();
    const currentHour = now.getHours();
    // Store hours: 8 AM (8) to 11 PM (23)
    return currentHour >= 8 && currentHour < 23;
  };

  // Function to check if store is actually open (considering manual closure)
  const isStoreActuallyOpen = () => {
    // If manually closed by owner, return false regardless of time
    if (storeClosed) return false;
    // Otherwise check based on time
    return isStoreOpenByTime();
  };

  const features = [
    {
      icon: ShieldCheck,
      title: "100% Genuine Medicines",
      description: "All our products are sourced directly from manufacturers with authenticity guarantee",
      details: "We verify every supplier and maintain strict quality control standards to ensure you receive only genuine medications."
    },
    {
      icon: Clock,
      title: "Store Hours: 8 AM - 11 PM",
      description: "Visit our pharmacy during business hours for immediate assistance",
      details: "Our physical store is open daily from 8 AM to 11 PM. Speak with our pharmacists for personalized advice and immediate assistance.",
      // Add status badge to this feature
      status: isStoreActuallyOpen() ? "OPEN" : "CLOSED"
    }
  ];

  const toggleFeature = (index: number) => {
    setExpandedFeature(expandedFeature === index ? null : index);
  };

  return (
    <motion.section 
      ref={ref}
      className="relative overflow-hidden rounded-2xl mx-4 mt-6 shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5 border"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { 
            duration: 0.6,
            ease: "easeOut"
          }
        }
      }}
    >
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Badge variant="secondary" className="rounded-full px-4 py-1 text-sm font-medium bg-gradient-to-r from-primary/20 to-secondary/20">
              <Heart className="w-4 h-4 mr-2 text-primary" />
              Trusted by 10,000+ Families
            </Badge>
            
            <motion.h1 
              className="text-4xl md:text-5xl font-bold leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Your <span className="text-primary">Trusted</span> Healthcare Partner
            </motion.h1>
            
            <motion.p 
              className="text-lg text-muted-foreground max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Quality medicines and healthcare products available at our physical store with complete privacy and professional care.
            </motion.p>
            
            <motion.div 
              className="flex flex-wrap items-center gap-4 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {discountPercentage > 0 && (
                <div className="inline-flex items-center bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm text-primary px-6 py-3 rounded-full font-bold text-lg border border-primary/20">
                  <span className="animate-pulse">🔥</span>
                  <span className="ml-2">Upto {discountPercentage}% OFF on all products!</span>
                </div>
              )}
              
              {/* Leave a Store Review Button */}
              <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                <DialogTrigger asChild>
                  <motion.button 
                    className="rounded-full px-6 py-3 flex items-center gap-2 bg-background hover:bg-accent transition-colors border-primary/30"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    Leave a Store Review
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  </motion.button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Store Review</DialogTitle>
                  </DialogHeader>
                  <StoreReviewForm 
                    onClose={() => setShowReviewDialog(false)} 
                    onSubmit={() => {
                      // Refresh reviews if needed
                    }} 
                  />
                </DialogContent>
              </Dialog>
            </motion.div>
          </motion.div>
          
          {/* Right Content - Features with staggered animation */}
          <motion.div 
            className="space-y-4"
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
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div 
                  key={index} 
                  className="bg-background/50 backdrop-blur-sm rounded-2xl p-5 border border-primary/10 hover:border-primary/30 transition-all duration-300 cursor-pointer"
                  onClick={() => toggleFeature(index)}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{feature.title}</h3>
                          {/* Show OPEN/CLOSED badge for store hours */}
                          {index === 1 && (
                            <Badge 
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                isStoreActuallyOpen() 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {isStoreActuallyOpen() ? "OPEN" : "CLOSED"}
                            </Badge>
                          )}
                        </div>
                        {expandedFeature === index ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-muted-foreground mt-2">{feature.description}</p>
                      {expandedFeature === index && (
                        <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-primary/10">
                          {feature.details}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            
            {/* Stats with staggered animation */}
            <motion.div 
              className="grid grid-cols-3 gap-4 pt-4"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1 }
              }}
            >
              <motion.div 
                className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-4 text-center"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Support</div>
              </motion.div>
              <motion.div 
                className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-4 text-center"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <div className="text-2xl font-bold text-primary">5000+</div>
                <div className="text-sm text-muted-foreground">Products</div>
              </motion.div>
              <motion.div 
                className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-4 text-center"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <div className="text-2xl font-bold text-primary">99%</div>
                <div className="text-sm text-muted-foreground">Satisfied</div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      {/* Decorative Elements with parallax effect */}
      <motion.div 
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
        initial={{ y: 0 }}
        animate={{ y: -20 }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      ></motion.div>
      <motion.div 
        className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-secondary/10 blur-3xl"
        initial={{ y: 0 }}
        animate={{ y: 20 }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: 0.5
        }}
      ></motion.div>
    </motion.section>
  );
};