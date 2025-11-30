import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  Clock, 
  Truck, 
  Heart, 
  Pill, 
  Stethoscope,
  ChevronDown,
  ChevronUp,
  Store,
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

export const HeroBanner = ({ discountPercentage }: { discountPercentage: number }) => {
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const { deliveryEnabled } = useFeatureFlags(); // Use the new feature flag

  const features = [
    {
      icon: ShieldCheck,
      title: "100% Genuine Medicines",
      description: "All our products are sourced directly from manufacturers with authenticity guarantee",
      details: "We verify every supplier and maintain strict quality control standards to ensure you receive only genuine medications."
    },
    ...(deliveryEnabled ? [{
      icon: Clock,
      title: "Express Delivery",
      description: "Get your medicines within 2 hours in emergency cases",
      details: "Our priority delivery service ensures critical medications reach you when you need them most. Available 24/7 for urgent requirements."
    }] : []),
    ...(deliveryEnabled ? [{
      icon: Truck,
      title: "Free Delivery Above ₹499",
      description: "Nationwide delivery with no hidden charges",
      details: "Enjoy free doorstep delivery on all orders above ₹499. For orders below this amount, a nominal delivery fee of ₹49 applies."
    }] : [])
  ];

  // Add a static feature when delivery is disabled
  if (!deliveryEnabled) {
    features.push({
      icon: Store,
      title: "In-Store Pickup Available",
      description: "Visit our pharmacy for immediate pickup of your medications",
      details: "Our physical store is open daily from 9 AM to 9 PM. Speak with our pharmacists for personalized advice and immediate assistance."
    });
  }

  const toggleFeature = (index: number) => {
    setExpandedFeature(expandedFeature === index ? null : index);
  };

  return (
    <section className="relative overflow-hidden rounded-2xl mx-4 mt-6 shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5 border">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <Badge variant="secondary" className="rounded-full px-4 py-1 text-sm font-medium bg-gradient-to-r from-primary/20 to-secondary/20">
              <Heart className="w-4 h-4 mr-2 text-primary" />
              Trusted by 10,000+ Families
            </Badge>
            
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Your <span className="text-primary">Trusted</span> Healthcare Partner
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl">
              Quality medicines and healthcare products delivered to your doorstep with complete privacy and professional care.
            </p>
            
            {/* Show Explore Medicines and Upload Prescription buttons only when delivery is enabled */}
            {deliveryEnabled && (
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90 font-semibold px-8 py-6 text-lg shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  <Pill className="w-5 h-5 mr-2" />
                  Explore Medicines
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="rounded-full font-semibold px-8 py-6 text-lg border-2 hover:bg-primary/5"
                >
                  <Stethoscope className="w-5 h-5 mr-2" />
                  Upload Prescription
                </Button>
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-4 pt-4">
              {discountPercentage > 0 && (
                <div className="inline-flex items-center bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm text-primary px-6 py-3 rounded-full font-bold text-lg border border-primary/20">
                  <span className="animate-pulse">🔥</span>
                  <span className="ml-2">Upto {discountPercentage}% OFF on all products!</span>
                </div>
              )}
              
              {/* Leave a Store Review Button */}
              <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="rounded-full px-6 py-3 flex items-center gap-2 bg-background hover:bg-accent transition-colors border-primary/30"
                  >
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    Leave a Store Review
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  </Button>
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
            </div>
          </div>
          
          {/* Right Content - Features */}
          <div className="space-y-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index} 
                  className="bg-background/50 backdrop-blur-sm rounded-2xl p-5 border border-primary/10 hover:border-primary/30 transition-all duration-300 cursor-pointer"
                  onClick={() => toggleFeature(index)}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg">{feature.title}</h3>
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
                </div>
              );
            })}
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Support</div>
              </div>
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-primary">5000+</div>
                <div className="text-sm text-muted-foreground">Products</div>
              </div>
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-primary">99%</div>
                <div className="text-sm text-muted-foreground">Satisfied</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-secondary/10 blur-3xl"></div>
    </section>
  );
};