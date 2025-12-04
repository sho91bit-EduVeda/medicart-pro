import { useState, useEffect, useMemo } from "react";
import { db, auth } from "@/integrations/firebase/config";
import { collection, addDoc, query, orderBy, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Download, Plus, TrendingUp, Trash } from "lucide-react";
import { format } from "date-fns";
import { SearchableProductDropdown } from "@/components/SearchableProductDropdown";

interface DailySale {
  id?: string;
  date: string;
  totalAmount: number;
  productsSold: ProductSale[];
  createdAt?: string;
}

interface ProductSale {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

interface MonthlyReport {
  id?: string;
  date: string;
  month: string;
  totalSales: number;
  productsSold: ProductSale[];
  mostSoldProduct: string;
  createdAt?: string;
}

interface Product {
  id: string;
  name: string;
  original_price: number;
  stock_quantity: number;
  in_stock: boolean;
  // ... other product properties
}

const SalesReporting = () => {
  const [dailySales, setDailySales] = useState<DailySale[]>([]);
  const [currentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [productSales, setProductSales] = useState<ProductSale[]>(() => {
    // Load persisted product sales from localStorage if available
    const savedProductSales = localStorage.getItem('medicart-product-sales');
    if (savedProductSales) {
      try {
        return JSON.parse(savedProductSales);
      } catch (e) {
        console.error('Failed to parse saved product sales', e);
      }
    }
    // Default initial state
    return [{ productId: "", productName: "", quantity: 1, price: 0, totalPrice: 0 }];
  });
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSufficientStock, setHasSufficientStock] = useState(true);

  // State for editing sales
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [editingSaleProducts, setEditingSaleProducts] = useState<ProductSale[]>([]);
  
  // Function to start editing a sale
  const startEditingSale = (sale: DailySale) => {
    setEditingSaleId(sale.id || null);
    setEditingSaleProducts([...sale.productsSold]);
  };
  
  // Function to cancel editing
  const cancelEditingSale = () => {
    setEditingSaleId(null);
    setEditingSaleProducts([]);
  };
  
  // Function to update product in editing state
  const updateEditingProduct = (index: number, field: keyof ProductSale, value: string | number) => {
    const updatedProducts = [...editingSaleProducts];
    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]: value
    };
    
    // Calculate total price when quantity or price changes
    if (field === "quantity" || field === "price") {
      const quantity = field === "quantity" ? Number(value) : updatedProducts[index].quantity;
      const price = field === "price" ? Number(value) : updatedProducts[index].price;
      updatedProducts[index].totalPrice = quantity * price;
    }
    
    setEditingSaleProducts(updatedProducts);
  };
  
  // Function to save edited sale
  const saveEditedSale = async () => {
    if (!editingSaleId) return;
    
    // Validate products
    const invalidProducts = editingSaleProducts.filter(ps => 
      ps.quantity <= 0 || ps.price <= 0
    );
    
    if (invalidProducts.length > 0) {
      toast.error("Please ensure all products have valid quantities and prices");
      return;
    }
    
    setLoading(true);
    
    try {
      // Update stock for each product
      await handleUpdateStockForExistingSale(editingSaleId, editingSaleProducts);
      cancelEditingSale();
    } catch (error: any) {
      toast.error(error.message || "Failed to update sale");
    } finally {
      setLoading(false);
    }
  };

  // Persist productSales to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('medicart-product-sales', JSON.stringify(productSales));
  }, [productSales]);

  // Clear persisted product sales when a sale is successfully recorded
  const clearPersistedProductSales = () => {
    localStorage.removeItem('medicart-product-sales');
  };

  // Calculate total amount automatically based on products sold
  const totalAmount = useMemo(() => {
    return productSales.reduce((sum, product) => sum + product.totalPrice, 0);
  }, [productSales]);

  // Load daily sales for today
  useEffect(() => {
    loadDailySales();
    loadMonthlyReports();
  }, []);

  const loadDailySales = async () => {
    try {
      // Simplified query to avoid composite index requirement
      const q = query(
        collection(db, "daily_sales"),
        where("date", "==", currentDate)
        // Removed orderBy to avoid composite index requirement
      );
      
      const querySnapshot = await getDocs(q);
      // Sort client-side instead of using Firestore orderBy
      const salesData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...(doc.data() as any)
        }))
        .sort((a, b) => {
          // Sort by createdAt descending (newest first)
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }) as DailySale[];
      
      setDailySales(salesData);
    } catch (error) {
      console.error("Failed to load daily sales:", error);
      // Don't show toast error on load - it's not a user action
    }
  };

  // Add delete function for daily sales
  const handleDeleteDailySale = async (saleId: string) => {
    console.log("handleDeleteDailySale called with saleId:", saleId);
    
    if (!window.confirm("Are you sure you want to delete this sales entry? This action cannot be undone.")) {
      console.log("User cancelled delete");
      return;
    }
    
    console.log("Proceeding with delete for saleId:", saleId);

    setLoading(true);
    try {
      // First, get the sale data to restore stock
      const saleDoc = await getDoc(doc(db, "daily_sales", saleId));
      
      if (!saleDoc.exists()) {
        toast.error("Sale entry not found");
        setLoading(false);
        return;
      }
      
      const saleData = saleDoc.data() as DailySale;
      
      // Restore stock for each product in the sale
      const stockRestoreResults = await Promise.all(
        saleData.productsSold.map(async (product) => {
          // To restore stock, we pass 0 as quantitySold and the original quantity as originalQuantity
          // This will add the original quantity back to the stock
          return await updateProductStock(product.productName, 0, true, product.quantity);
        })
      );
      
      // Check if all stock restores were successful
      const allRestoresSuccessful = stockRestoreResults.every(result => result === true);
      
      if (!allRestoresSuccessful) {
        toast.error("Failed to restore stock for some products. Please check inventory manually.");
      }
      
      // Delete the document from Firestore
      await deleteDoc(doc(db, "daily_sales", saleId));
      
      // Reload the daily sales to reflect the deletion
      await loadDailySales();
      
      toast.success("Sales entry deleted successfully! Stock restored automatically.");
      console.log("Delete completed successfully");
    } catch (error: any) {
      console.error("Failed to delete sales entry:", error);
      toast.error(error.message || "Failed to delete sales entry");
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyReports = async () => {
    try {
      const q = query(
        collection(db, "monthly_reports"),
        orderBy("month", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const reportsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as any[];
      
      setMonthlyReports(reportsData);
    } catch (error) {
      console.error("Failed to load monthly reports:", error);
      // Don't show toast error on load - it's not a user action
    }
  };

  const handleAddProductSale = () => {
    setProductSales([
      ...productSales,
      { productId: "", productName: "", quantity: 1, price: 0, totalPrice: 0 }
    ]);
  };

  // Handle product selection with automatic price population
  const handleProductSelection = (index: number, productName: string, price?: number) => {
    // Don't run any validation here - just update the product selection
    const newProductSales = [...productSales];
    
    // If price is provided, use it; otherwise default to 0
    const productPrice = price !== undefined ? price : 0;
    const quantity = 1; // Always set default quantity to 1
    
    newProductSales[index] = {
      productId: "", // Will be populated when saving
      productName,
      quantity,
      price: productPrice,
      totalPrice: productPrice * quantity
    };
    
    setProductSales(newProductSales);
  };

  const handleProductChange = (index: number, field: keyof ProductSale, value: string | number) => {
    const newProductSales = [...productSales];
    newProductSales[index] = {
      ...newProductSales[index],
      [field]: value
    };
    
    // Calculate total price when quantity or price changes
    if (field === "quantity" || field === "price") {
      const quantity = field === "quantity" ? Number(value) : newProductSales[index].quantity;
      const price = field === "price" ? Number(value) : newProductSales[index].price;
      newProductSales[index].totalPrice = quantity * price;
    }
    
    setProductSales(newProductSales);
  };

  const handleRemoveProductSale = (index: number) => {
    console.log("handleRemoveProductSale called with index:", index);
    console.log("Current productSales before removal:", productSales);
    
    // Allow removal of the last product, but initialize a new empty one
    if (productSales.length === 1) {
      console.log("Removing last product and initializing new empty one");
      setProductSales([{ productId: "", productName: "", quantity: 1, price: 0, totalPrice: 0 }]);
    } else {
      const newProductSales = [...productSales];
      newProductSales.splice(index, 1);
      setProductSales(newProductSales);
      console.log("Product removed, new productSales:", newProductSales);
    }
  };

  // Function to find product by name and update stock
  const updateProductStock = async (productName: string, quantitySold: number, isEdit: boolean = false, originalQuantity: number = 0) => {
    try {
      // First, find the product by name
      const productsQuery = query(
        collection(db, "products"),
        where("name", "==", productName)
      );
      
      const productsSnapshot = await getDocs(productsQuery);
      
      if (productsSnapshot.empty) {
        toast.error(`Product "${productName}" not found in inventory`);
        return false;
      }
      
      // Assuming the first match is the correct product
      const productDoc = productsSnapshot.docs[0];
      const productData = productDoc.data() as Product;
      const productId = productDoc.id;
      
      // Calculate new stock quantity
      const currentStock = productData.stock_quantity || 0;
      
      let newStock;
      if (isEdit) {
        // For editing existing sales, we need to adjust stock by the difference
        // If reducing quantity sold, we add back the difference to stock
        // If increasing quantity sold, we subtract the difference from stock
        const difference = originalQuantity - quantitySold;
        newStock = Math.max(0, currentStock + difference);
      } else {
        // For new sales, we subtract the quantity sold
        newStock = Math.max(0, currentStock - quantitySold);
      }
      
      // Update the product stock in Firestore
      await updateDoc(doc(db, "products", productId), {
        stock_quantity: newStock,
        in_stock: newStock > 0,
        updated_at: new Date().toISOString()
      });
      
      // Set a flag in localStorage to notify other components to refresh their data
      localStorage.setItem('medicart-stock-updated', Date.now().toString());
      
      return true;
    } catch (error) {
      console.error("Failed to update product stock:", error);
      toast.error(`Failed to update stock for "${productName}"`);
      return false;
    }
  };

  // New function to update stock for existing sales entries
  const handleUpdateStockForExistingSale = async (saleId: string, updatedProducts: ProductSale[]) => {
    setLoading(true);
    
    try {
      // First, get the original sale data
      const saleDoc = await getDoc(doc(db, "daily_sales", saleId));
      
      if (!saleDoc.exists()) {
        toast.error("Sale entry not found");
        setLoading(false);
        return;
      }
      
      const originalSale = saleDoc.data() as DailySale;
      
      // Create a map of original products for easy lookup
      const originalProductsMap = new Map<string, ProductSale>();
      originalSale.productsSold.forEach(product => {
        originalProductsMap.set(product.productName, product);
      });
      
      // Update stock for each product
      const stockUpdateResults = await Promise.all(
        updatedProducts.map(async (updatedProduct) => {
          const originalProduct = originalProductsMap.get(updatedProduct.productName);
          const originalQuantity = originalProduct ? originalProduct.quantity : 0;
          
          return await updateProductStock(
            updatedProduct.productName, 
            updatedProduct.quantity, 
            true, // isEdit flag
            originalQuantity
          );
        })
      );
      
      // Check if all stock updates were successful
      const allUpdatesSuccessful = stockUpdateResults.every(result => result === true);
      
      if (!allUpdatesSuccessful) {
        toast.error("Some products failed to update stock. Please check inventory.");
      } else {
        toast.success("Stock updated successfully for edited sale!");
      }
      
      // Update the sale entry in Firestore
      await updateDoc(doc(db, "daily_sales", saleId), {
        productsSold: updatedProducts,
        totalAmount: updatedProducts.reduce((sum, product) => sum + product.totalPrice, 0),
        updatedAt: new Date().toISOString()
      });
      
      // Reload the daily sales to reflect the changes
      await loadDailySales();
      
      // Set a flag in localStorage to notify other components to refresh their data
      localStorage.setItem('medicart-stock-updated', Date.now().toString());
      
    } catch (error: any) {
      console.error("Failed to update stock for existing sale:", error);
      toast.error(error.message || "Failed to update stock for existing sale");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDailySales = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only validate entries that have a product name selected
    const filledProducts = productSales.filter(ps => ps.productName.trim());
    
    // If there are filled products, validate them
    if (filledProducts.length > 0) {
      // Check stock availability for all products first
      const stockChecks = await Promise.all(
        filledProducts.map(async (product) => {
          return await checkStockAvailability(product.productName, product.quantity);
        })
      );
      
      // Check if all products have sufficient stock
      const allStockAvailable = stockChecks.every(check => check.available);
      
      if (!allStockAvailable) {
        // Find the first product with insufficient stock to provide a specific error message
        const firstInsufficient = filledProducts.findIndex((_, index) => !stockChecks[index].available);
        if (firstInsufficient !== -1) {
          const product = filledProducts[firstInsufficient];
          const stockCheck = stockChecks[firstInsufficient];
          toast.error(`Not enough stock for "${product.productName}". Available: ${stockCheck.availableStock}, Requested: ${product.quantity}`);
        } else {
          toast.error("Not enough stock for one or more products");
        }
        return;
      }
      
      const invalidProducts = filledProducts.filter(ps => 
        ps.quantity <= 0 || ps.price <= 0
      );
      
      if (invalidProducts.length > 0) {
        // Find the first invalid field to provide a more specific error message
        const firstInvalid = invalidProducts[0];
        if (firstInvalid.quantity <= 0) {
          toast.error("Quantity must be at least 1");
        } else if (firstInvalid.price <= 0) {
          toast.error("Price must be greater than zero");
        } else {
          toast.error("Please fill in all product details with valid values");
        }
        return;
      }
      
      // Only check total amount if there are valid products
      if (totalAmount <= 0) {
        toast.error("Total amount must be greater than zero");
        return;
      }
    } else {
      // If no products have been selected at all, show an error
      // But only if the user has actually tried to submit the form
      // We'll use a flag to track if this is a real submission
      const hasUserMadeChanges = productSales.some(ps => ps.productName.trim() || ps.quantity > 1 || ps.price > 0);
      if (hasUserMadeChanges) {
        toast.error("Please select at least one product");
        return;
      } else {
        // If no changes were made, don't show any error
        return;
      }
    }
    
    setLoading(true);
    
    try {
      // Update stock for each product sold BEFORE recording the sale
      const stockUpdateResults = await Promise.all(
        filledProducts.map(async (product) => {
          return await updateProductStock(product.productName, product.quantity);
        })
      );
      
      // Check if all stock updates were successful
      const allUpdatesSuccessful = stockUpdateResults.every(result => result === true);
      
      if (!allUpdatesSuccessful) {
        toast.error("Failed to update stock for some products. Please check inventory.");
        setLoading(false);
        return;
      }
      
      // Record the daily sales AFTER updating stock
      await addDoc(collection(db, "daily_sales"), {
        date: currentDate,
        totalAmount: totalAmount,
        productsSold: filledProducts,
        createdAt: new Date().toISOString()
      });
      
      toast.success("Daily sales recorded successfully! Stock updated automatically.");
      setProductSales([{ productId: "", productName: "", quantity: 1, price: 0, totalPrice: 0 }]);
      clearPersistedProductSales(); // Clear persisted data
      loadDailySales();
    } catch (error: any) {
      toast.error(error.message || "Failed to record daily sales");
    } finally {
      setLoading(false);
    }
  };

  // New function to update stock separately (for preview purposes only)
  const handleUpdateStock = async () => {
    // Only validate entries that have a product name selected
    const filledProducts = productSales.filter(ps => ps.productName.trim());
    
    // If there are filled products, validate them
    if (filledProducts.length > 0) {
      const invalidProducts = filledProducts.filter(ps => 
        ps.quantity <= 0 || ps.price <= 0
      );
      
      if (invalidProducts.length > 0) {
        // Find the first invalid field to provide a more specific error message
        const firstInvalid = invalidProducts[0];
        if (firstInvalid.quantity <= 0) {
          toast.error("Quantity must be at least 1");
        } else if (firstInvalid.price <= 0) {
          toast.error("Price must be greater than zero");
        } else {
          toast.error("Please fill in all product details with valid values");
        }
        return;
      }
      
      // Only check total amount if there are valid products
      if (totalAmount <= 0) {
        toast.error("Total amount must be greater than zero");
        return;
      }
    } else {
      toast.info("No products selected. Add products to the form and fill in their details to preview stock updates.");
      return;
    }
    
    setLoading(true);
    
    try {
      // Update stock for each product sold (this is for preview/testing only)
      const stockUpdateResults = await Promise.all(
        filledProducts.map(async (product) => {
          return await updateProductStock(product.productName, product.quantity);
        })
      );
      
      // Check if all stock updates were successful
      const allUpdatesSuccessful = stockUpdateResults.every(result => result === true);
      
      if (!allUpdatesSuccessful) {
        toast.error("Some products failed to update stock. Please check inventory.");
      } else {
        toast.success("Stock preview updated successfully! (This does not record a sale)");
        toast.info("Note: This only updates stock for preview. To record a sale, use the 'Record Daily Sales' button.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update stock");
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyReport = async (isAutoGenerated = false) => {
    setLoading(true);
    
    try {
      // Get all daily sales for the current month
      const startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
      
      // Simplified query to avoid composite index requirement
      const q = query(
        collection(db, "daily_sales")
        // Removed where clauses to avoid composite index requirement
      );
      
      const querySnapshot = await getDocs(q);
      // Filter client-side instead of using Firestore where clauses
      const dailySalesData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...(doc.data() as any)
        }))
        .filter(sale => {
          // Filter by date range client-side
          if (!sale.date) return false;
          return sale.date >= format(startDate, "yyyy-MM-dd") && 
                 sale.date <= format(endDate, "yyyy-MM-dd");
        }) as DailySale[];
      
      if (dailySalesData.length === 0) {
        if (!isAutoGenerated) {
          toast.error("No sales data available for this month");
        }
        setLoading(false);
        return;
      }
      
      // Process data for report
      let totalSales = 0;
      const productMap: Record<string, { quantity: number; sales: number }> = {};
      
      dailySalesData.forEach(sale => {
        totalSales += sale.totalAmount;
        sale.productsSold.forEach(product => {
          if (productMap[product.productName]) {
            productMap[product.productName].quantity += product.quantity;
            productMap[product.productName].sales += product.totalPrice;
          } else {
            productMap[product.productName] = {
              quantity: product.quantity,
              sales: product.totalPrice
            };
          }
        });
      });
      
      // Find most sold product
      let mostSoldProduct = "";
      let maxQuantity = 0;
      
      Object.entries(productMap).forEach(([productName, data]) => {
        if (data.quantity > maxQuantity) {
          maxQuantity = data.quantity;
          mostSoldProduct = productName;
        }
      });
      
      // Format products sold for report
      const productsSold = Object.entries(productMap).map(([productName, data]) => ({
        productId: "",
        productName,
        quantity: data.quantity,
        price: data.sales / data.quantity,
        totalPrice: data.sales
      }));
      
      // Check if a report already exists for this month
      const currentMonth = format(startDate, "yyyy-MM");
      const existingReportQuery = query(
        collection(db, "monthly_reports"),
        where("month", "==", currentMonth)
      );
      
      const existingReportSnapshot = await getDocs(existingReportQuery);
      
      if (!existingReportSnapshot.empty) {
        // Update existing report
        const reportDoc = existingReportSnapshot.docs[0];
        await updateDoc(doc(db, "monthly_reports", reportDoc.id), {
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
          totalSales,
          productsSold,
          mostSoldProduct,
          updatedAt: new Date().toISOString()
        });
        
        if (!isAutoGenerated) {
          toast.success("Monthly report updated successfully!");
        } else {
          console.log("Monthly report auto-generated for", currentMonth);
          // Show a notification to the user
          toast.info(`Monthly report for ${currentMonth} has been automatically generated.`);
          // Create a notification in the database
          await createNotification(
            'Monthly Report Generated',
            `The monthly sales report for ${currentMonth} has been automatically generated.`,
            'report'
          );
        }
      } else {
        // Save new report
        await addDoc(collection(db, "monthly_reports"), {
          month: currentMonth,
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
          totalSales,
          productsSold,
          mostSoldProduct,
          createdAt: new Date().toISOString()
        });
        
        if (!isAutoGenerated) {
          toast.success("Monthly report generated successfully!");
        } else {
          console.log("Monthly report auto-generated for", currentMonth);
          // Show a notification to the user
          toast.info(`Monthly report for ${currentMonth} has been automatically generated.`);
          // Create a notification in the database
          await createNotification(
            'Monthly Report Generated',
            `The monthly sales report for ${currentMonth} has been automatically generated.`,
            'report'
          );
        }
      }
      
      loadMonthlyReports();
    } catch (error: any) {
      if (!isAutoGenerated) {
        toast.error(error.message || "Failed to generate monthly report");
      } else {
        console.error("Failed to auto-generate monthly report:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handler for manual report generation button click
  const handleGenerateMonthlyReport = async () => {
    await generateMonthlyReport(false);
  };

  const exportToExcel = (report: MonthlyReport) => {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Header
    csvContent += "Date,Total Sales,Most Sold Product\n";
    csvContent += `${report.date},${report.totalSales.toFixed(2)},${report.mostSoldProduct}\n\n`;
    
    // Products sold section
    csvContent += "Product Name,Quantity,Unit Price,Total Price\n";
    report.productsSold.forEach(product => {
      csvContent += `${product.productName},${product.quantity},${product.price.toFixed(2)},${product.totalPrice.toFixed(2)}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `monthly_report_${report.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Report exported successfully!");
  };

  // Function to generate and export daily sales report
  const generateDailyReport = async () => {
    try {
      // Get all daily sales for today
      const today = format(new Date(), "yyyy-MM-dd");
      
      // Simplified query to avoid composite index requirement
      const q = query(
        collection(db, "daily_sales"),
        where("date", "==", today)
      );
      
      const querySnapshot = await getDocs(q);
      const dailySalesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as DailySale[];
      
      if (dailySalesData.length === 0) {
        toast.error("No sales data available for today");
        return;
      }
      
      // Process data for report
      let totalSales = 0;
      const productMap: Record<string, { quantity: number; sales: number }> = {};
      
      dailySalesData.forEach(sale => {
        totalSales += sale.totalAmount;
        sale.productsSold.forEach(product => {
          if (productMap[product.productName]) {
            productMap[product.productName].quantity += product.quantity;
            productMap[product.productName].sales += product.totalPrice;
          } else {
            productMap[product.productName] = {
              quantity: product.quantity,
              sales: product.totalPrice
            };
          }
        });
      });
      
      // Find most sold product
      let mostSoldProduct = "";
      let maxQuantity = 0;
      
      Object.entries(productMap).forEach(([productName, data]) => {
        if (data.quantity > maxQuantity) {
          maxQuantity = data.quantity;
          mostSoldProduct = productName;
        }
      });
      
      // Create CSV content for daily report
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Header
      csvContent += "Daily Sales Report\n";
      csvContent += "Date,Total Sales,Most Sold Product\n";
      csvContent += `${today},${totalSales.toFixed(2)},${mostSoldProduct}\n\n`;
      
      // Products sold section
      csvContent += "Product Name,Quantity,Unit Price,Total Price\n";
      Object.entries(productMap).forEach(([productName, data]) => {
        const unitPrice = data.sales / data.quantity;
        csvContent += `${productName},${data.quantity},${unitPrice.toFixed(2)},${data.sales.toFixed(2)}\n`;
      });
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `daily_report_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Daily report generated and downloaded successfully!");
    } catch (error: any) {
      console.error("Failed to generate daily report:", error);
      toast.error(error.message || "Failed to generate daily report");
    }
  };

  // New function to check stock availability
  const checkStockAvailability = async (productName: string, requestedQuantity: number) => {
    try {
      // First, find the product by name
      const productsQuery = query(
        collection(db, "products"),
        where("name", "==", productName)
      );
      
      const productsSnapshot = await getDocs(productsQuery);
      
      if (productsSnapshot.empty) {
        return { available: false, availableStock: 0 };
      }
      
      // Assuming the first match is the correct product
      const productDoc = productsSnapshot.docs[0];
      const productData = productDoc.data() as Product;
      const availableStock = productData.stock_quantity || 0;
      
      // Check if requested quantity is available
      return { 
        available: requestedQuantity <= availableStock, 
        availableStock 
      };
    } catch (error) {
      console.error("Failed to check stock availability:", error);
      return { available: false, availableStock: 0 };
    }
  };

  // Function to check stock availability for all products
  const checkAllStockAvailability = async () => {
    // Only check entries that have a product name selected
    const filledProducts = productSales.filter(ps => ps.productName.trim());
    
    if (filledProducts.length === 0) {
      setHasSufficientStock(true);
      return;
    }
    
    // Check stock availability for all products
    const stockChecks = await Promise.all(
      filledProducts.map(async (product) => {
        return await checkStockAvailability(product.productName, product.quantity);
      })
    );
    
    // Check if all products have sufficient stock
    const allStockAvailable = stockChecks.every(check => check.available);
    setHasSufficientStock(allStockAvailable);
  };

  // Check stock availability whenever productSales changes
  useEffect(() => {
    checkAllStockAvailability();
  }, [productSales]);

  // Utility function to check if today is the last day of the month
  const isLastDayOfMonth = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.getMonth() !== today.getMonth();
  };

  // Check if today is the last day of the month and auto-generate report if needed
  useEffect(() => {
    const checkAndGenerateMonthlyReport = async () => {
      // Check if today is the last day of the month
      if (isLastDayOfMonth()) {
        // Check if a report has already been generated for this month
        const today = new Date();
        const currentMonth = format(today, "yyyy-MM");
        const existingReport = monthlyReports.find(report => report.month === currentMonth);
        
        if (!existingReport) {
          // Auto-generate the monthly report
          await generateMonthlyReport(true); // Pass true to indicate auto-generation
        }
      }
    };
    
    // Run the check when the component loads
    checkAndGenerateMonthlyReport();
    
    // Set up a daily check
    const interval = setInterval(() => {
      checkAndGenerateMonthlyReport();
    }, 24 * 60 * 60 * 1000); // Check every 24 hours
    
    // Clean up the interval on component unmount
    return () => clearInterval(interval);
  }, [monthlyReports]);

  // Function to create a notification in the database
  const createNotification = async (title: string, message: string, type: string = 'report') => {
    try {
      // Get the current user
      const user = auth.currentUser;
      if (!user) {
        console.warn('No authenticated user found for notification');
        return;
      }

      // Add notification to the database
      await addDoc(collection(db, 'notifications'), {
        type,
        title,
        message,
        read: false,
        action_url: '/owner#sales-reporting',
        created_at: new Date().toISOString(),
        user_id: user.uid // Associate with the current user (owner)
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  };

  // State for selected reports (for bulk deletion)
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  // State for filter options
  const [reportFilter, setReportFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("month");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Function to handle report selection for bulk operations
  const toggleReportSelection = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId) 
        : [...prev, reportId]
    );
  };

  // Function to select all reports
  const selectAllReports = () => {
    if (selectedReports.length === filteredAndSortedReports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(filteredAndSortedReports.map(report => report.id));
    }
  };

  // Function to delete a single report
  const handleDeleteReport = async (reportId: string, reportMonth: string) => {
    if (!window.confirm(`Are you sure you want to delete the report for ${reportMonth}? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteDoc(doc(db, "monthly_reports", reportId));
      toast.success(`Report for ${reportMonth} deleted successfully!`);
      loadMonthlyReports();
      // Remove from selected reports if it was selected
      setSelectedReports(prev => prev.filter(id => id !== reportId));
    } catch (error: any) {
      toast.error(error.message || "Failed to delete report");
    } finally {
      setLoading(false);
    }
  };

  // Function to delete multiple selected reports
  const handleDeleteSelectedReports = async () => {
    if (selectedReports.length === 0) {
      toast.error("Please select at least one report to delete");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedReports.length} report(s)? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      // Delete all selected reports
      const deletePromises = selectedReports.map(reportId => 
        deleteDoc(doc(db, "monthly_reports", reportId))
      );
      
      await Promise.all(deletePromises);
      
      toast.success(`${selectedReports.length} report(s) deleted successfully!`);
      loadMonthlyReports();
      setSelectedReports([]); // Clear selection
    } catch (error: any) {
      toast.error(error.message || "Failed to delete reports");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort reports
  const filteredAndSortedReports = useMemo(() => {
    let result = [...monthlyReports];
    
    // Apply filter
    if (reportFilter) {
      result = result.filter(report => 
        report.month.toLowerCase().includes(reportFilter.toLowerCase())
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "month":
          comparison = a.month.localeCompare(b.month);
          break;
        case "totalSales":
          comparison = a.totalSales - b.totalSales;
          break;
        case "productsSold":
          comparison = a.productsSold.length - b.productsSold.length;
          break;
        default:
          comparison = a.month.localeCompare(b.month);
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
    
    return result;
  }, [monthlyReports, reportFilter, sortBy, sortOrder]);

  return (
    <div className="space-y-8">
      {/* Daily Sales Entry */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Daily Sales Entry
          </CardTitle>
          <CardDescription>
            Record today's sales and products sold (stock will be updated automatically)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitDailySales} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  value={currentDate}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount Earned (₹)</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  value={totalAmount.toFixed(2)}
                  readOnly
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">Automatically calculated based on products sold</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Products Sold</h3>
                <Button type="button" variant="outline" onClick={handleAddProductSale} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Product
                </Button>
              </div>
              
              {/* Product Selection Dropdowns */}
              <div className="space-y-4">
                {productSales.map((product, index) => (
                  <div key={index} className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`productName-${index}`}>Product Name</Label>
                      <SearchableProductDropdown
                        value={product.productName}
                        onValueChange={(value, price) => handleProductSelection(index, value, price)}
                        placeholder="Select or search a product..."
                        resetAfterSelect={true}
                      />
                    </div>
                    
                    {/* Product Details Table (only shown when product is selected) */}
                    {product.productName && (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>Unit Price (₹)</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Total (₹)</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">{product.productName}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={product.price.toFixed(2)}
                                  onChange={(e) => handleProductChange(index, "price", parseFloat(e.target.value) || 0)}
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={product.quantity}
                                  onChange={(e) => handleProductChange(index, "quantity", parseInt(e.target.value) || 1)}
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>₹{product.totalPrice.toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleRemoveProductSale(index)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                type="submit" 
                disabled={loading || !hasSufficientStock}
                className="flex-1"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    <span>Recording Sales...</span>
                  </div>
                ) : (
                  "Record Daily Sale"
                )}
              </Button>
            </div>
            
            {/* Note about recording sales */}
            {!hasSufficientStock && (
              <div className="text-sm text-red-500 mt-2">
                Cannot record sale: Insufficient stock for one or more products
              </div>
            )}
            <div className="text-sm text-muted-foreground mt-2">
              Note: Record sale at the end of the day
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Today's Sales Summary */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Today's Sales Summary</CardTitle>
          <CardDescription>
            Sales recorded for {format(new Date(currentDate), "MMMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dailySales.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No sales recorded yet</h3>
              <p className="text-muted-foreground">
                Record your first sale using the form above.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">Total Entries</p>
                  <p className="text-2xl font-bold">{dailySales.length}</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">
                    ₹{dailySales.reduce((sum, sale) => sum + sale.totalAmount, 0).toFixed(2)}
                  </p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">Products Sold</p>
                  <p className="text-2xl font-bold">
                    {dailySales.reduce((sum, sale) => 
                      sum + sale.productsSold.reduce((prodSum, prod) => prodSum + prod.quantity, 0), 0
                    )}
                  </p>
                </div>
              </div>
              

              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailySales.map((sale) => (
                    <TableRow key={sale.id}>
                      {editingSaleId === sale.id ? (
                        // Editing mode
                        <>
                          <TableCell colSpan={3}>
                            <div className="space-y-4">
                              <h4 className="font-medium">Editing Sale</h4>
                              {editingSaleProducts.map((product, index) => (
                                <div key={index} className="flex flex-wrap gap-2 items-end">
                                  <div className="flex-1 min-w-[200px]">
                                    <Label>Product</Label>
                                    <Input
                                      value={product.productName}
                                      readOnly
                                      className="bg-muted"
                                    />
                                  </div>
                                  <div className="w-24">
                                    <Label>Price</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={product.price.toFixed(2)}
                                      onChange={(e) => updateEditingProduct(index, "price", parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="w-20">
                                    <Label>Qty</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={product.quantity}
                                      onChange={(e) => updateEditingProduct(index, "quantity", parseInt(e.target.value) || 1)}
                                    />
                                  </div>
                                  <div className="w-24">
                                    <Label>Total</Label>
                                    <Input
                                      value={product.totalPrice.toFixed(2)}
                                      readOnly
                                      className="bg-muted"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                onClick={saveEditedSale}
                                disabled={loading}
                              >
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelEditingSale}
                                disabled={loading}
                              >
                                Cancel
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        // Display mode
                        <>
                          <TableCell>
                            {sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </TableCell>
                          <TableCell>₹{sale.totalAmount.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {sale.productsSold.map((product, idx) => (
                                <div key={idx} className="text-sm">
                                  {product.productName} ({product.quantity} × ₹{product.price.toFixed(2)})
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditingSale(sale)}
                                disabled={loading}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log("Daily sales summary delete button clicked");
                                  console.log("Sale ID:", sale.id);
                                  if (sale.id) {
                                    handleDeleteDailySale(sale.id);
                                  } else {
                                    console.log("Sale ID is missing");
                                    toast.error("Cannot delete sale: Missing ID");
                                  }
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Reports */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Monthly Reports
          </CardTitle>
          <CardDescription>
            Generated monthly sales reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Previous Reports</h3>
              {selectedReports.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  ({selectedReports.length} selected)
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedReports.length > 0 ? (
                <>
                  <Button 
                    onClick={handleDeleteSelectedReports} 
                    disabled={loading}
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Trash className="w-4 h-4" />
                    Delete Selected ({selectedReports.length})
                  </Button>
                  <Button 
                    onClick={() => setSelectedReports([])}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={handleGenerateMonthlyReport} disabled={loading} variant="secondary" size="sm">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    "Generate Current Month Report"
                  )}
                </Button>
              )}
            </div>
          </div>
          
          {/* Filter and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Filter by month (e.g., 2023-12)..."
                value={reportFilter}
                onChange={(e) => setReportFilter(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="totalSales">Total Sales</SelectItem>
                  <SelectItem value="productsSold">Products Sold</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="flex items-center gap-2"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
              {(reportFilter || sortBy !== "month" || sortOrder !== "desc") && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setReportFilter("");
                    setSortBy("month");
                    setSortOrder("desc");
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
          
          {filteredAndSortedReports.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {monthlyReports.length === 0 ? "No monthly reports yet" : "No reports match your filter"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {monthlyReports.length === 0 
                  ? "Generate your first monthly report using the button above."
                  : "Try adjusting your filter or sort criteria."}
              </p>
              {monthlyReports.length === 0 && (
                <Button onClick={handleGenerateMonthlyReport} disabled={loading}>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    "Generate Current Month Report"
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  id="select-all"
                  checked={selectedReports.length === filteredAndSortedReports.length && filteredAndSortedReports.length > 0}
                  onCheckedChange={selectAllReports}
                />
                <Label htmlFor="select-all" className="text-sm font-medium">
                  Select All
                </Label>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <span className="sr-only">Select</span>
                    </TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Total Sales</TableHead>
                    <TableHead>Products Sold</TableHead>
                    <TableHead>Most Sold Product</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedReports.map((report: any) => (
                    <TableRow 
                      key={report.id}
                      className={selectedReports.includes(report.id) ? "bg-muted" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedReports.includes(report.id)}
                          onCheckedChange={() => toggleReportSelection(report.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{report.month}</TableCell>
                      <TableCell>₹{report.totalSales.toFixed(2)}</TableCell>
                      <TableCell>{report.productsSold.length}</TableCell>
                      <TableCell>{report.mostSoldProduct}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => exportToExcel(report)}
                            className="flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Export</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteReport(report.id, report.month)}
                            disabled={loading}
                            className="flex items-center gap-2"
                          >
                            <Trash className="w-4 h-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesReporting;