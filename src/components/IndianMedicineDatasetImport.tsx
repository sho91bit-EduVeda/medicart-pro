import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { db } from "@/integrations/firebase/config";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { Search, Download, Database, Loader2 } from "lucide-react";

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

interface ProductFormData {
  name: string;
  category_id: string;
  description: string;
  uses: string;
  side_effects: string;
  composition: string;
  original_price: string;
  image_url: string;
  in_stock: boolean;
  stock_quantity: number;
}

interface Category {
  id: string;
  name: string;
}

interface IndianMedicineDatasetImportProps {
  categories: Category[];
}

export const IndianMedicineDatasetImport = ({ categories }: IndianMedicineDatasetImportProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [medicines, setMedicines] = useState<IndianMedicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<IndianMedicine | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    category_id: categories.length > 0 ? categories[0].id : "",
    description: "",
    uses: "",
    side_effects: "",
    composition: "",
    original_price: "",
    image_url: "",
    in_stock: true,
    stock_quantity: 10,
  });

  // Update form when categories change
  useEffect(() => {
    if (categories.length > 0 && !formData.category_id) {
      setFormData(prev => ({
        ...prev,
        category_id: categories[0].id
      }));
    }
  }, [categories]);

  // Search medicines from the dataset
  const searchMedicines = async () => {
    if (!searchTerm.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("https://raw.githubusercontent.com/junioralive/Indian-Medicine-Dataset/main/DATA/indian_medicine_data.json");
      const data: IndianMedicine[] = await response.json();
      
      // Filter medicines based on search term
      const filtered = data.filter(med => 
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.manufacturer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (med.short_composition1 && med.short_composition1.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      setMedicines(filtered.slice(0, 50)); // Limit to 50 results
      toast.success(`Found ${filtered.length} medicines`);
    } catch (error) {
      console.error("Error fetching medicines:", error);
      toast.error("Failed to fetch medicines from dataset. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  // Prepopulate form with selected medicine data
  const selectMedicine = (medicine: IndianMedicine) => {
    setSelectedMedicine(medicine);
    
    // Prepopulate form data
    setFormData({
      name: medicine.name,
      category_id: categories.length > 0 ? categories[0].id : "",
      description: `Manufactured by ${medicine.manufacturer_name}. Pack size: ${medicine.pack_size_label}.`,
      uses: `Type: ${medicine.type}`,
      side_effects: "Please consult package insert for side effects",
      composition: `${medicine.short_composition1}${medicine.short_composition2 ? `, ${medicine.short_composition2}` : ""}`,
      original_price: medicine["price(₹)"],
      image_url: "",
      in_stock: medicine.Is_discontinued === "FALSE",
      stock_quantity: 10,
    });
  };

  // Handle form input changes
  const handleInputChange = (field: keyof ProductFormData, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add medicine to Firestore
  const addMedicineToStore = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    
    if (!formData.category_id) {
      toast.error("Category is required");
      return;
    }
    
    if (!formData.original_price || parseFloat(formData.original_price) <= 0) {
      toast.error("Valid original price is required");
      return;
    }

    try {
      await addDoc(collection(db, "products"), {
        name: formData.name,
        category_id: formData.category_id,
        description: formData.description,
        uses: formData.uses,
        side_effects: formData.side_effects,
        composition: formData.composition,
        original_price: parseFloat(formData.original_price),
        image_url: formData.image_url || null,
        in_stock: formData.in_stock,
        stock_quantity: formData.stock_quantity,
        created_at: new Date().toISOString()
      });

      toast.success("Medicine added successfully!");
      // Reset form
      setFormData({
        name: "",
        category_id: categories.length > 0 ? categories[0].id : "",
        description: "",
        uses: "",
        side_effects: "",
        composition: "",
        original_price: "",
        image_url: "",
        in_stock: true,
        stock_quantity: 10,
      });
      setSelectedMedicine(null);
    } catch (error: any) {
      console.error("Error adding medicine:", error);
      toast.error(error.message || "Failed to add medicine");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Indian Medicine Dataset Import
        </CardTitle>
        <CardDescription>
          Search and import medicines from the Indian Medicine Dataset
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
            Search the Indian Medicine Dataset containing over 250,000 medicines
          </p>
        </div>

        {medicines.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Search Results</h3>
            <div className="max-h-96 overflow-y-auto border rounded-md">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Medicine</th>
                    <th className="text-left p-3 text-sm font-medium">Manufacturer</th>
                    <th className="text-left p-3 text-sm font-medium">Price</th>
                    <th className="text-left p-3 text-sm font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((medicine) => (
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
                          Select
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedMedicine && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-lg">Add Medicine to Store</CardTitle>
              <CardDescription>
                Prepopulated from {selectedMedicine.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={addMedicineToStore} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
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
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="uses">Uses</Label>
                    <Textarea
                      id="uses"
                      value={formData.uses}
                      onChange={(e) => handleInputChange("uses", e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="composition">Composition</Label>
                    <Textarea
                      id="composition"
                      value={formData.composition}
                      onChange={(e) => handleInputChange("composition", e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="side_effects">Side Effects</Label>
                  <Textarea
                    id="side_effects"
                    value={formData.side_effects}
                    onChange={(e) => handleInputChange("side_effects", e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Original Price (₹) *</Label>
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
                    <Label htmlFor="image">Image URL</Label>
                    <Input
                      id="image"
                      value={formData.image_url}
                      onChange={(e) => handleInputChange("image_url", e.target.value)}
                      placeholder="https://..."
                    />
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
                    Add to Store
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setSelectedMedicine(null);
                      setFormData({
                        name: "",
                        category_id: categories.length > 0 ? categories[0].id : "",
                        description: "",
                        uses: "",
                        side_effects: "",
                        composition: "",
                        original_price: "",
                        image_url: "",
                        in_stock: true,
                        stock_quantity: 10,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {medicines.length === 0 && !loading && searchTerm && (
          <div className="text-center py-8">
            <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No medicines found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search term
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};