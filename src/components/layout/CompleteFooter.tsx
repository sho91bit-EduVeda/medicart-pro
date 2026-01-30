import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logoImage from "@/assets/Logo.png";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CompleteFooter = () => {
  const navigate = useNavigate();

  return (
    <motion.footer
      className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-600 text-white"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 footer-mobile-layout">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white shadow-md">
                <img src={logoImage} alt="Kalyanam Pharmaceuticals Logo" className="w-6 h-6 object-contain" />
              </div>
              <h2 className="text-xl font-bold text-white">Kalyanam Pharmaceuticals</h2>
            </div>
            <p className="text-blue-100 text-sm">
              Your trusted healthcare partner delivering quality pharmaceutical products and expert solutions right to your doorstep.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <motion.button
                  onClick={() => navigate("/")}
                  className="text-left text-blue-100 hover:text-white transition-colors text-sm w-full"
                  whileHover={{ x: 5 }}
                >
                  Home
                </motion.button>
              </li>
              <li>
                <motion.button
                  onClick={() => navigate("/about")}
                  className="text-left text-blue-100 hover:text-white transition-colors text-sm w-full"
                  whileHover={{ x: 5 }}
                >
                  About Us
                </motion.button>
              </li>
              <li>
                <motion.button
                  onClick={() => navigate("/products")}
                  className="text-left text-blue-100 hover:text-white transition-colors text-sm w-full"
                  whileHover={{ x: 5 }}
                >
                  Products
                </motion.button>
              </li>
              <li>
                <motion.button
                  onClick={() => navigate("/offers")}
                  className="text-left text-blue-100 hover:text-white transition-colors text-sm w-full"
                  whileHover={{ x: 5 }}
                >
                  Offers
                </motion.button>
              </li>
              <li>
                <motion.button
                  onClick={() => navigate("/contact")}
                  className="text-left text-blue-100 hover:text-white transition-colors text-sm w-full"
                  whileHover={{ x: 5 }}
                >
                  Contact
                </motion.button>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Categories</h3>
            <ul className="space-y-3">
              <li>
                <motion.button
                  onClick={() => navigate("/products?category=allergy")}
                  className="text-left text-blue-100 hover:text-white transition-colors text-sm w-full"
                  whileHover={{ x: 5 }}
                >
                  Allergy & Asthma
                </motion.button>
              </li>
              <li>
                <motion.button
                  onClick={() => navigate("/products?category=antibiotics")}
                  className="text-left text-blue-100 hover:text-white transition-colors text-sm w-full"
                  whileHover={{ x: 5 }}
                >
                  Antibiotics
                </motion.button>
              </li>
              <li>
                <motion.button
                  onClick={() => navigate("/products?category=baby")}
                  className="text-left text-blue-100 hover:text-white transition-colors text-sm w-full"
                  whileHover={{ x: 5 }}
                >
                  Baby Products
                </motion.button>
              </li>
              <li>
                <motion.button
                  onClick={() => navigate("/products?category=cold-flu")}
                  className="text-left text-blue-100 hover:text-white transition-colors text-sm w-full"
                  whileHover={{ x: 5 }}
                >
                  Cold & Flu
                </motion.button>
              </li>
              <li>
                <motion.button
                  onClick={() => navigate("/products?category=pain")}
                  className="text-left text-blue-100 hover:text-white transition-colors text-sm w-full"
                  whileHover={{ x: 5 }}
                >
                  Pain Relief
                </motion.button>
              </li>
              <li>
                <motion.button
                  onClick={() => navigate("/products?category=vitamins")}
                  className="text-left text-blue-100 hover:text-white transition-colors text-sm w-full"
                  whileHover={{ x: 5 }}
                >
                  Vitamins & Supplements
                </motion.button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Contact Info</h3>
            <ul className="space-y-3 text-blue-100">
              <li className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-1 flex-shrink-0">
                  <path d="M20 10c0-4.4-3.6-8-8-8s-8 3.6-8 8 3.6 8 8 8 8-3.6 8-8z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span className="text-sm">Mansarovar Yojna, 2/50, Kanpur Rd, Sector O, Mansarovar, Transport Nagar, Lucknow, Uttar Pradesh 226012</span>
              </li>
              <li className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span className="text-sm">079053 82771</span>
              </li>
              <li className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span className="text-sm">info@kalyanampharmacy.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-blue-100 text-sm">
              © 2025 Kalyanam Pharmaceuticals. All rights reserved.
            </p>
            
            {/* Compact Credit with Contact Icons */}
            <div className="flex items-center gap-3">
              {/* Creator Credit Text with Heart Icon */}
              <span className="text-white/70 text-xs font-medium whitespace-nowrap flex items-center gap-1">
                Created with 
                <span className="text-red-400">♥</span>
                {}by Shobhit Shukla
              </span>
              
              <div className="flex items-center gap-2">
                {/* Phone Icon */}
                <a 
                  href="tel:+919643000619" 
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/30 group"
                  aria-label="Call developer"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="text-white group-hover:text-green-300 transition-colors"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </a>
                
                {/* Email Icon */}
                <a 
                  href="mailto:shobhit@example.com" 
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/30 group"
                  aria-label="Email developer"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="text-white group-hover:text-blue-300 transition-colors"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="flex gap-6">
            <motion.button
              onClick={() => navigate("/privacy-policy")}
              className="text-left text-blue-100 hover:text-white text-sm transition-colors"
              whileHover={{ y: -2 }}
            >
              Privacy Policy
            </motion.button>
            <motion.button
              onClick={() => navigate("/terms-of-service")}
              className="text-left text-blue-100 hover:text-white text-sm transition-colors"
              whileHover={{ y: -2 }}
            >
              Terms of Service
            </motion.button>
            <motion.button
              onClick={() => navigate("/shipping-policy")}
              className="text-left text-blue-100 hover:text-white text-sm transition-colors"
              whileHover={{ y: -2 }}
            >
              Shipping Policy
            </motion.button>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default CompleteFooter;