import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogDesc,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { db, rtdb } from "@/integrations/firebase/config";
import { addDoc, collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { ref, get, update } from "firebase/database";
import { Search, Download, Database, Loader2, Plus, X } from "lucide-react";

interface IndianMedicine {
  id: string;
  name: string;
  "price(₹)": string;
  Is_discontinued: string;
  manufacturer_name: string;
  type: string;
  pack_size_label: string;
  short_composition1: string;
  short_composition2: string;
}

interface Product {
  id: string;
  name: string;
  category_id: string;
  description: string;
  uses: string;
  composition: string;
  original_price: number;
  image_url: string | null;
  in_stock: boolean;
  stock_quantity: number;
  discount_percentage?: number;
  created_at: string;
}

interface ProductFormData {
  name: string;
  category_id: string;
  description: string;
  uses: string;
  composition: string;
  original_price: string;
  image_url: string;
  in_stock: boolean;
  stock_quantity: number;
  discount_percentage: string;
}

interface Category {
  id: string;
  name: string;
}

interface IndianMedicineDatasetImportProps {
  categories: Category[];
  onCategoriesChange?: () => void; // Add callback for when categories change
}

export const IndianMedicineDatasetImport = ({ categories, onCategoriesChange }: IndianMedicineDatasetImportProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [medicines, setMedicines] = useState<IndianMedicine[]>([]);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<IndianMedicine | null>(null);
  const [selectedLocalProduct, setSelectedLocalProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const itemsPerPage = 5;
  
  // State for adding new category
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategoryLoading, setAddingCategoryLoading] = useState(false);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    category_id: "", // Changed to empty string for default "Select" option
    description: "",
    uses: "",
    composition: "",
    original_price: "",
    image_url: "",
    in_stock: true,
    stock_quantity: 10,
    discount_percentage: "",
  });

  // Update form when categories change
  useEffect(() => {
    if (categories.length > 0 && !formData.category_id) {
      setFormData(prev => ({
        ...prev,
        category_id: "" // Changed to empty string for default "Select" option
      }));
    }
  }, [categories]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Search for existing products in local database
  const searchLocalProducts = async (searchTerm: string) => {
    try {
      // Search for products in local database (case-insensitive)
      const lowerSearchTerm = searchTerm.toLowerCase();
      const q = query(
        collection(db, "products"),
        where("name", ">=", lowerSearchTerm),
        where("name", "<=", lowerSearchTerm + "\uf8ff")
      );
      
      const querySnapshot = await getDocs(q);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as Product[];
      
      // If no results with prefix search, try contains search
      if (productsData.length === 0) {
        const allProductsSnapshot = await getDocs(collection(db, "products"));
        const allProducts = allProductsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any)
        })) as Product[];
        
        const filteredProducts = allProducts.filter(product => 
          product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        return filteredProducts;
      } else {
        return productsData;
      }
    } catch (error) {
      // Log error for debugging
      console.error("Error searching local products:", error);
      return [];
    }
  };

  // Search medicines from the dataset using Firebase Realtime Database
  const searchMedicinesInDataset = async (searchTerm: string) => {
    try {
      // Fetch from Firebase Realtime Database
      const databaseRef = ref(rtdb, "indian_medicine_data");
      const snapshot = await get(databaseRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Data is already an array
        const medicinesArray: IndianMedicine[] = data;
        
        // Filter medicines based on search term
        const filtered = medicinesArray.filter(med => 
          med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          med.manufacturer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (med.short_composition1 && med.short_composition1.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        return filtered.slice(0, 50); // Limit to 50 results
      } else {
        console.error("No data available in Realtime Database");
        return [];
      }
    } catch (error) {
      // Log error for debugging
      console.error("Error fetching medicines from Realtime Database:", error);
      return [];
    }
  };

  // Main search function that handles both local and dataset search automatically
  const searchMedicines = async () => {
    if (!searchTerm.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setLoading(true);
    setSearchPerformed(true);
    setCurrentPage(1);
    
    try {
      // Search both local database and dataset simultaneously
      const [localResults, datasetResults] = await Promise.all([
        searchLocalProducts(searchTerm),
        searchMedicinesInDataset(searchTerm)
      ]);
      
      // Set both sets of results
      setLocalProducts(localResults);
      setMedicines(datasetResults);
      
      // Show appropriate toast messages
      if (localResults.length > 0 && datasetResults.length > 0) {
        toast.success(`Found ${localResults.length} existing product(s) in your inventory and ${datasetResults.length} medicine(s) in the dataset`);
      } else if (localResults.length > 0) {
        toast.success(`Found ${localResults.length} existing product(s) in your inventory`);
      } else if (datasetResults.length > 0) {
        toast.success(`Found ${datasetResults.length} medicine(s) in the dataset`);
      } else {
        toast.info("No medicines found in either your inventory or the dataset");
      }
    } catch (error) {
      // Log error for debugging
      console.error("Error during search:", error);
      toast.error("An error occurred during search. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Prepopulate form with selected medicine data and open dialog
  const selectMedicine = (medicine: IndianMedicine) => {
    setSelectedMedicine(medicine);
    setSelectedLocalProduct(null);
    
    // Prepopulate form data
    setFormData({
      name: medicine.name,
      category_id: "", // Changed to empty string for default "Select" option
      description: `Manufactured by ${medicine.manufacturer_name}. Pack size: ${medicine.pack_size_label}.`,
      uses: `Type: ${medicine.type}`,
      composition: `${medicine.short_composition1}${medicine.short_composition2 ? `, ${medicine.short_composition2}` : ""}`,
      original_price: medicine["price(₹)"],
      image_url: "",
      in_stock: medicine.Is_discontinued === "FALSE",
      stock_quantity: 10,
      discount_percentage: medicine.discount_percentage || "",
    });
    
    // Open the dialog
    setIsDialogOpen(true);
  };

  // Prepopulate form with selected local product data and open dialog
  const selectLocalProduct = (product: Product) => {
    setSelectedLocalProduct(product);
    setSelectedMedicine(null);
    
    // Prepopulate form data with existing product info
    setFormData({
      name: product.name,
      category_id: product.category_id || "", // Changed to empty string for default "Select" option
      description: product.description || "",
      uses: product.uses || "",
      composition: product.composition || "",
      original_price: product.original_price.toString(),
      image_url: product.image_url || "",
      in_stock: product.in_stock,
      stock_quantity: product.stock_quantity || 10,
      discount_percentage: product.discount_percentage || "",
    });
    
    // Open the dialog
    setIsDialogOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (field: keyof ProductFormData, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate form data
  const validateFormData = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) {
      errors.push("Product name is required");
    }
    
    if (!formData.category_id) {
      errors.push("Category is required");
    }
    
    if (!formData.original_price || parseFloat(formData.original_price) <= 0) {
      errors.push("Valid original price is required");
    }
    
    // Check for any missing fields that might be important
    if (!formData.composition.trim()) {
      errors.push("Composition field is empty - please fill in");
    }
    
    if (!formData.uses.trim()) {
      errors.push("Uses field is empty - please fill in");
    }
    
    return errors;
  };

  // Add medicine to Firestore
  const addMedicineToStore = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const errors = validateFormData();
    
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }
    
    try {
      // Check if this is a new medicine being added manually (not from the dataset)
      const isManualEntry = !selectedMedicine && !selectedLocalProduct;
      
      if (selectedLocalProduct) {
        // Update existing product
        const updateData: any = {
          name: formData.name,
          category_id: formData.category_id,
          description: formData.description,
          uses: formData.uses,
          composition: formData.composition,
          original_price: parseFloat(formData.original_price),
          image_url: formData.image_url || null,
          in_stock: formData.in_stock,
          stock_quantity: formData.stock_quantity,
          updated_at: new Date().toISOString()
        };
        
        // Only add discount_percentage if it has a value
        if (formData.discount_percentage && parseFloat(formData.discount_percentage) > 0) {
          updateData.discount_percentage = parseFloat(formData.discount_percentage);
        }
        
        await updateDoc(doc(db, "products", selectedLocalProduct.id), updateData);
        toast.success("Medicine updated successfully!");
        
        // Close the dialog after successful update
        setIsDialogOpen(false);
        // Reset form
        setFormData({
          name: "",
          category_id: "",
          description: "",
          uses: "",
          composition: "",
          original_price: "",
          image_url: "",
          in_stock: true,
          stock_quantity: 10,
          discount_percentage: "",
        });
        setSelectedLocalProduct(null);
        setSelectedMedicine(null);
      } else {
        // Add new product
        const productData: any = {
          name: formData.name,
          category_id: formData.category_id,
          description: formData.description,
          uses: formData.uses,
          composition: formData.composition,
          original_price: parseFloat(formData.original_price),
          image_url: formData.image_url || null,
          in_stock: formData.in_stock,
          stock_quantity: formData.stock_quantity,
          created_at: new Date().toISOString()
        };
        
        // Only add discount_percentage if it has a value
        if (formData.discount_percentage && parseFloat(formData.discount_percentage) > 0) {
          productData.discount_percentage = parseFloat(formData.discount_percentage);
        }
        
        await addDoc(collection(db, "products"), productData);
        toast.success("Medicine added successfully!");
        
        // If this is a manually entered medicine, add it to the Realtime Database as well
        if (isManualEntry) {
          try {
            // Fetch current data from Realtime Database
            const databaseRef = ref(rtdb, "indian_medicine_data");
            const snapshot = await get(databaseRef);
            let currentMedicines: IndianMedicine[] = [];
            
            if (snapshot.exists()) {
              currentMedicines = snapshot.val();
            }
            
            // Create new medicine entry with a unique ID
            const newMedicine: IndianMedicine = {
              id: `manual_${Date.now()}`, // Generate a unique ID for manual entries
              name: formData.name,
              "price(₹)": formData.original_price,
              Is_discontinued: "FALSE", // Assume it's not discontinued
              manufacturer_name: "Manually Added", // Mark as manually added
              type: "generic", // Default type for manual entries
              pack_size_label: "Varies", // Default packaging
              short_composition1: formData.composition || "Generic Composition", // Use composition from form
              short_composition2: "" // Leave empty
            };
            
            // Add the new medicine to the existing array
            const updatedMedicines = [...currentMedicines, newMedicine];
            
            // Update the Realtime Database with the new array
            await update(ref(rtdb, "indian_medicine_data"), { ".": updatedMedicines });
            
            toast.success("Medicine added to inventory and dataset successfully!");
          } catch (rtError: any) {
            // If adding to RTDB fails, still show success for Firestore
            console.error("Error adding medicine to Realtime Database:", rtError);
            // Don't throw error as the main function (adding to Firestore) succeeded
          }
        }
        
        // Close the dialog
        setIsDialogOpen(false);
        // Reset to first page
        setCurrentPage(1);
        // Reset form
        setFormData({
          name: "",
          category_id: "", // Changed to empty string for default "Select" option
          description: "",
          uses: "",
          composition: "",
          original_price: "",
          image_url: "",
          in_stock: true,
          stock_quantity: 10,
          discount_percentage: "",
        });
        setSelectedMedicine(null);
        setSelectedLocalProduct(null);
        // Clear search results
        setLocalProducts([]);
        setMedicines([]);
        setSearchPerformed(false);
      }
    } catch (error: any) {
      // Log error for debugging
      console.error("Error adding medicine:", error);
      toast.error(error.message || "Failed to add medicine");
    }
  };

  // Function to add a new category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    setAddingCategoryLoading(true);
    try {
      const docRef = await addDoc(collection(db, "categories"), {
        name: newCategoryName.trim(),
        created_at: new Date().toISOString()
      });

      // Add the new category to the categories list
      const newCategory = { id: docRef.id, name: newCategoryName.trim() };
      
      // Reset form and close add category mode
      setNewCategoryName("");
      setIsAddingCategory(false);
      
      // Set the new category as selected
      setFormData(prev => ({
        ...prev,
        category_id: docRef.id
      }));
      
      // Notify parent component to refresh categories
      if (onCategoriesChange) {
        onCategoriesChange();
      }
      
      toast.success("Category added successfully!");
    } catch (error: any) {
      // Log error for debugging
      console.error("Error adding category:", error);
      toast.error(error.message || "Failed to add category");
    } finally {
      setAddingCategoryLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-6 pt-4">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search medicines by name, manufacturer, or composition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchMedicines()}
              />
            </div>
            <Button onClick={searchMedicines} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span className="ml-2">Search</span>
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Search automatically checks your inventory first. If not found, it searches the Indian Medicine Dataset.
          </p>
        </div>

        {/* Local Products Results */}
        {localProducts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Existing Products in Your Inventory</h3>
            <div className="overflow-x-auto">
              <div className="min-w-full inline-block align-middle">
                <div className="border rounded-md">
                  <table className="min-w-full">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Product</th>
                        <th className="text-left p-3 text-sm font-medium">Category</th>
                        <th className="text-left p-3 text-sm font-medium">Price</th>
                        <th className="text-left p-3 text-sm font-medium">Stock</th>
                        <th className="text-left p-3 text-sm font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((product) => (
                        <tr 
                          key={product.id} 
                          className="border-b hover:bg-muted/50 cursor-pointer"
                          onClick={() => selectLocalProduct(product)}
                        >
                          <td className="p-3 text-sm font-medium">{product.name}</td>
                          <td className="p-3 text-sm">
                            {categories.find(cat => cat.id === product.category_id)?.name || "Uncategorized"}
                          </td>
                          <td className="p-3 text-sm">₹{product.original_price.toFixed(2)}</td>
                          <td className="p-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              product.in_stock 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}>
                              {product.stock_quantity || 0}
                            </span>
                          </td>
                          <td className="p-3 text-sm">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectLocalProduct(product);
                              }}
                            >
                              <span className="hidden sm:inline">{product.in_stock ? "Update Stock" : "Restock"}</span>
                              <span className="sm:hidden">Update</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Pagination Controls */}
            {localProducts.length > itemsPerPage && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, localProducts.length)} of {localProducts.length} results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  {/* Page Numbers */}
                  {[...Array(Math.ceil(localProducts.length / itemsPerPage)).keys()].map(page => (
                    <Button
                      key={page + 1}
                      variant={currentPage === page + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page + 1)}
                    >
                      {page + 1}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(localProducts.length / itemsPerPage)))}
                    disabled={currentPage === Math.ceil(localProducts.length / itemsPerPage)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Indian Medicine Dataset Results */}
        {medicines.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Search Results from Indian Medicine Dataset</h3>
            <div className="overflow-x-auto">
              <div className="min-w-full inline-block align-middle">
                <div className="border rounded-md">
                  <table className="min-w-full">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Medicine</th>
                        <th className="text-left p-3 text-sm font-medium">Manufacturer</th>
                        <th className="text-left p-3 text-sm font-medium">Price</th>
                        <th className="text-left p-3 text-sm font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicines.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((medicine) => (
                        <tr 
                          key={medicine.id} 
                          className="border-b hover:bg-muted/50 cursor-pointer"
                          onClick={() => selectMedicine(medicine)}
                        >
                          <td className="p-3 text-sm">{medicine.name}</td>
                          <td className="p-3 text-sm">{medicine.manufacturer_name}</td>
                          <td className="p-3 text-sm">₹{medicine["price(₹)"]}</td>
                          <td className="p-3 text-sm">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectMedicine(medicine);
                              }}
                            >
                              <span className="hidden sm:inline">Add to Inventory</span>
                              <span className="sm:hidden">Add</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Pagination Controls */}
            {medicines.length > itemsPerPage && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, medicines.length)} of {medicines.length} results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  {/* Page Numbers */}
                  {[...Array(Math.ceil(medicines.length / itemsPerPage)).keys()].map(page => (
                    <Button
                      key={page + 1}
                      variant={currentPage === page + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page + 1)}
                    >
                      {page + 1}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(medicines.length / itemsPerPage)))}
                    disabled={currentPage === Math.ceil(medicines.length / itemsPerPage)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setCurrentPage(1); // Reset to first page when dialog closes
            setIsAddingCategory(false); // Reset category adding mode
            setNewCategoryName(""); // Clear new category name
          }
        }}>
          <DialogContent className="sm:max-w-3xl h-full flex flex-col p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
              <DialogHeader className="relative z-10">
                <DialogTitle className="text-lg font-bold tracking-tight text-white">
                  {selectedLocalProduct 
                    ? "Update Existing Product" 
                    : "Add Medicine to Store"}
                </DialogTitle>
                <DialogDesc className="text-blue-100">
                  {selectedMedicine 
                    ? `Prepopulated from ${selectedMedicine.name}`
                    : selectedLocalProduct
                    ? `Updating ${selectedLocalProduct.name}`
                    : 'Add new medicine manually'}
                </DialogDesc>
              </DialogHeader>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 relative">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                opacity: 0.3
              }}></div>
              
              <div className="relative z-10">
                <div className="mb-4 p-3 bg-muted rounded-md">
                  <p className="text-sm">
                    <span className="font-medium">Note:</span> Fields marked with <span className="text-destructive">*</span> are required. 
                    Please ensure all required fields are filled before submitting.
                  </p>
                </div>
                <form onSubmit={addMedicineToStore} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name <span className="text-destructive">*</span></Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
                      
                      {/* Show category selector or add category form */}
                      {isAddingCategory ? (
                        <div className="flex gap-2">
                          <Input
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Enter category name"
                            className="flex-1"
                          />
                          <Button 
                            type="button" 
                            onClick={handleAddCategory}
                            disabled={addingCategoryLoading}
                          >
                            {addingCategoryLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Add"
                            )}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsAddingCategory(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Select 
                              value={formData.category_id} 
                              onValueChange={(value) => handleInputChange("category_id", value)}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsAddingCategory(true)}
                              className="shrink-0"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          {categories.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              No categories available. Add a category to continue.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

              {/* Hidden fields - kept for internal use but not shown in UI */}
              <input 
                type="hidden" 
                value={formData.description} 
                onChange={(e) => handleInputChange("description", e.target.value)} 
              />
              <input 
                type="hidden" 
                value={formData.image_url} 
                onChange={(e) => handleInputChange("image_url", e.target.value)} 
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="uses">Uses <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="uses"
                    value={formData.uses}
                    onChange={(e) => handleInputChange("uses", e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="composition">Composition <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="composition"
                    value={formData.composition}
                    onChange={(e) => handleInputChange("composition", e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Original Price (₹) <span className="text-destructive">*</span></Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.original_price}
                    onChange={(e) => handleInputChange("original_price", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount Percentage (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.discount_percentage}
                    onChange={(e) => handleInputChange("discount_percentage", e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave blank to use default discount from settings
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="in_stock"
                    checked={formData.in_stock}
                    onChange={(e) => handleInputChange("in_stock", e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="in_stock">In Stock</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor="stock_quantity">Stock Quantity</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => handleInputChange("stock_quantity", parseInt(e.target.value) || 0)}
                    className="w-24"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit">
                  {selectedLocalProduct ? "Update Product" : "Add to Store"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setSelectedMedicine(null);
                    setSelectedLocalProduct(null);
                    setFormData({
                      name: "",
                      category_id: "", // Changed to empty string for default "Select" option
                      description: "",
                      uses: "",
                      composition: "",
                      original_price: "",
                      image_url: "",
                      in_stock: true,
                      stock_quantity: 10,
                      discount_percentage: "",
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

        {searchPerformed && localProducts.length === 0 && medicines.length === 0 && !loading && (
          <div className="text-center py-8">
            <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No medicines found</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't find any medicines matching "{searchTerm}" in your inventory or the dataset.
            </p>
            <Button 
              onClick={() => {
                // Prepopulate form with search term as medicine name only
                setFormData({
                  name: searchTerm,
                  category_id: "", // Changed to empty string for default "Select" option
                  description: "",
                  uses: "",
                  composition: "",
                  original_price: "",
                  image_url: "",
                  in_stock: true,
                  stock_quantity: 10,
                });
                // Clear search term to hide this message
                setSearchTerm("");
                // Set selected medicine to null for manual entry
                setSelectedMedicine(null);
                setSelectedLocalProduct(null);
                // Open the dialog
                setIsDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add "{searchTerm}" Manually
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};