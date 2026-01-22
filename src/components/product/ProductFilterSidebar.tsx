import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Filter as FilterIcon } from "lucide-react";

interface Product {
  id: string;
  name: string;
  original_price: number;
  category_id: string;
  in_stock: boolean;
  discount_percentage?: number;
}

interface Category {
  id: string;
  name: string;
}

interface FilterOptions {
  priceRange: [number, number];
  categories: string[];
  stockStatus: 'all' | 'in-stock' | 'out-of-stock';
  onSale: boolean;
}

interface ProductFilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onFilterChange: (filters: FilterOptions) => void;
  products: Product[];
  categories: Category[];
  currentFilters: FilterOptions;
}

export function ProductFilterSidebar({
  isOpen,
  onClose,
  onFilterChange,
  products,
  categories,
  currentFilters
}: ProductFilterSidebarProps) {
  const [filters, setFilters] = useState<FilterOptions>({ ...currentFilters });
  
  // Calculate min/max prices from products
  const minPrice = Math.min(...products.map(p => p.original_price));
  const maxPrice = Math.max(...products.map(p => p.original_price));

  useEffect(() => {
    setFilters({ ...currentFilters });
  }, [currentFilters]);

  const handlePriceChange = (value: number[]) => {
    setFilters(prev => ({
      ...prev,
      priceRange: [value[0], value[1]]
    }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFilters(prev => {
      const newCategories = prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId];
      return { ...prev, categories: newCategories };
    });
  };

  const handleStockStatusChange = (value: 'all' | 'in-stock' | 'out-of-stock') => {
    setFilters(prev => ({ ...prev, stockStatus: value }));
  };

  const handleOnSaleToggle = () => {
    setFilters(prev => ({ ...prev, onSale: !prev.onSale }));
  };

  const handleApplyFilters = () => {
    onFilterChange(filters);
    onClose();
  };

  const handleClearFilters = () => {
    const defaultFilters: FilterOptions = {
      priceRange: [minPrice, maxPrice],
      categories: [],
      stockStatus: 'all',
      onSale: false
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const activeFilterCount = [
    filters.categories.length > 0,
    filters.stockStatus !== 'all',
    filters.onSale,
    filters.priceRange[0] !== minPrice || filters.priceRange[1] !== maxPrice
  ].filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="relative w-screen max-w-md">
          <div className="h-full flex flex-col bg-background shadow-xl">
            <div className="flex-1 overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FilterIcon className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">Filters</h2>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFilterCount}
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Filter Content */}
              <div className="p-6 space-y-8">
                {/* Price Range */}
                <div className="space-y-4">
                  <h3 className="font-medium">Price Range</h3>
                  <div className="px-1">
                    <Slider
                      value={[filters.priceRange[0], filters.priceRange[1]]}
                      min={minPrice}
                      max={maxPrice}
                      step={10}
                      onValueChange={handlePriceChange}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>₹{filters.priceRange[0].toFixed(0)}</span>
                    <span>₹{filters.priceRange[1].toFixed(0)}</span>
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-3">
                  <h3 className="font-medium">Categories</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={filters.categories.includes(category.id)}
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                        />
                        <Label
                          htmlFor={`category-${category.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {category.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stock Status */}
                <div className="space-y-3">
                  <h3 className="font-medium">Stock Status</h3>
                  <RadioGroup
                    value={filters.stockStatus}
                    onValueChange={handleStockStatusChange as (value: string) => void}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="stock-all" />
                      <Label htmlFor="stock-all" className="text-sm font-normal cursor-pointer">
                        All Products
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="in-stock" id="stock-in" />
                      <Label htmlFor="stock-in" className="text-sm font-normal cursor-pointer">
                        In Stock
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="out-of-stock" id="stock-out" />
                      <Label htmlFor="stock-out" className="text-sm font-normal cursor-pointer">
                        Out of Stock
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* On Sale */}
                <div className="space-y-3">
                  <h3 className="font-medium">Discount</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="on-sale"
                      checked={filters.onSale}
                      onCheckedChange={handleOnSaleToggle}
                    />
                    <Label
                      htmlFor="on-sale"
                      className="text-sm font-normal cursor-pointer"
                    >
                      On Sale Items
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-6 space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleClearFilters}
              >
                Clear All
              </Button>
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}