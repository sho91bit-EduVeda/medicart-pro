import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { db } from "@/integrations/firebase/config";
import { writeBatch, collection, doc } from "firebase/firestore";

interface ExcelUploadProps {
  onSuccess?: () => void;
}

interface ProductRow {
  name: string;
  category_id?: string;
  description?: string;
  uses?: string;
  side_effects?: string;
  composition?: string;
  original_price: number;
  image_url?: string;
  in_stock: boolean;
}

export const ExcelUpload = ({ onSuccess }: ExcelUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const parseExcelFile = (file: File): Promise<ProductRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData: unknown[] = XLSX.utils.sheet_to_json(worksheet);

          const products: ProductRow[] = jsonData.map((row: any) => ({
            name: row.name || row.Name || row.product_name || row["Product Name"],
            category_id: row.category_id || row.CategoryID || null,
            description: row.description || row.Description || null,
            uses: row.uses || row.Uses || null,
            side_effects: row.side_effects || row.SideEffects || row["Side Effects"] || null,
            composition: row.composition || row.Composition || null,
            original_price: parseFloat(row.original_price || row.price || row.Price || 0),
            image_url: row.image_url || row.ImageURL || row["Image URL"] || null,
            in_stock: row.in_stock !== undefined
              ? Boolean(row.in_stock)
              : (row.InStock !== undefined ? Boolean(row.InStock) : true),
          }));

          resolve(products);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsBinaryString(file);
    });
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setUploading(true);

    try {
      const products = await parseExcelFile(file);

      if (products.length === 0) {
        toast.error("No valid products found in the file");
        return;
      }

      // Validate required fields
      const invalidProducts = products.filter(p => !p.name || !p.original_price || p.original_price <= 0);
      if (invalidProducts.length > 0) {
        toast.error(`${invalidProducts.length} products are missing required fields (name, price)`);
        return;
      }

      // Bulk insert products using batch
      const batch = writeBatch(db);

      products.forEach(product => {
        const docRef = doc(collection(db, "products"));
        batch.set(docRef, {
          ...product,
          created_at: new Date().toISOString()
        });
      });

      await batch.commit();

      toast.success(`Successfully added ${products.length} products!`);
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById("excel-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      onSuccess?.();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload products");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: "Paracetamol 500mg",
        category_id: "CATEGORY_ID_HERE", // Required field
        description: "Pain relief and fever reducer",
        uses: "For headache, fever, and body pain",
        side_effects: "Nausea, allergic reactions (rare)",
        composition: "Paracetamol 500mg",
        original_price: 50.00,
        image_url: "",
        in_stock: true,
      },
      {
        name: "Amoxicillin 250mg",
        category_id: "CATEGORY_ID_HERE", // Required field
        description: "Antibiotic for bacterial infections",
        uses: "Treats various bacterial infections",
        side_effects: "Diarrhea, nausea, rash",
        composition: "Amoxicillin 250mg",
        original_price: 120.00,
        image_url: "",
        in_stock: true,
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, "product_upload_template.xlsx");

    toast.success("Template downloaded! Remember to replace CATEGORY_ID_HERE with actual category IDs.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Bulk Upload Products
        </CardTitle>
        <CardDescription>
          Upload an Excel file to add multiple products at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm">Required: name, original_price, category_id</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm">Optional: description, uses, side_effects, composition, image_url, in_stock</span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={downloadTemplate}
          className="w-full"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Download Template
        </Button>

        <div className="space-y-2">
          <input
            id="excel-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-muted-foreground
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-primary-foreground
              hover:file:bg-primary/90
              cursor-pointer"
          />
          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              {file.name}
            </div>
          )}
        </div>

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? (
            "Uploading..."
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Products
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
