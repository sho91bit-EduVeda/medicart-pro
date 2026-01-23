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
  Star,
  Search
} from "lucide-react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import StoreReviewForm from "@/components/user/StoreReviewForm";
import { motion, useScroll, useTransform, useInView, useAnimation, Variants } from "framer-motion";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth hook
import LottieAnimation from "../common/LottieAnimation";
import heroAnim from "@/assets/animations/hero-pharmacy.json";
import trustSupportAnim from "@/assets/animations/trust-support.json";
import trustProductsAnim from "@/assets/animations/trust-products.json";
import trustSatisfiedAnim from "@/assets/animations/trust-satisfied.json";

// Type assertion for animation data
const typedHeroAnim = heroAnim as Record<string, unknown>;
const typedTrustSupportAnim = trustSupportAnim as Record<string, unknown>;
const typedTrustProductsAnim = trustProductsAnim as Record<string, unknown>;
const typedTrustSatisfiedAnim = trustSatisfiedAnim as Record<string, unknown>;

export const HeroBanner = ({ discountPercentage }: { discountPercentage: number }) => {
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const { deliveryEnabled, storeClosed } = useFeatureFlags(); // Use the new feature flags
  const { isAuthenticated, userName, isAdmin } = useAuth(); // Get authentication state and user name

  // Animation refs and controls
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-20% 0px" });
  const controls = useAnimation();

  // Function to check if store is currently open (based on time)
  const isStoreOpenByTime = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    // Store hours: 8 AM (8) to 10:30 PM (22:30)
    if (currentHour < 8) return false;
    if (currentHour > 22) return false;
    if (currentHour === 22 && currentMinute > 30) return false;
    return true;
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
      description: "All our products are sourced directly from manufacturers",
      details: "We verify every supplier and maintain strict quality control standards to ensure you receive only genuine medications."
    },
    {
      icon: Clock,
      title: "Store Hours: 8 AM - 10:30 PM",
      description: "Visit our pharmacy during business hours for immediate assistance",
      details: "Our physical store is open daily from 8 AM to 10:30 PM. Speak with our pharmacists for personalized advice and immediate assistance.",
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
      className="relative overflow-hidden rounded-2xl mx-4 mt-6 shadow-xl bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 border border-blue-200/30"
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
      <div className="container mx-auto px-4 py-3">
        {/* MOBILE-FIRST PHARMACY ANIMATION-ONLY DESIGN */}
        <div className="md:hidden space-y-3">
          {/* PHARMACY ANIMATED IMAGE - TOP */}
          <motion.div
            className="relative w-full rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-green-50 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-full h-48">
              <LottieAnimation 
                animationData={typedHeroAnim}
                className="w-full h-full object-contain p-4"
              />
            </div>
            <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full">
              <span className="text-xs font-medium text-blue-600">Genuine Care</span>
            </div>
          </motion.div>

          {/* CONDITIONAL WELCOME MESSAGE */}
          {isAuthenticated && userName && (
            <div className="space-y-1 text-left pl-1">
              <h2 className="font-semibold text-lg text-blue-600">
                Welcome, {userName}
              </h2>
            </div>
          )}

          {/* HEADLINE + TAGLINE */}
          <div className="space-y-2 text-left pl-1">
            <h1 className="font-semibold text-lg text-blue-600">
              Your trusted neighborhood pharmacy
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Quality medicines and healthcare products with complete privacy and professional care.
            </p>
          </div>

          {/* OFFER BADGE */}
          <div className="flex justify-center">
            <span className="bg-red-100 text-red-700 text-xs font-medium px-3 py-1.5 rounded-full">
              Upto 5% OFF
            </span>
          </div>

          {/* TRUST ICONS ROW WITH TEXT LABELS - MOBILE ONLY */}
          <div className="flex justify-center gap-8 mt-2 mb-3">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 mb-1">
                <LottieAnimation 
                  animationData={typedTrustSupportAnim}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs text-center text-muted-foreground font-medium">Support</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 mb-1">
                <LottieAnimation 
                  animationData={typedTrustProductsAnim}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs text-center text-muted-foreground font-medium">Products</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 mb-1">
                <LottieAnimation 
                  animationData={typedTrustSatisfiedAnim}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs text-center text-muted-foreground font-medium">Satisfied</span>
            </div>
          </div>

          {/* TRUST LINE */}
          <div className="flex justify-center">
            <div className="flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded-full">
              <Heart className="w-3.5 h-3.5 text-red-500" />
              <span className="font-medium text-xs text-red-700">Trusted by 10,000+ Families</span>
            </div>
          </div>

          {/* STORE INFO */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Genuine Medicines</span>
              </div>
              <span>•</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-green-600" />
                <span className="font-medium text-green-600">Store is OPEN</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>8 AM - 10:30 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP LAYOUT - Original design preserved */}
        <div className="hidden md:grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="space-y-4">
              <Badge variant="secondary" className="rounded-full px-4 py-1 text-sm font-medium bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-200 text-blue-700 w-fit">
                <Heart className="w-4 h-4 mr-2 text-blue-600" />
                Trusted by 10,000+ Families
              </Badge>

              <motion.h1
                className="text-3xl md:text-4xl font-bold leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {isAuthenticated && userName ? (
                  <div className="text-center lg:text-left">
                    <span className="block text-lg text-muted-foreground mb-1">Welcome,</span>
                    <span className="text-blue-600">{userName}</span>
                  </div>
                ) : (
                  <>
                    Your <span className="text-blue-600">Trusted</span> Healthcare Partner
                  </>
                )}
              </motion.h1>

              <motion.p
                className="text-base md:text-lg text-muted-foreground max-w-2xl text-center lg:text-left"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                Quality medicines and healthcare products with complete privacy and professional care.
              </motion.p>
            </div>

            <motion.div
              className="flex flex-wrap items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {discountPercentage > 0 && (
                <div className="inline-flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-sm text-blue-700 px-6 py-3 rounded-full font-bold text-lg border border-blue-200">
                  <span className="animate-pulse">🔥</span>
                  <span className="ml-2">Upto {discountPercentage}% OFF!</span>
                </div>
              )}

              {/* Leave a Store Review Button - Hidden when owner is logged in */}
              {!isAuthenticated && (
                <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                  <DialogTrigger asChild>
                    <motion.button
                      className="rounded-full px-6 py-3 flex items-center gap-2 bg-background hover:bg-accent transition-colors border-primary/30 shadow-sm"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      Leave a Store Review
                    </motion.button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                    {/* Gradient Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                      <DialogHeader className="relative z-10">
                        <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
                          <span className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <Star className="w-5 h-5" />
                          </span>
                          Write a Store Review
                        </DialogTitle>
                      </DialogHeader>
                    </div>
                    <div className="overflow-y-auto bg-slate-50 relative max-h-[calc(90vh-100px)]">
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                        opacity: 0.3
                      }}></div>
                      <div className="relative z-10">
                        <StoreReviewForm
                          onClose={() => setShowReviewDialog(false)}
                          onSubmit={() => {
                            // Refresh reviews if needed
                          }}
                        />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </motion.div>

            {/* Stats Grid - Moved to Left for Balance */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1 }
              }}
            >
              <motion.div
                className="bg-background/60 backdrop-blur-sm border rounded-xl p-3 text-center flex flex-col items-center justify-center min-h-[120px]"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <div className="flex-1 flex items-center justify-center">
                  <LottieAnimation animationData={typedTrustSupportAnim} width={90} height={90} className="mx-auto" />
                </div>
                <div className="text-xs text-muted-foreground font-medium mt-1">Support</div>
              </motion.div>
              <motion.div
                className="bg-background/60 backdrop-blur-sm border rounded-xl p-3 text-center flex flex-col items-center justify-center min-h-[120px]"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <LottieAnimation animationData={typedTrustProductsAnim} width={80} height={80} className="mx-auto mb-1" />
                <div className="text-xl font-bold text-primary">5000+</div>
                <div className="text-xs text-muted-foreground font-medium">Products</div>
              </motion.div>
              <motion.div
                className="bg-background/60 backdrop-blur-sm border rounded-xl p-3 text-center flex flex-col items-center justify-center min-h-[120px]"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <LottieAnimation animationData={typedTrustSatisfiedAnim} width={80} height={80} className="mx-auto mb-1" />
                <div className="text-xl font-bold text-primary">99%</div>
                <div className="text-xs text-muted-foreground font-medium">Satisfied</div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Content - Animation & Features */}
          <motion.div
            className="space-y-6 flex flex-col justify-center mt-8 lg:-mt-24"
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
            {/* Hero Animation - Desktop Only */}
            <motion.div
              className="w-full max-w-[550px] mx-auto hidden md:block mb-6"
              variants={{
                hidden: { opacity: 0, scale: 0.9 },
                visible: { opacity: 1, scale: 1 }
              }}
            >
              <LottieAnimation animationData={typedHeroAnim} className="w-full h-auto" />
            </motion.div>

            {/* Feature Cards */}
            <div className="space-y-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    className="bg-background/80 backdrop-blur-sm rounded-xl p-4 border border-primary/10 hover:border-primary/30 transition-all duration-300 cursor-pointer shadow-sm"
                    onClick={() => toggleFeature(index)}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 shrink-0">
                        <Icon className="w-6 h-6 text-blue-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-base md:text-lg">{feature.title}</h3>
                            {index === 1 && (
                              <Badge
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider ${isStoreActuallyOpen()
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : "bg-red-100 text-red-700 border-red-200"
                                  }`}
                                variant="outline"
                              >
                                {isStoreActuallyOpen() ? "OPEN" : "CLOSED"}
                              </Badge>
                            )}
                          </div>
                          {expandedFeature === index ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">{feature.description}</p>
                        {expandedFeature === index && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="text-sm text-muted-foreground mt-3 pt-3 border-t border-primary/10"
                          >
                            {feature.details}
                          </motion.p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>


          </motion.div>
        </div>
      </div>

      {/* Decorative Elements with parallax effect */}
      <motion.div
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blue-200/30 blur-3xl"
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
        className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-indigo-200/30 blur-3xl"
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