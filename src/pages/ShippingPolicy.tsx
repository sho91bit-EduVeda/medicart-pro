import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Clock, MapPin, Phone, Store } from "lucide-react";

const ShippingPolicy = () => {
  const navigate = useNavigate();

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
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Kalyanam Pharmaceuticals</h1>
                <p className="text-sm text-primary-foreground/90">Shipping Policy</p>
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
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Shipping Policy</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Delivery Services
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p className="text-muted-foreground mb-6">
              At Kalyanam Pharmaceuticals, we're committed to getting your medications and healthcare products 
              to you quickly and safely. Please read our shipping policy carefully to understand our delivery practices.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Delivery Area</h2>
            <p className="text-muted-foreground mb-4">
              We currently provide delivery services within Lucknow city limits. For customers outside 
              our delivery area, we offer in-store pickup options.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Delivery Timeframes
            </h2>
            <div className="bg-muted/30 p-6 rounded-lg mb-6">
              <h3 className="font-semibold text-lg mb-3">Standard Delivery</h3>
              <ul className="list-disc pl-8 text-muted-foreground mb-4 space-y-2">
                <li>Same-day delivery for orders placed before 6:00 PM</li>
                <li>Next-day delivery for orders placed after 6:00 PM</li>
                <li>Delivery hours: 9:00 AM - 9:00 PM daily</li>
              </ul>
              
              <h3 className="font-semibold text-lg mt-6 mb-3">Express Delivery</h3>
              <ul className="list-disc pl-8 text-muted-foreground space-y-2">
                <li>Within 2 hours for urgent medications (additional charges apply)</li>
                <li>Available for orders placed between 10:00 AM - 8:00 PM</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">Delivery Charges</h2>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 font-semibold">Order Value</th>
                    <th className="py-3 px-4 font-semibold">Delivery Charge</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4">Below ₹300</td>
                    <td className="py-3 px-4">₹50</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">₹300 and above</td>
                    <td className="py-3 px-4">Free</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Express Delivery</td>
                    <td className="py-3 px-4">₹100 (flat rate)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">Order Processing</h2>
            <p className="text-muted-foreground mb-4">
              Orders are processed during our regular business hours (8:00 AM - 11:00 PM). 
              Prescription verification may add additional time to order processing.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
              <Store className="w-5 h-5" />
              In-Store Pickup
            </h2>
            <p className="text-muted-foreground mb-4">
              Customers can choose to pick up their orders at our store location. 
              You will receive a notification when your order is ready for pickup. 
              Please bring a valid ID and your order confirmation.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Delivery Restrictions</h2>
            <ul className="list-disc pl-8 text-muted-foreground mb-4 space-y-2">
              <li>Controlled substances require in-person pickup with valid prescription</li>
              <li>Some temperature-sensitive medications may only be available for pickup</li>
              <li>Delivery to certain areas may be restricted based on safety considerations</li>
              <li>We do not deliver to P.O. Box addresses</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">Undeliverable Packages</h2>
            <p className="text-muted-foreground mb-4">
              If we are unable to deliver your package after three attempts, the order will be 
              returned to our store and you will be notified to arrange pickup. 
              Additional delivery fees may apply for redelivery attempts.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Tracking Your Order</h2>
            <p className="text-muted-foreground mb-4">
              You will receive SMS and email notifications regarding your order status, 
              including when your order is being prepared and when it's out for delivery. 
              You can also track your order status through your account dashboard.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contact Information
            </h2>
            <p className="text-muted-foreground mb-4">
              For delivery-related inquiries, please contact our delivery team:
            </p>
            <div className="bg-muted/30 p-6 rounded-lg">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <span>Delivery Hotline: 079053 82771</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center">📧</span>
                  <span>delivery@kalyanampharmacy.com</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-1" />
                  <span>Store Address: Mansarovar Yojna, 2/50, Kanpur Rd, Sector O, Mansarovar, Transport Nagar, Lucknow, Uttar Pradesh 226012</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShippingPolicy;