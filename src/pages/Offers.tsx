import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/firebase/config";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Percent, Calendar, Clock, Tag } from "lucide-react";

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
      <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 relative">
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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer" 
              onClick={() => navigate("/")}
            >
              <div className="p-2 bg-white/10 rounded-lg">
                <Percent className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Kalyanam Pharmaceuticals</h1>
                <p className="text-sm text-primary-foreground/90">Exclusive Offers & Discounts</p>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-full px-4 py-2 text-primary-foreground hover:bg-white/20 transition-colors font-medium"
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Special Offers</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Take advantage of our exclusive deals and discounts on quality medicines and healthcare products
          </p>
        </div>

        {/* Offer Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 bg-muted rounded-lg">
            <Button
              variant={activeTab === "current" ? "default" : "ghost"}
              className="rounded-md"
              onClick={() => setActiveTab("current")}
            >
              Current Offers
            </Button>
            <Button
              variant={activeTab === "expired" ? "default" : "ghost"}
              className="rounded-md"
              onClick={() => setActiveTab("expired")}
            >
              Expired
            </Button>
          </div>
        </div>

        {/* Offers Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === "current" && (
            <div className="space-y-6">
              {currentOffers.length > 0 ? (
                currentOffers.map(renderOfferCard)
              ) : (
                <div className="text-center py-12">
                  <Percent className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Current Offers</h3>
                  <p className="text-muted-foreground">
                    Check back later for exciting deals and discounts!
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "expired" && (
            <div className="space-y-6">
              {expiredOffers.length > 0 ? (
                expiredOffers.map(renderOfferCard)
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Expired Offers</h3>
                  <p className="text-muted-foreground">
                    No offers have expired yet. Check current offers to take advantage of our deals!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* How to Redeem */}
        <Card className="max-w-4xl mx-auto mt-16">
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
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Shop Products</h3>
                <p className="text-sm text-muted-foreground">
                  Browse and add discounted products to your cart
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Apply Discount</h3>
                <p className="text-sm text-muted-foreground">
                  Enter promo code at checkout or mention offer to pharmacist
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Save Money</h3>
                <p className="text-sm text-muted-foreground">
                  Enjoy instant savings on your purchase
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Offers;