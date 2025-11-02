import { AlertTriangle, FileText } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

interface PrescriptionBadgeProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function PrescriptionBadge({ className, variant = 'default' }: PrescriptionBadgeProps) {
  if (variant === 'compact') {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "bg-amber-100 text-amber-800 border-amber-200 text-xs font-medium",
          className
        )}
      >
        <FileText className="w-3 h-3 mr-1" />
        Rx Required
      </Badge>
    );
  }

  return (
    <div
      className={cn(
        "bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium text-amber-800">Prescription Required</h3>
          <p className="text-sm text-amber-700 mt-1">
            Please upload a valid prescription to purchase this medicine
          </p>
        </div>
      </div>

      <div className="text-xs text-amber-600 bg-amber-100 rounded p-2">
        <strong>Accepted formats:</strong> PDF, JPG, PNG (Max 5MB)
      </div>
    </div>
  );
}