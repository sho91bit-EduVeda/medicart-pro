import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import RequestMedicineForm from './RequestMedicineForm';
import { Button } from '@/components/ui/button';
import { PackagePlus, Info } from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

interface RequestMedicineSheetProps {
  children: React.ReactNode;
  medicineName?: string;
  isFromProductSection?: boolean;
}

const RequestMedicineSheet: React.FC<RequestMedicineSheetProps> = ({ children, medicineName = '', isFromProductSection = false }) => {
  const { prescriptionUpload } = useFeatureFlags();
  const [open, setOpen] = useState(false);
  
  // Temporary debug: force enable for testing
  const isPrescriptionUploadEnabled = true; // prescriptionUpload;

  const handleClose = () => {
    console.log('RequestMedicineSheet handleClose called');
    // Directly close without passing event
    setOpen(false);
  };
  
  // Debug the open state changes
  React.useEffect(() => {
    console.log('RequestMedicineSheet open state changed to:', open);
  }, [open]);

  console.log('RequestMedicineSheet rendering with:', { prescriptionUpload, isPrescriptionUploadEnabled, open, children });

  if (!isPrescriptionUploadEnabled) {
    console.log('RequestMedicineSheet: prescriptionUpload disabled, rendering children only');
    return children; // Only render the trigger child, don't wrap in dialog if feature is disabled
  }
  
  console.log('RequestMedicineSheet: prescriptionUpload enabled (forced), rendering full component');
    
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-2xl h-full flex flex-col p-0 overflow-hidden rounded-2xl border-0 shadow-2xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => {
          // Prevent pointer events from propagating to underlying components
          e.preventDefault();
          e.stopPropagation();
        }}
        onInteractOutside={(e) => {
          // Prevent interactions from affecting other components
          e.preventDefault();
          e.stopPropagation();
        }}
        onEscapeKeyDown={(e) => {
          // Prevent escape key from triggering other components
          e.preventDefault();
          e.stopPropagation();
        }}
        onCloseAutoFocus={(e) => {
          // Prevent focus events from triggering other components
          e.preventDefault();
          e.stopPropagation();
          // Blur the active element to prevent focus from going to the underlying component
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }}
      >
  
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <DialogHeader className="relative z-10">
            <div className="flex justify-center mb-2">
              <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                <PackagePlus className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <DialogTitle className="text-lg font-bold tracking-tight text-white">
                Request Medicine
              </DialogTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Info className="w-4 h-4 text-blue-200 cursor-help" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-blue-900 border-blue-700 text-blue-100">
                    <p className="text-xs">Can't find what you're looking for? Let us know and we'll notify you when it becomes available.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </DialogHeader>
        </div>
          
        {/* Form Content */}
        <div 
          className="flex-1 overflow-y-auto p-6 bg-slate-50 relative"
          onClick={(e) => {
            // Prevent click events from bubbling up to parent components
            e.stopPropagation();
          }}
        >
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            opacity: 0.3
          }}></div>
            
          <div className="relative z-10">
            <RequestMedicineForm medicineName={medicineName} onClose={handleClose} isFromProductSection={isFromProductSection} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestMedicineSheet;