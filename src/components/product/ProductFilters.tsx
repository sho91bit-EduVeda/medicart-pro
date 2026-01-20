import { useEffect, useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useFeatureFlags } from "../../hooks/useFeatureFlags"

export interface FilterOptions {
  priceRange: [number, number];
  brand: string;
  prescriptionType: 'all' | 'prescription' | 'non-prescription';
  medicineType: string;
  expiryDate: string;
}

interface ProductFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  brands: string[];
  medicineTypes: string[];
  maxPrice: number;
}

export function ProductFilters({ onFilterChange, brands, medicineTypes, maxPrice }: ProductFiltersProps) {
  const { advancedSearch } = useFeatureFlags()
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: [0, maxPrice],
    brand: 'all',
    prescriptionType: 'all',
    medicineType: 'all',
    expiryDate: 'all'
  })

  useEffect(() => {
    onFilterChange(filters)
  }, [filters, onFilterChange])

  if (!advancedSearch) return null

  return (
    <div className="space-y-6 p-4 border rounded-lg">
      <div>
        <Label>Price Range (₹{filters.priceRange[0]} - ₹{filters.priceRange[1]})</Label>
        <Slider
          value={filters.priceRange}
          min={0}
          max={maxPrice}
          step={10}
          onValueChange={(value) => setFilters({ ...filters, priceRange: value as [number, number] })}
        />
      </div>

      <div>
        <Label>Brand</Label>
        <Select
          value={filters.brand}
          onValueChange={(value) => setFilters({ ...filters, brand: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Prescription Type</Label>
        <Select
          value={filters.prescriptionType}
          onValueChange={(value: 'all' | 'prescription' | 'non-prescription') =>
            setFilters({ ...filters, prescriptionType: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="prescription">Prescription Required</SelectItem>
            <SelectItem value="non-prescription">No Prescription Required</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Medicine Type</Label>
        <Select
          value={filters.medicineType}
          onValueChange={(value) => setFilters({ ...filters, medicineType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select medicine type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {medicineTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Expiry Date</Label>
        <Select
          value={filters.expiryDate}
          onValueChange={(value) => setFilters({ ...filters, expiryDate: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select expiry range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="1month">Within 1 Month</SelectItem>
            <SelectItem value="3months">Within 3 Months</SelectItem>
            <SelectItem value="6months">Within 6 Months</SelectItem>
            <SelectItem value="1year">Within 1 Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}