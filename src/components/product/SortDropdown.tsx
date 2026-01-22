import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, TrendingDown, TrendingUp, AlignLeft, Calendar } from "lucide-react";

interface SortOption {
  value: string;
  label: string;
  icon: React.ElementType;
}

interface SortDropdownProps {
  onSortChange: (sortValue: string) => void;
  currentSort: string;
}

export function SortDropdown({ onSortChange, currentSort }: SortDropdownProps) {
  const sortOptions: SortOption[] = [
    { value: 'price-low-high', label: 'Price: Low to High', icon: TrendingDown },
    { value: 'price-high-low', label: 'Price: High to Low', icon: TrendingUp },
    { value: 'name-a-z', label: 'Name: A to Z', icon: AlignLeft },
    { value: 'name-z-a', label: 'Name: Z to A', icon: AlignLeft },
    { value: 'newest-first', label: 'Newest First', icon: Calendar },
    { value: 'discount-high', label: 'Discount: Highest First', icon: ArrowUpDown },
  ];

  const currentOption = sortOptions.find(option => option.value === currentSort);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          {currentOption ? <currentOption.icon className="w-4 h-4" /> : null}
          {currentOption ? currentOption.label : 'Sort'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => onSortChange(option.value)}
            className="flex items-center gap-2"
          >
            <option.icon className="w-4 h-4" />
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}