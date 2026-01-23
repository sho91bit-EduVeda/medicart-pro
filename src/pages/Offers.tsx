import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/firebase/config";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Percent, Calendar, Clock, Tag, Menu } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import NotificationBell from "@/components/common/NotificationBell";
import { MobileMenu } from "@/components/layout/MobileMenu";
import logoImage from "@/assets/Logo.png";
import AppFooter from "@/components/layout/AppFooter";

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
  validity: string;
  category: string;
  terms: string;
  enabled: boolean;
  created_at: string;
}

const Offers = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState("current");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "offers"),
        where("enabled", "==", true),
        orderBy("created_at", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const offersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as Offer[];
      
      setOffers(offersData);
    } catch (error) {
      console.error("Failed to fetch offers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter offers based on their validity date
  const currentDate = new Date().toISOString().split('T')[0];
  
  const currentOffers = offers.filter(offer => {
    return offer.validity >= currentDate;
  });
  
  const expiredOffers = offers.filter(offer => {
    return offer.validity < currentDate;
  });

  const renderOfferCard = (offer: Offer) => (
    <Card key={offer.id} className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 relative border-b border-blue-200/30">
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="text-lg py-1 px-3">
            {offer.discount} OFF
          </Badge>
        </div>
        <CardTitle className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary" />
          {offer.title}
        </CardTitle>
        <CardDescription>{offer.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>Valid till: {offer.validity}</span>
          </div>
          {offer.category && (
            <div className="flex items-center gap-2 text-sm">
              <Store className="w-4 h-4 text-muted-foreground" />
              <span>Category: {offer.category}</span>
            </div>
          )}
          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Terms:</span> {offer.terms}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading offers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with animation */}
      <motion.header 
        className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-600 text-white shadow-xl"
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

      {/* Main Content with animations */}
      <motion.div 
        className="container mx-auto px-4 py-12"
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
        <motion.div 
          className="text-center mb-12"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.5 }}
        >
          <motion.h1 
            className="text-4xl font-bold mb-4"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            Special Offers
          </motion.h1>
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ delay: 0.1 }}
          >
            Take advantage of our exclusive deals and discounts on quality medicines and healthcare products
          </motion.p>
        </motion.div>

        {/* Offer Tabs with animation */}
        <motion.div 
          className="flex justify-center mb-8"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ delay: 0.2 }}
        >
          <div className="inline-flex p-1 bg-muted rounded-lg">
            <motion.button
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === "current" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent hover:text-accent-foreground"}`}
              onClick={() => setActiveTab("current")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              Current Offers
            </motion.button>
            <motion.button
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === "expired" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent hover:text-accent-foreground"}`}
              onClick={() => setActiveTab("expired")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              Expired
            </motion.button>
          </div>
        </motion.div>

        {/* Offers Content with animation */}
        <motion.div 
          className="max-w-4xl mx-auto"
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ delay: 0.3 }}
        >
          {activeTab === "current" && (
            <div className="space-y-6">
              {currentOffers.length > 0 ? (
                currentOffers.map((offer, index) => (
                  <motion.div
                    key={offer.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    {renderOfferCard(offer)}
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  className="text-center py-12"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  transition={{ delay: 0.4 }}
                >
                  <Percent className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Current Offers</h3>
                  <p className="text-muted-foreground">
                    Check back later for exciting deals and discounts!
                  </p>
                </motion.div>
              )}
            </div>
          )}

          {activeTab === "expired" && (
            <div className="space-y-6">
              {expiredOffers.length > 0 ? (
                expiredOffers.map((offer, index) => (
                  <motion.div
                    key={offer.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    {renderOfferCard(offer)}
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  className="text-center py-12"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  transition={{ delay: 0.4 }}
                >
                  <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Expired Offers</h3>
                  <p className="text-muted-foreground">
                    No offers have expired yet. Check current offers to take advantage of our deals!
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>

        {/* How to Redeem with animation */}
        <motion.div 
          className="max-w-4xl mx-auto mt-16"
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                How to Redeem Offers
              </CardTitle>
              <CardDescription>
                Simple steps to avail our special discounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div 
                  className="text-center"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Shop Products</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse and add discounted products to your cart
                  </p>
                </motion.div>
                <motion.div 
                  className="text-center"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Apply Discount</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter promo code at checkout or mention offer to pharmacist
                  </p>
                </motion.div>
                <motion.div 
                  className="text-center"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Save Money</h3>
                  <p className="text-sm text-muted-foreground">
                    Enjoy instant savings on your purchase
                  </p>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    <AppFooter />
  </div>
  );
};

export default Offers;