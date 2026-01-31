import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Customers = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isLoading, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      navigate("/auth");
    } else {
      // Redirect to the Owner page with customers section
      navigate("/owner#customers");
    }
  }, [isAuthenticated, isAdmin, isLoading, navigate]);

  return null; // Return null since we're redirecting
};

export default Customers;
