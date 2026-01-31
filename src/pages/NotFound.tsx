import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import CommonHeader from "@/components/layout/CommonHeader";
import CompleteFooter from "@/components/layout/CompleteFooter";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Error logging removed for production
  }, [location.pathname]);

  return (
    <motion.div 
      className="flex min-h-screen items-center justify-center bg-gray-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="text-center"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          mass: 1,
          delay: 0.1
        }}
      >
        <motion.h1 
          className="mb-4 text-4xl font-bold"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 20,
            mass: 1,
            delay: 0.2
          }}
        >
          404
        </motion.h1>
        <motion.p 
          className="mb-4 text-xl text-gray-600"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Oops! Page not found
        </motion.p>
        <motion.a 
          href="/" 
          className="text-blue-500 underline hover:text-blue-700 inline-block"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Return to Home
        </motion.a>
      </motion.div>
    </motion.div>
  );
};

export default NotFound;
