import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ShoppingBag, User, CreditCard, Shield, Phone, Store, Menu } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import NotificationBell from "@/components/common/NotificationBell";
import { MobileMenu } from "@/components/layout/MobileMenu";
import logoImage from "@/assets/Logo.png";
import AppFooter from "@/components/layout/AppFooter";

const TermsOfService = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

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
              className="rounded-full px-4 py-2 text-primary-foreground hover:bg-white/20 transition-colors font-medium flex items-center gap-2 md:flex"
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
        className="container mx-auto px-4 py-12 max-w-4xl"
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
            Terms of Service
          </motion.h1>
          <motion.p 
            className="text-muted-foreground"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ delay: 0.1 }}
          >
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </motion.p>
        </motion.div>

        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Agreement to Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <motion.p 
                className="text-muted-foreground mb-6"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                transition={{ delay: 0.3 }}
              >
                These Terms of Service ("Terms") govern your access to and use of the services, 
                websites, and applications offered by Kalyanam Pharmaceuticals ("we", "our", or "us"). 
                By accessing or using our services, you agree to be bound by these Terms.
              </motion.p>

            <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Eligibility
            </h2>
            <p className="text-muted-foreground mb-4">
              You must be at least 18 years old to use our services. By agreeing to these Terms, 
              you represent and warrant that you are of legal age to form a binding contract.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Ordering and Payment
            </h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">Order Acceptance</h3>
            <p className="text-muted-foreground mb-4">
              All orders are subject to acceptance by us. We reserve the right to refuse or cancel 
              any order for any reason, including but not limited to product availability, 
              pricing errors, or suspected fraudulent activity.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Pricing</h3>
            <p className="text-muted-foreground mb-4">
              All prices are listed in Indian Rupees (INR) and are subject to change without notice. 
              Prices do not include applicable taxes, which will be added at checkout.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Payment Methods</h3>
            <p className="text-muted-foreground mb-4">
              We accept various payment methods including cash, credit/debit cards, and digital wallets. 
              All payments must be completed before order fulfillment.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Prescription Requirements
            </h2>
            <p className="text-muted-foreground mb-4">
              Certain medications require a valid prescription from a licensed healthcare provider. 
              We reserve the right to verify prescriptions and may contact you for additional information. 
              We will not dispense prescription medications without a valid prescription.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Product Information</h2>
            <p className="text-muted-foreground mb-4">
              While we strive to provide accurate product information, we do not warrant that 
              product descriptions or other content on our platform is accurate, complete, 
              reliable, current, or error-free. If a product offered by us is not as described, 
              your sole remedy is to return it in accordance with our return policy.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Limitation of Liability</h2>
            <p className="text-muted-foreground mb-4">
              To the fullest extent permitted by law, Kalyanam Pharmaceuticals shall not be liable 
              for any indirect, incidental, special, consequential or punitive damages, including 
              without limitation, loss of profits, data, use, goodwill, or other intangible losses, 
              resulting from your access to or use of or inability to access or use the services.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Disclaimer
            </h2>
            <p className="text-muted-foreground mb-4">
              The information provided by Kalyanam Pharmaceuticals is for general informational purposes only 
              and is not intended to substitute for professional medical advice, diagnosis, or treatment. 
              Always seek the advice of your physician or other qualified health provider with any questions 
              you may have regarding a medical condition.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Governing Law</h2>
            <p className="text-muted-foreground mb-4">
              These Terms shall be governed and construed in accordance with the laws of India, 
              without regard to its conflict of law provisions.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Changes to Terms</h2>
            <p className="text-muted-foreground mb-4">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
              If a revision is material, we will provide at least 30 days' notice prior to any new terms 
              taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contact Us
            </h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="bg-muted/30 p-6 rounded-lg">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <span>079053 82771</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1">📍</span>
                  <span>Mansarovar Yojna, 2/50, Kanpur Rd, Sector O, Mansarovar, Transport Nagar, Lucknow, Uttar Pradesh 226012</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
    <AppFooter />
  </div>
  );
};

export default TermsOfService;