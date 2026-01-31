import { useState, useEffect } from "react";
import { db } from "@/integrations/firebase/config";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchableProductDropdown } from "@/components/product/SearchableProductDropdown";
import { Pencil, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Product {
  id: string;
  name: string;
  original_price: number;
  stock_quantity: number;
  // Add other product properties as needed
}

interface SelectedProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

const ProductSelectorTable = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(1);

  // Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, "products"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any),
        })) as Product[];
        setProducts(productsData);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };

    fetchProducts();
  }, []);

  // Handle product selection from dropdown
  const handleProductSelect = (productName: string, price?: number) => {
    // Find the product by name (case-insensitive)
    const product = products.find(p => p.name.toLowerCase() === productName.toLowerCase());
    
    if (product) {
      // Check if product is already selected (case-insensitive)
      const existingProduct = selectedProducts.find(p => p.name.toLowerCase() === productName.toLowerCase());
      
      if (existingProduct) {
        // If already selected, increase quantity by 1
        const updatedProducts = selectedProducts.map(p => 
          p.name.toLowerCase() === productName.toLowerCase() 
            ? { 
                ...p, 
                quantity: p.quantity + 1,
                totalPrice: p.price * (p.quantity + 1)
              } 
            : p
        );
        setSelectedProducts(updatedProducts);
      } else {
        // Add new product with quantity 1
        const newProduct: SelectedProduct = {
          id: product.id,
          name: product.name,
          price: price || product.original_price,
          quantity: 1,
          totalPrice: price || product.original_price
        };
        setSelectedProducts([...selectedProducts, newProduct]);
      }
    }
  };

  // Remove product from selection
  const handleRemoveProduct = (productName: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.name !== productName));
    if (editingProductId === productName) {
      setEditingProductId(null);
    }
  };

  // Start editing quantity
  const handleEditProduct = (product: SelectedProduct) => {
    setEditingProductId(product.name);
    setEditQuantity(product.quantity);
  };

  // Save edited quantity
  const handleSaveEdit = (productName: string) => {
    const updatedProducts = selectedProducts.map(p => {
      if (p.name === productName) {
        const newTotal = p.price * editQuantity;
        return {
          ...p,
          quantity: editQuantity,
          totalPrice: newTotal
        };
      }
      return p;
    });
    setSelectedProducts(updatedProducts);
    setEditingProductId(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingProductId(null);
  };

  return (
    <div className="space-y-6">
      {/* Product Selector */}
      <div className="space-y-2">
        <Label>Select Product</Label>
        <SearchableProductDropdown
          value=""
          onValueChange={handleProductSelect}
          placeholder="Search and select a product..."
        />
      </div>

      {/* Selected Products Table */}
      {selectedProducts.length > 0 && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedProducts.map((product) => (
                <TableRow key={product.name}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>₹{product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    {editingProductId === product.name ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-20"
                        />
                        <Button 
                          size="sm" 
                          onClick={() => handleSaveEdit(product.name)}
                          variant="outline"
                        >
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleCancelEdit}
                          variant="ghost"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <span>{product.quantity}</span>
                    )}
                  </TableCell>
                  <TableCell>₹{product.totalPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    {editingProductId !== product.name && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveProduct(product.name)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell>
                  ₹{selectedProducts.reduce((sum, product) => sum + product.totalPrice, 0).toFixed(2)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ProductSelectorTable;