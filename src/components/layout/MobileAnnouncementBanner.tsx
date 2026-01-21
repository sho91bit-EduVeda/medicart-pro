import { useState } from "react";
import { X, Store, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MobileAnnouncementBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  // Function to check if store is currently open
  const isStoreOpen = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    // Store hours: 8 AM (8) to 10:30 PM (22:30)
    if (currentHour < 8) return false;
    if (currentHour > 22) return false;
    if (currentHour === 22 && currentMinute > 30) return false;
    return true;
  };

  const isOpen = isStoreOpen();

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`w-full px-4 py-3 ${
            isOpen 
              ? "bg-green-500/10 border border-green-500/30" 
              : "bg-red-500/10 border border-red-500/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`p-2 rounded-full ${
                isOpen ? "bg-green-500/20" : "bg-red-500/20"
              }`}>
                <Store className={`w-5 h-5 ${
                  isOpen ? "text-green-600" : "text-red-600"
                }`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${
                  isOpen ? "text-green-700" : "text-red-700"
                }`}>
                  {isOpen ? "Store is OPEN now!" : "Store is currently CLOSED"}
                </p>
                <p className={`text-xs ${
                  isOpen ? "text-green-600" : "text-red-600"
                }`}>
                  Visit our store for immediate assistance
                </p>
              </div>
            </div>
            <motion.button
              onClick={() => setIsVisible(false)}
              className="p-1 rounded-full hover:bg-black/10 transition-colors ml-2"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileAnnouncementBanner;