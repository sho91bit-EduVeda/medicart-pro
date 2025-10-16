import { useFeatureFlags } from "../hooks/useFeatureFlags"
import { Card } from "./ui/card"
import { ScrollArea } from "./ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { X } from "lucide-react"

interface Product {
  id: string
  name: string
  brand: string
  price: number
  prescriptionRequired: boolean
  medicineType: string
  expiryDate: string
  composition: string
  sideEffects: string[]
  usages: string[]
}

interface ProductComparisonProps {
  products: Product[]
  onRemoveProduct: (productId: string) => void
}

export function ProductComparison({ products, onRemoveProduct }: ProductComparisonProps) {
  const { productComparison } = useFeatureFlags()

  if (!productComparison || products.length === 0) return null

  return (
    <Card className="p-4">
      <h3 className="text-xl font-semibold mb-4">Product Comparison</h3>
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Features</TableHead>
              {products.map((product) => (
                <TableHead key={product.id} className="min-w-[200px]">
                  <div className="flex justify-between items-center">
                    {product.name}
                    <button
                      onClick={() => onRemoveProduct(product.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Brand</TableCell>
              {products.map((product) => (
                <TableCell key={product.id}>{product.brand}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Price</TableCell>
              {products.map((product) => (
                <TableCell key={product.id}>₹{product.price}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Prescription Required</TableCell>
              {products.map((product) => (
                <TableCell key={product.id}>
                  {product.prescriptionRequired ? "Yes" : "No"}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Medicine Type</TableCell>
              {products.map((product) => (
                <TableCell key={product.id}>{product.medicineType}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Expiry Date</TableCell>
              {products.map((product) => (
                <TableCell key={product.id}>{product.expiryDate}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Composition</TableCell>
              {products.map((product) => (
                <TableCell key={product.id}>{product.composition}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Side Effects</TableCell>
              {products.map((product) => (
                <TableCell key={product.id}>
                  <ul className="list-disc list-inside">
                    {product.sideEffects.map((effect, index) => (
                      <li key={index}>{effect}</li>
                    ))}
                  </ul>
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Uses</TableCell>
              {products.map((product) => (
                <TableCell key={product.id}>
                  <ul className="list-disc list-inside">
                    {product.usages.map((usage, index) => (
                      <li key={index}>{usage}</li>
                    ))}
                  </ul>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  )
}