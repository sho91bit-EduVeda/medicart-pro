import { useState, useEffect, useRef } from "react";
import { db } from "@/integrations/firebase/config";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  original_price: number;
  // Add other product properties as needed
}

interface SearchableProductDropdownProps {
  value: string;
  onValueChange: (value: string, price?: number) => void;
  placeholder?: string;
  className?: string;
  resetAfterSelect?: boolean; // New prop to control reset behavior
}

export function SearchableProductDropdown({
  value,
  onValueChange,
  placeholder = "Select a product...",
  className,
  resetAfterSelect = false, // Default to false to maintain backward compatibility
}: SearchableProductDropdownProps) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [displayValue, setDisplayValue] = useState(value); // Local state for display value
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Update display value when prop value changes
  useEffect(() => {
    if (!resetAfterSelect) {
      setDisplayValue(value);
    }
  }, [value, resetAfterSelect]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Prevent closing when clicking inside the dropdown
      if (event.target instanceof Element) {
        const commandList = document.querySelector('[cmdk-list-sizer]');
        if (commandList && commandList.contains(event.target)) {
          return;
        }
      }
      
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={cn("relative", className)}>
      <Button
        ref={buttonRef}
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        onClick={(e) => {
          e.stopPropagation(); // Prevent event bubbling
          setOpen(!open);
        }}
      >
        {displayValue || placeholder}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      
      {open && (
        <div className="absolute top-full z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
          <Command>
            <CommandInput placeholder="Search products..." />
            <CommandList>
              <CommandEmpty>No product found.</CommandEmpty>
              <CommandGroup>
                {loading ? (
                  <CommandItem disabled>
                    <span>Loading products...</span>
                  </CommandItem>
                ) : (
                  products.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.name}
                      onSelect={() => {
                        onValueChange(product.name, product.original_price);
                        if (resetAfterSelect) {
                          // Reset display value after selection
                          setDisplayValue("");
                        } else {
                          // Update display value to selected product
                          setDisplayValue(product.name);
                        }
                        setOpen(false);
                      }}
                    >
                      <div className="flex justify-between w-full">
                        <span>{product.name}</span>
                        <span className="text-muted-foreground">₹{product.original_price.toFixed(2)}</span>
                      </div>
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}