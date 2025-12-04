import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ProductSelectorTable from "@/components/ProductSelectorTable";

const ProductSelectorDemo = () => {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Product Selector Demo</CardTitle>
          <CardDescription>
            Search and select products to see them appear in the table below with edit/remove functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductSelectorTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductSelectorDemo;