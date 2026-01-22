import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, User, FileText, Mail, Phone, Store, Menu } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import NotificationBell from "@/components/common/NotificationBell";
import { MobileMenu } from "@/components/layout/MobileMenu";
import logoImage from "@/assets/Logo.png";
import AppFooter from "@/components/layout/AppFooter";

const PrivacyPolicy = () => {
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
            Privacy Policy
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
                <Shield className="w-5 h-5" />
                Your Privacy Matters
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
                Kalyanam Pharmaceuticals ("we", "our", or "us") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you visit our website, use our mobile application, or otherwise interact with us.
              </motion.p>

            <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Information We Collect
            </h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">Personal Information</h3>
            <p className="text-muted-foreground mb-4">
              We may collect personally identifiable information that you voluntarily provide to us when 
              you register on our site, place an order, subscribe to our newsletter, respond to a survey, 
              fill out a form, or otherwise contact us. This information may include:
            </p>
            <ul className="list-disc pl-8 text-muted-foreground mb-4 space-y-2">
              <li>Name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Mailing address</li>
              <li>Prescription information</li>
              <li>Payment information</li>
              <li>Medical history (when relevant for pharmacy services)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Usage Data</h3>
            <p className="text-muted-foreground mb-4">
              We may also collect information about how you access and use our services, including:
            </p>
            <ul className="list-disc pl-8 text-muted-foreground mb-4 space-y-2">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Pages visited</li>
              <li>Time and date of visit</li>
              <li>Time spent on pages</li>
              <li>Device information</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              How We Use Your Information
            </h2>
            <p className="text-muted-foreground mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-8 text-muted-foreground mb-4 space-y-2">
              <li>Process and fulfill your orders</li>
              <li>Provide customer support</li>
              <li>Improve our services</li>
              <li>Send you updates and promotional materials</li>
              <li>Comply with legal obligations</li>
              <li>Protect against fraud and unauthorized transactions</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Information Sharing and Disclosure
            </h2>
            <p className="text-muted-foreground mb-4">
              We do not sell, trade, or otherwise transfer your personally identifiable information 
              to outside parties without your consent, except as described below:
            </p>
            <ul className="list-disc pl-8 text-muted-foreground mb-4 space-y-2">
              <li>To healthcare providers when necessary for your treatment</li>
              <li>To comply with legal requirements</li>
              <li>To protect our rights and property</li>
              <li>To trusted third parties who assist us in operating our business</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">Data Security</h2>
            <p className="text-muted-foreground mb-4">
              We implement a variety of security measures to maintain the safety of your personal information. 
              However, no method of transmission over the Internet or electronic storage is 100% secure, 
              and we cannot guarantee absolute security.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">Your Rights</h2>
            <p className="text-muted-foreground mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-8 text-muted-foreground mb-4 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccuracies in your personal information</li>
              <li>Request deletion of your personal information</li>
              <li>Object to or restrict the processing of your personal information</li>
              <li>Withdraw your consent at any time</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes 
              by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact Us
            </h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <div className="bg-muted/30 p-6 rounded-lg">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span>info@kalyanampharmacy.com</span>
                </div>
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

export default PrivacyPolicy;