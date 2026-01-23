import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { UnifiedAuth } from "@/components/common/UnifiedAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { isAuthenticated, checkAuth } = useAuth();
  const { isAuthenticated: isCustomerAuthenticated, initializeAuth: initializeCustomerAuth } = useCustomerAuth();

  useEffect(() => {
    checkAuth();
    initializeCustomerAuth();
  }, []);

  useEffect(() => {
    // If either customer or owner is authenticated, redirect appropriately
    if (isAuthenticated) {
      navigate("/owner");
    } else if (isCustomerAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, isCustomerAuthenticated, navigate]);

  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="w-full max-w-md"
        initial={{ y: prefersReducedMotion ? 0 : 30, opacity: prefersReducedMotion ? 1 : 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          mass: 1,
          delay: 0.1
        }}
      >
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <motion.div 
              className="flex justify-center mb-4"
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
              <div className="p-3 rounded-full bg-primary/10">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CardTitle className="text-2xl font-bold">
                Welcome to Kalyanam Pharmaceuticals
              </CardTitle>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <CardDescription>
                Sign in or create an account to access our services
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent>
            <div className="py-4">
              <UnifiedAuth 
                trigger={
                  <div className="w-full text-center text-muted-foreground">
                    Click the button below to open the authentication dialog
                  </div>
                }
                onSuccess={() => {
                  // The unified auth component handles redirects internally
                }}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Auth;