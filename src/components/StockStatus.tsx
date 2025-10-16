import { useFeatureFlags } from "../hooks/useFeatureFlags"
import { Badge } from "./ui/badge"
import { cn } from "../lib/utils"

interface StockStatusProps {
  quantity: number
  lowStockThreshold?: number
  className?: string
}

export function StockStatus({ 
  quantity, 
  lowStockThreshold = 10,
  className 
}: StockStatusProps) {
  const { stockStatus } = useFeatureFlags()

  if (!stockStatus) return null

  const getStatusColor = (quantity: number): string => {
    if (quantity === 0) return "bg-red-100 text-red-800"
    if (quantity <= lowStockThreshold) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  const getStatusText = (quantity: number): string => {
    if (quantity === 0) return "Out of Stock"
    if (quantity <= lowStockThreshold) return `Low Stock (${quantity})`
    return "In Stock"
  }

  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-sm font-medium",
        getStatusColor(quantity),
        className
      )}
    >
      {getStatusText(quantity)}
    </Badge>
  )
}