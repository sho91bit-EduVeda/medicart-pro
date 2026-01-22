import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logoImage from "@/assets/Logo.png";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const AppFooter = () => {
  const navigate = useNavigate();

  return (
    <motion.footer
      className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-600 text-white"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

          <div className="flex flex-col justify-end items-start md:items-end">
            <div className="flex gap-6 mb-4">
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
            
            <div className="flex flex-col items-center md:items-end gap-1">
              <p className="text-blue-100 text-sm">
                © 2025 Kalyanam Pharmaceuticals. All rights reserved.
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-blue-100 text-sm cursor-help underline decoration-dashed">
                      Created By Shobhit Shukla (+91-9643000619)
                    </p>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs text-blue-100">
                      If you need to move your business online as well, contact here.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default AppFooter;