import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ArrowUpNarrowWide } from "lucide-react";

type SortOption = 
  | 'price-low-high'
  | 'price-high-low'
  | 'name-a-z'
  | 'name-z-a'
  | 'newest-first'
  | 'discount-high';

interface SortDropdownProps {
  onSortChange: (option: SortOption) => void;
  currentSort: SortOption;
}

export function SortDropdown({ onSortChange, currentSort }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'price-low-high', label: 'Price: Low to High' },
    { value: 'price-high-low', label: 'Price: High to Low' },
    { value: 'name-a-z', label: 'Name: A to Z' },
    { value: 'name-z-a', label: 'Name: Z to A' },
    { value: 'newest-first', label: 'Newest First' },
    { value: 'discount-high', label: 'Discount: Highest First' },
  ];

  const currentLabel = sortOptions.find(option => option.value === currentSort)?.label || 'Sort: Price ↑';

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (option: SortOption) => {
    onSortChange(option);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <ArrowUpNarrowWide className="w-4 h-4" />
        <span className="hidden sm:inline-block">
          {currentLabel}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-background border border-border rounded-md shadow-lg z-50 overflow-hidden">
          <div className="py-1">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-accent ${
                  currentSort === option.value ? 'bg-accent' : ''
                }`}
                onClick={() => handleOptionClick(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}