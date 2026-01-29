import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useOrder } from "@/hooks/useOrder";
import { whatsappService } from "@/services/whatsappService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PrescriptionUpload } from "@/components/common/PrescriptionUpload";
import { toast } from "sonner";
import { Store, ShoppingBag, CreditCard, MapPin, FileText, ArrowLeft } from "lucide-react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { motion, useReducedMotion } from "framer-motion";
import CommonHeader from "@/components/layout/CommonHeader";
import AppFooter from "@/components/layout/AppFooter";

const Checkout = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isAdmin } = useAuth();
  const { items, getTotal, clearCart } = useCart();
  const { createOrder, isLoading } = useOrder();
  const { deliveryEnabled } = useFeatureFlags();
  const prefersReducedMotion = useReducedMotion();

  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [prescriptionUrl, setPrescriptionUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    notes: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please sign in to checkout");
      navigate("/auth");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      navigate("/");
      return;
    }

    // Initialize WhatsApp service
    whatsappService.initialize();
  }, [isAuthenticated, items, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) newErrors.full_name = "Full name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }
    if (!formData.address_line1.trim()) newErrors.address_line1 = "Address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.postal_code.trim()) newErrors.postal_code = "Postal code is required";

    // Check if any prescription required products
    const requiresPrescription = items.some(item => item.product?.requires_prescription);
    if (requiresPrescription && !prescriptionUrl) {
      toast.error("Please upload a prescription for prescription medicines");
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const total = getTotal(discountPercentage);
    
    const orderItems = items.map(item => ({
      product_id: item.product_id,
      product_name: item.product?.name || "Unknown",
      quantity: item.quantity,
      unit_price: item.product?.original_price || 0,
      discount_percentage: discountPercentage,
      subtotal: (item.product?.original_price || 0) * item.quantity * (1 - discountPercentage / 100)
    }));

    const deliveryAddress = {
      full_name: formData.full_name,
      phone: formData.phone,
      address_line1: formData.address_line1,
      address_line2: formData.address_line2,
      city: formData.city,
      state: formData.state,
      postal_code: formData.postal_code,
      country: formData.country
    };

    const orderId = await createOrder(
      orderItems,
      deliveryAddress,
      total,
      discountPercentage,
      paymentMethod,
      formData.notes
    );

    if (orderId) {
      // Send WhatsApp notification
      const message = `🛒 New Order Placed!\n\n` +
        `Order ID: ${orderId}\n` +
        `Customer: ${formData.full_name}\n` +
        `Phone: ${formData.phone}\n` +
        `Total: ₹${total.toFixed(2)}\n` +
        `Items: ${items.length}\n` +
        `Payment: ${paymentMethod.toUpperCase()}\n\n` +
        `Delivery Address:\n${formData.address_line1}, ${formData.city}, ${formData.state} - ${formData.postal_code}`;

      await whatsappService.sendNotification(message);

      // Clear cart
      await clearCart();

      toast.success("Order placed successfully!");
      navigate("/");
    }
  };

  const subtotal = getTotal(0);
  const discount = subtotal * (discountPercentage / 100);
  const total = getTotal(discountPercentage);

  const requiresPrescription = items.some(item => item.product?.requires_prescription);

  return (
    <motion.div 
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <CommonHeader showBackButton={true} />

      <motion.div 
        className="container mx-auto px-2 sm:px-4 py-4 sm:py-8"
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
          className="grid lg:grid-cols-3 gap-4 sm:gap-8"
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ delay: 0.2 }}
        >
          {/* Left Column - Forms */}
          <motion.div 
            className="lg:col-span-2 space-y-6"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ delay: 0.3 }}
          >
            {/* Delivery Address - Only show when delivery is enabled */}
            {deliveryEnabled && (
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Delivery Address
                    </CardTitle>
                    <CardDescription>Enter your delivery details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name *</Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          className={errors.full_name ? "border-red-500" : ""}
                        />
                        {errors.full_name && <p className="text-xs text-red-500">{errors.full_name}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="1234567890"
                          className={errors.phone ? "border-red-500" : ""}
                        />
                        {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_line1">Address Line 1 *</Label>
                      <Input
                        id="address_line1"
                        name="address_line1"
                        value={formData.address_line1}
                        onChange={handleInputChange}
                        placeholder="House No, Street Name"
                        className={errors.address_line1 ? "border-red-500" : ""}
                      />
                      {errors.address_line1 && <p className="text-xs text-red-500">{errors.address_line1}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
                      <Input
                        id="address_line2"
                        name="address_line2"
                        value={formData.address_line2}
                        onChange={handleInputChange}
                        placeholder="Landmark, Area"
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className={errors.city ? "border-red-500" : ""}
                        />
                        {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className={errors.state ? "border-red-500" : ""}
                        />
                        {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="postal_code">Postal Code *</Label>
                        <Input
                          id="postal_code"
                          name="postal_code"
                          value={formData.postal_code}
                          onChange={handleInputChange}
                          placeholder="600001"
                          className={errors.postal_code ? "border-red-500" : ""}
                        />
                        {errors.postal_code && <p className="text-xs text-red-500">{errors.postal_code}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Prescription Upload */}
            {requiresPrescription && (
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                transition={{ delay: 0.5 }}
              >
                <PrescriptionUpload onUploadComplete={setPrescriptionUrl} />
              </motion.div>
            )}

            {/* Payment Method */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Method
                  </CardTitle>
                  <CardDescription>
                    {deliveryEnabled 
                      ? "Select your preferred payment method" 
                      : "Select your preferred payment method for in-store pickup"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        {deliveryEnabled ? "Cash on Delivery (COD)" : "Pay at Store"}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg opacity-50">
                      <RadioGroupItem value="online" id="online" disabled />
                      <Label htmlFor="online" className="flex-1">
                        Online Payment (Coming Soon)
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </motion.div>

            {/* Order Notes */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ delay: 0.7 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Order Notes (Optional)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder={deliveryEnabled 
                      ? "Any special instructions for your delivery?" 
                      : "Any special instructions for your in-store pickup?"}
                    rows={3}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Right Column - Order Summary */}
          <motion.div 
            className="lg:col-span-1"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ delay: 0.8 }}
          >
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <motion.div 
                      key={item.id} 
                      className="flex gap-3"
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: { opacity: 1, x: 0 }
                      }}
                      transition={{ delay: 0.9 }}
                    >
                      {item.product?.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <span>💊</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-2">{item.product?.name}</h4>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold">
                          ₹{((item.product?.original_price || 0) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discountPercentage > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({discountPercentage}%)</span>
                      <span>-₹{discount.toFixed(2)}</span>
                    </div>
                  )}
                  {/* Show delivery cost or in-store pickup message based on delivery toggle */}
                  {deliveryEnabled ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery</span>
                      <span className="text-green-600">FREE</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">In-Store Pickup</span>
                      <span className="text-green-600">FREE</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <motion.button
                  className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-4 py-2"
                  onClick={handlePlaceOrder}
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {isLoading ? "Placing Order..." : deliveryEnabled ? "Place Delivery Order" : "Place Pickup Order"}
                </motion.button>

                <p className="text-xs text-center text-muted-foreground">
                  By placing this order, you agree to our terms and conditions
                </p>
                
                {/* Show delivery info when enabled */}
                {deliveryEnabled && (
                  <motion.div 
                    className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                  >
                    <p className="text-sm text-blue-800 text-center">
                      🚚 Your order will be delivered within 2 hours
                    </p>
                  </motion.div>
                )}
                
                {/* Show pickup info when disabled */}
                {!deliveryEnabled && (
                  <motion.div 
                    className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                  >
                    <p className="text-sm text-yellow-800 text-center">
                      🏪 Please visit our store to pickup your order
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Checkout;