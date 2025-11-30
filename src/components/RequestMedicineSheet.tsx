import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import RequestMedicineForm from './RequestMedicineForm';
import { Button } from '@/components/ui/button';
import { PackagePlus } from 'lucide-react';

interface RequestMedicineSheetProps {
  children: React.ReactNode;
  medicineName?: string;
}

const RequestMedicineSheet: React.FC<RequestMedicineSheetProps> = ({ children, medicineName = '' }) => {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5" />
            Request Medicine Availability
          </SheetTitle>
          <SheetDescription>
            Can't find the medicine you're looking for? Let us know and we'll notify you when it becomes available.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <RequestMedicineForm medicineName={medicineName} onClose={handleClose} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RequestMedicineSheet;