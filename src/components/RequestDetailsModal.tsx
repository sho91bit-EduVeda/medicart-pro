import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/integrations/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface MedicineRequest {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  medicine_name: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
}

interface RequestDetailsModalProps {
  request: MedicineRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({ 
  request, 
  open, 
  onOpenChange,
  onUpdate
}) => {
  const [status, setStatus] = useState<MedicineRequest['status']>('pending');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  React.useEffect(() => {
    if (request) {
      setStatus(request.status);
      setNotes('');
    }
  }, [request]);

  const handleUpdateStatus = async () => {
    if (!request) return;
    
    setUpdating(true);
    try {
      const requestRef = doc(db, 'medicine_requests', request.id);
      await updateDoc(requestRef, {
        status,
        notes: notes || null,
        updated_at: new Date().toISOString()
      });

      toast.success('Request status updated successfully!');
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error('Failed to update request status');
    } finally {
      setUpdating(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Medicine Request Details</DialogTitle>
          <DialogDescription>
            View and update the status of this medicine request
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Customer Name</Label>
            <p className="font-medium">{request.customer_name}</p>
          </div>
          
          <div className="space-y-2">
            <Label>Contact Information</Label>
            <p className="text-sm">{request.email}</p>
            <p className="text-sm">{request.phone}</p>
          </div>
          
          <div className="space-y-2">
            <Label>Medicine Requested</Label>
            <p className="font-medium">{request.medicine_name}</p>
          </div>
          
          <div className="space-y-2">
            <Label>Message</Label>
            <p className="text-sm">{request.message || 'No additional message'}</p>
          </div>
          
          <div className="space-y-2">
            <Label>Request Date</Label>
            <p className="text-sm">
              {new Date(request.created_at).toLocaleDateString()} at{' '}
              {new Date(request.created_at).toLocaleTimeString()}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this request..."
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdateStatus} disabled={updating}>
            {updating ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestDetailsModal;