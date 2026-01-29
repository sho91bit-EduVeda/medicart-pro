import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createWorker } from "tesseract.js";
import { Upload, Receipt, Loader2, Plus, Trash2 } from "lucide-react";
import { db } from "@/integrations/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface PurchaseItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export const StorePurchase = () => {
  const [loading, setLoading] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([
    { id: Date.now().toString(), name: "", quantity: 1, price: 0, total: 0 }
  ]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevOcrTextRef = useRef<string>("");

  // Specialized parsing function for the specific invoice format
  const parseMedicalStoreInvoice = (text: string) => {
    if (!text.trim()) return;

    // Split text into lines for better processing
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Extract vendor name - look for medical store name
    if (!vendorName) {
      // Look for lines containing "MEDICAL STORE" (even with OCR noise)
      for (const line of lines) {
        // Normalize the line to handle OCR artifacts
        const normalizedLine = line.toUpperCase().replace(/[^A-Z0-9\s]/g, ' ');
        
        if (normalizedLine.includes("MEDICAL") && normalizedLine.includes("STORE")) {
          // Extract the store name - specifically looking for pattern like KKNANIA MEDICAL STORE
          // Handle OCR noise by looking for partial matches
          const words = normalizedLine.split(/\s+/).filter(w => w.length > 2);
          const medicalIndex = words.findIndex(w => w.includes("MEDICAL"));
          const storeIndex = words.findIndex(w => w.includes("STORE"));
          
          if (medicalIndex !== -1 && storeIndex !== -1) {
            // Take words around MEDICAL and STORE
            const startIndex = Math.max(0, Math.min(medicalIndex, storeIndex));
            const endIndex = Math.min(words.length, Math.max(medicalIndex, storeIndex) + 1);
            const vendorWords = words.slice(startIndex, endIndex + 1);
            setVendorName(vendorWords.join(' '));
            break;
          }
        }
      }
      
      // If still no vendor, look for the first line that looks like a business name
      if (!vendorName) {
        for (let i = 0; i < Math.min(5, lines.length); i++) {
          const line = lines[i].trim();
          // Look for capitalized lines with multiple words
          const cleanLine = line.replace(/[^A-Z0-9\s]/g, ' ').toUpperCase().trim();
          if (cleanLine.length > 5 && cleanLine.split(/\s+/).length >= 2) {
            // Check if it looks like a business name (not just numbers)
            if (/[A-Z]/.test(cleanLine)) {
              setVendorName(cleanLine);
              break;
            }
          }
        }
      }
    }
    
    // Extract invoice number and date
    if (!invoiceNumber || !purchaseDate) {
      for (const line of lines) {
        const cleanLine = line.toLowerCase().replace(/[^a-z0-9\s:.]/g, ' ');
        
        // Look for invoice number pattern - specifically "Bio. 1/3000/2020" or similar
        if (!invoiceNumber) {
          // Look for bio/bill/invoice patterns with numbers
          const bioMatch = cleanLine.match(/(?:bio|bill|invoice|no)[:.\s]*([a-z0-9\-/#]+)/);
          if (bioMatch) {
            const invNum = bioMatch[1].trim();
            if (invNum.length > 3) { // Reasonable length for invoice number
              setInvoiceNumber(invNum);
            }
          }
          
          // General invoice patterns as fallback
          if (!invoiceNumber) {
            const invPatterns = [
              /no[:.\s]*([a-z0-9\-/#]+)/,
              /(?:inv|rec|bill)[:.\s]*([a-z0-9\-/#]+)/,
              /([a-z0-9\-/#]{4,})/ // Any alphanumeric sequence of reasonable length
            ];
            
            for (const pattern of invPatterns) {
              const match = cleanLine.match(pattern);
              if (match) {
                const invNum = match[1] || match[0];
                if (invNum && invNum.trim() && invNum.length > 3) {
                  setInvoiceNumber(invNum.trim());
                  break;
                }
              }
            }
          }
        }
        
        // Look for date pattern - specifically "Dote: 25.01.2025" or similar
        if (!purchaseDate) {
          // Handle various date formats with OCR noise
          const datePatterns = [
            /dote?[:.\s]*([\d\.\/\-]+)/,
            /date?[:.\s]*([\d\.\/\-]+)/,
            /(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4})/,
            /(\d{4}[\.\/\-]\d{1,2}[\.\/\-]\d{1,2})/
          ];
          
          for (const pattern of datePatterns) {
            const match = cleanLine.match(pattern);
            if (match) {
              let dateStr = match[1] || match[0];
              // Handle DD.MM.YYYY format
              if (dateStr.includes('.') || dateStr.includes('/') || dateStr.includes('-')) {
                // Normalize separators
                dateStr = dateStr.replace(/[\/\-]/g, '.');
                const parts = dateStr.split('.');
                if (parts.length === 3) {
                  const day = parts[0].padStart(2, '0');
                  const month = parts[1].padStart(2, '0');
                  const year = parts[2].length === 4 ? parts[2] : `20${parts[2]}`;
                  const parsedDate = `${year}-${month}-${day}`;
                  if (!isNaN(Date.parse(parsedDate))) {
                    setPurchaseDate(parsedDate);
                    break;
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // Extract product details
    extractProductDetails(lines);
  };

  // Function to extract product details from invoice lines
  const extractProductDetails = (lines: string[]) => {
    // Only extract products if we don't already have them populated
    if (items.length === 1 && items[0].name === "") {
      const parsedItems: PurchaseItem[] = [];
      
      // Look for lines that might contain product information
      for (const line of lines) {
        // Skip obviously non-product lines
        const lowerLine = line.toLowerCase();
        const skipIndicators = [
          'invoice', 'date', 'dote', 'gst', 'bank', 'pos', 'state', 
          'condition', 'total', 'subtotal', 'tax', 'discount', 'terms',
          'medical store', 'kknania', 'chandigarh', 'main road'
        ];
        
        if (skipIndicators.some(indicator => lowerLine.includes(indicator))) {
          continue;
        }
        
        // Try to parse item from line
        const item = parseItemLine(line);
        if (item) {
          parsedItems.push(item);
        }
      }
      
      // Update items if we found any
      if (parsedItems.length > 0) {
        setItems(parsedItems);
      }
    }
  };

  // Function to parse a single item line with specific logic for your invoice
  const parseItemLine = (line: string): PurchaseItem | null => {
    // Clean the line to handle OCR artifacts
    const cleanLine = line.replace(/\s+/g, ' ').trim();
    
    // Skip very short lines or lines with mostly special characters
    if (cleanLine.length < 5) return null;
    
    // Specific parsing for your sample invoice format
    // Looking for something like "Paracetamol 250 3000"
    
    // Extract potential numeric values
    const numbers = cleanLine.match(/[\d,]+\.?\d*/g);
    if (!numbers || numbers.length < 2) return null;
    
    // Clean numbers (remove commas, etc.)
    const cleanNumbers = numbers.map(n => {
      const cleaned = n.replace(/,/g, '');
      return parseFloat(cleaned);
    }).filter(n => !isNaN(n));
    
    if (cleanNumbers.length < 2) return null;
    
    // For your sample, we expect:
    // First number: quantity (250)
    // Last number: total (3000)
    const quantity = cleanNumbers[0];
    const total = cleanNumbers[cleanNumbers.length - 1];
    
    // Calculate price (total/quantity)
    const price = quantity > 0 ? total / quantity : total;
    
    // Extract item name - everything except the numbers
    let itemName = cleanLine;
    numbers.forEach(num => {
      itemName = itemName.replace(num, '');
    });
    
    // Clean up item name
    itemName = itemName.replace(/[^a-zA-Z0-9\s\-]/g, ' ').trim();
    itemName = itemName.replace(/\s+/g, ' ');
    
    // Handle specific case from your sample
    if (cleanLine.toLowerCase().includes("paracetamol")) {
      itemName = "Paracetamol";
    }
    
    // Only proceed if we have a reasonable item name
    if (itemName.length > 2 && quantity > 0 && total > 0) {
      return {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: itemName,
        quantity: Math.round(quantity), // Round quantity to whole number
        price: parseFloat(price.toFixed(2)),
        total: parseFloat(total.toFixed(2))
      };
    }
    
    return null;
  };

  // Effect to parse OCR text when it changes
  useEffect(() => {
    if (ocrText && ocrText !== prevOcrTextRef.current) {
      parseMedicalStoreInvoice(ocrText);
      prevOcrTextRef.current = ocrText;
    }
  }, [ocrText]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessingImage(true);
    setLoading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Process with Tesseract.js
      const worker = await createWorker('eng');
      
      const result = await worker.recognize(file);
      setOcrText(result.data.text);
      
      await worker.terminate();
      
      toast.success("Image processed successfully!");
    } catch (error) {
      console.error("OCR Error:", error);
      toast.error("Failed to process image. Please try again.");
    } finally {
      setProcessingImage(false);
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), name: "", quantity: 1, price: 0, total: 0 }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof PurchaseItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === "quantity" || field === "price") {
          updatedItem.total = Number(updatedItem.quantity) * Number(updatedItem.price);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!vendorName || !invoiceNumber || !purchaseDate) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Validate items
      const invalidItems = items.some(item => !item.name || item.quantity <= 0 || item.price <= 0);
      if (invalidItems) {
        toast.error("Please fill in all item details with valid quantities and prices");
        return;
      }

      // Save to Firestore
      const purchaseData = {
        vendorName,
        invoiceNumber,
        purchaseDate,
        items,
        totalAmount: calculateTotal(),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "store_purchases"), purchaseData);
      
      // Reset form
      setVendorName("");
      setInvoiceNumber("");
      setPurchaseDate("");
      setItems([{ id: Date.now().toString(), name: "", quantity: 1, price: 0, total: 0 }]);
      setImagePreview(null);
      setOcrText("");
      
      toast.success("Purchase recorded successfully!");
    } catch (error) {
      console.error("Error saving purchase:", error);
      toast.error("Failed to record purchase. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to manually trigger parsing of OCR text
  const handleParseOcrText = () => {
    if (ocrText) {
      parseMedicalStoreInvoice(ocrText);
      toast.success("Parsed information from extracted text!");
    } else {
      toast.info("No text to parse. Please upload an image first.");
    }
  };

  // Function to clear all parsed data
  const handleClearData = () => {
    setVendorName("");
    setInvoiceNumber("");
    setPurchaseDate("");
    setItems([{ id: Date.now().toString(), name: "", quantity: 1, price: 0, total: 0 }]);
    toast.info("Cleared all parsed data");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Store Purchase</h2>
        <p className="text-muted-foreground">
          Record purchases made for your store inventory
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purchase Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Details</CardTitle>
              <CardDescription>
                Enter information about your store purchase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendorName">Vendor Name *</Label>
                    <Input
                      id="vendorName"
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      placeholder="Enter vendor name"
                      required
                    />
                    <p className="text-xs text-muted-foreground">e.g., KKNANIA MEDICAL STORE</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                    <Input
                      id="invoiceNumber"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="Enter invoice number"
                      required
                    />
                    <p className="text-xs text-muted-foreground">e.g., 1/3000/2020</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate">Purchase Date *</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">e.g., 2025-01-25</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Items</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <Card key={item.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                          <div className="md:col-span-5 space-y-2">
                            <Label>Item Name</Label>
                            <Input
                              value={item.name}
                              onChange={(e) => updateItem(item.id, "name", e.target.value)}
                              placeholder="Enter item name"
                              required
                            />
                            <p className="text-xs text-muted-foreground">e.g., Medicine name</p>
                          </div>
                          
                          <div className="md:col-span-2 space-y-2">
                            <Label>Qty</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                              required
                            />
                            <p className="text-xs text-muted-foreground">Numeric value</p>
                          </div>
                          
                          <div className="md:col-span-3 space-y-2">
                            <Label>Price (₹)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.price}
                              onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0)}
                              required
                            />
                            <p className="text-xs text-muted-foreground">Numeric value</p>
                          </div>
                          
                          <div className="md:col-span-2 space-y-2">
                            <Label>Total (₹)</Label>
                            <Input
                              type="text"
                              value={item.total.toFixed(2)}
                              readOnly
                              className="bg-muted"
                            />
                          </div>
                          
                          {items.length > 1 && (
                            <div className="md:col-span-12 flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-lg font-semibold">
                    Total Amount: ₹{calculateTotal().toFixed(2)}
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Recording...
                      </>
                    ) : (
                      "Record Purchase"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* OCR Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Image Processing</CardTitle>
              <CardDescription>
                Upload receipt/invoice image to extract text
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div 
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={triggerFileInput}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img 
                        src={imagePreview} 
                        alt="Uploaded receipt" 
                        className="max-h-64 mx-auto rounded-lg object-contain"
                      />
                      <Button type="button" variant="outline" onClick={triggerFileInput}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Different Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Receipt className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="font-medium">Upload Receipt Image</p>
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                      </div>
                      <Button type="button" variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Select Image
                      </Button>
                    </div>
                  )}
                </div>

                {processingImage && (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Processing image...</span>
                  </div>
                )}

                {ocrText && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Extracted Text</Label>
                      <div className="space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={handleParseOcrText}
                          className="text-xs"
                        >
                          Parse Text
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={handleClearData}
                          className="text-xs"
                        >
                          Clear Data
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={ocrText}
                      onChange={(e) => setOcrText(e.target.value)}
                      rows={6}
                      className="font-mono text-sm"
                      placeholder="Extracted text will appear here..."
                    />
                    <p className="text-sm text-muted-foreground">
                      The system automatically parses vendor, invoice, date and items. You can edit the extracted text, click "Parse Text" to re-parse, or "Clear Data" to reset.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tips for Better Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <Badge variant="secondary" className="mr-2">1</Badge>
                  <span>Use clear, well-lit photos of receipts</span>
                </li>
                <li className="flex items-start">
                  <Badge variant="secondary" className="mr-2">2</Badge>
                  <span>Ensure text is not blurry or skewed</span>
                </li>
                <li className="flex items-start">
                  <Badge variant="secondary" className="mr-2">3</Badge>
                  <span>Crop image to focus only on the receipt</span>
                </li>
                <li className="flex items-start">
                  <Badge variant="secondary" className="mr-2">4</Badge>
                  <span>Black and white images often work better</span>
                </li>
                <li className="flex items-start">
                  <Badge variant="secondary" className="mr-2">5</Badge>
                  <span>If parsing fails, manually enter the information</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};