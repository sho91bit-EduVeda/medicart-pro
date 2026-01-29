import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Award, Users, Clock, Package, Store, Home, Menu } from "lucide-react";
import NotificationBell from "@/components/common/NotificationBell";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { UserAccountDropdown } from "@/components/common/UserAccountDropdown";
import { UnifiedAuth } from "@/components/common/UnifiedAuth";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import logoImage from "@/assets/Logo.png";
import AppFooter from "@/components/layout/AppFooter";
import KalyanamLogo from "@/components/svgs/KalyanamLogo";
import { motion, useReducedMotion } from "framer-motion";

const About = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { isAuthenticated } = useAuth();
  const { isAuthenticated: isCustomerAuthenticated } = useCustomerAuth();

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
            {isAuthenticated && <UserAccountDropdown />}
            
            {/* Login/Signup buttons - Only show when no one is logged in */}
            {!isAuthenticated && !isCustomerAuthenticated && (
              <div className="flex items-center gap-1 md:hidden">
                <UnifiedAuth
                  trigger={
                    <motion.button
                      className="rounded-full p-2 text-white hover:bg-white/20 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      title="Login / Signup"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </motion.button>
                  }
                />
              </div>
            )}
            
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
          className="text-center mb-16"
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
            About Us
          </motion.h1>
          <motion.p 
            className="text-muted-foreground max-w-3xl mx-auto text-lg"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ delay: 0.1 }}
          >
            Your trusted healthcare partner, serving the community with quality medicines and compassionate care.
          </motion.p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16"
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <p className="text-muted-foreground mb-4">
              Kalyanam Pharmaceuticals is a newly started pharmacy with a vision to make quality healthcare accessible to everyone in our community. Under the leadership of our owner, Pallavan Dixit, we are committed to providing top-class facilities and assurance to each and every customer.
            </p>
            <p className="text-muted-foreground mb-4">
              As a new establishment, we promise to serve each and every customer with top class facility and assurance. We believe that healthcare is not just about medicines, but about building relationships and understanding the unique needs of each customer.
            </p>
            <p className="text-muted-foreground mb-4">
              We want to assure all our customers that Kalyanam will always be there for everyone, providing not just medicines but also expert advice, health consultations, and wellness solutions. Our team is dedicated to ensuring you receive the best possible care.
            </p>
          </motion.div>
          <motion.div 
            className="flex items-center justify-center"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Store className="w-24 h-24 text-primary mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-2">New Beginnings</h3>
                <p className="text-muted-foreground">
                  Starting fresh to serve you better
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          className="mb-16"
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ delay: 0.2 }}
        >
          <motion.h2 
            className="text-3xl font-bold text-center mb-12"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            Our Values
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <div className="p-3 rounded-full bg-primary/10 w-fit">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Compassionate Care</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    We treat every customer with empathy and understanding, recognizing that health concerns can be stressful.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <div className="p-3 rounded-full bg-primary/10 w-fit">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Quality Assurance</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    We source only from trusted manufacturers and maintain strict quality control standards.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <div className="p-3 rounded-full bg-primary/10 w-fit">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="mt-4">Community Focus</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    We're deeply rooted in our community and committed to its health and wellbeing.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          className="mb-16"
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ delay: 0.9 }}
        >
          <motion.h2 
            className="text-3xl font-bold text-center mb-12"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            Why Choose Us
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ delay: 1.0 }}
            >
              <div className="text-center p-6 bg-muted/30 rounded-xl">
                <Package className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Wide Range</h3>
                <p className="text-muted-foreground text-sm">
                  Over 10,000 products including prescription medications, OTC drugs, and health supplements
                </p>
              </div>
            </motion.div>
            
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ delay: 1.1 }}
            >
              <div className="text-center p-6 bg-muted/30 rounded-xl">
                <Clock className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Extended Hours</h3>
                <p className="text-muted-foreground text-sm">
                  Open 15 hours a day to serve you when you need us most
                </p>
              </div>
            </motion.div>
            
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ delay: 1.2 }}
            >
              <div className="text-center p-6 bg-muted/30 rounded-xl">
                <Users className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Expert Advice</h3>
                <p className="text-muted-foreground text-sm">
                  Qualified pharmacists available to answer your health questions
                </p>
              </div>
            </motion.div>
            
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ delay: 1.3 }}
            >
              <div className="text-center p-6 bg-muted/30 rounded-xl">
                <Heart className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Personal Service</h3>
                <p className="text-muted-foreground text-sm">
                  Tailored healthcare solutions for your unique needs
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          className="text-center"
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ delay: 1.0 }}
        >
          <motion.h2 
            className="text-3xl font-bold mb-6"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            Our Commitment
          </motion.h2>
          <motion.p 
            className="text-muted-foreground max-w-3xl mx-auto mb-8"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ delay: 1.1 }}
          >
            At Kalyanam Pharmaceuticals, we're committed to being more than just a pharmacy. We're your healthcare partner, 
            dedicated to improving the health and wellbeing of our community through accessible, affordable, and quality healthcare solutions. 
            Under the ownership of Pallavan Dixit, we assure you that Kalyanam will always be there for everyone.
          </motion.p>
          <motion.button 
            className="rounded-full bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-600 hover:from-blue-700 hover:via-indigo-800 hover:to-purple-700 px-6 py-3 text-base font-medium text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            onClick={() => navigate("/contact")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ delay: 1.2, type: "spring", stiffness: 400, damping: 17 }}
          >
            Visit Our Store
          </motion.button>
        </motion.div>
      </motion.div>
    <AppFooter />
  </div>
  );
};

export default About;