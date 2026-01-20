import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { db } from '@/integrations/firebase/config';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { auth } from '@/integrations/firebase/config';
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
  const [reminderDate, setReminderDate] = useState('');
  const [updating, setUpdating] = useState(false);

  React.useEffect(() => {
    if (request) {
      setStatus(request.status);
      setNotes('');
      setReminderDate('');
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

  // Set a reminder for this request
  const handleSetReminder = async () => {
    if (!request || !reminderDate) return;

    try {
      await addDoc(collection(db, 'notifications'), {
        type: 'medicine_request_reminder',
        title: 'Medicine Request Follow-up',
        message: `Follow up on request for ${request.medicine_name}`,
        read: false,
        action_url: `/owner#requests`,
        created_at: new Date().toISOString(),
        reminder_date: new Date(reminderDate).toISOString(),
        user_id: auth.currentUser?.uid,
        request_id: request.id
      });

      toast.success('Reminder set successfully!');
      setReminderDate('');
    } catch (error) {
      toast.error('Failed to set reminder');
      console.error(error);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-none shadow-2xl">
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /><path d="M12 5 9.04 11l.96.65L12 5Z" /></svg>
              </span>
              Medicine Request
            </DialogTitle>
            <DialogDescription className="text-blue-100 mt-1">
              Ref: #{request.id.slice(0, 8)} • received on {new Date(request.created_at).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 p-8 bg-slate-50 relative">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '30px 30px',
            opacity: 0.3
          }}></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            {/* Left Column: Request Details */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Client Details</h4>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-slate-500 font-semibold mb-1.5 uppercase">Customer Profile</Label>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors">
                    <p className="font-bold text-slate-900 text-lg mb-1">{request.customer_name}</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <span className="truncate" title={request.email}>{request.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        <span>{request.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-slate-500 font-semibold mb-1.5 uppercase">Requested Item</Label>
                  <div className="p-3 bg-blue-50/50 rounded-md border border-blue-100 text-blue-900 font-medium">
                    {request.medicine_name}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-slate-500 font-semibold mb-1.5 uppercase">Message</Label>
                  <p className="text-sm p-4 bg-slate-50 rounded-lg border border-slate-100 min-h-[80px] text-slate-700 leading-relaxed italic">
                    "{request.message || 'No additional message'}"
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Actions */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Admin Actions</h4>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-600">Current Status</Label>
                  <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                    <SelectTrigger className="h-11 border-slate-200 hover:border-indigo-300 focus:ring-indigo-500 transition-all font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending" className="text-yellow-600 focus:text-yellow-700">
                        <span className="flex items-center gap-2">● Pending Review</span>
                      </SelectItem>
                      <SelectItem value="in_progress" className="text-blue-600 focus:text-blue-700">
                        <span className="flex items-center gap-2">● Processing Request</span>
                      </SelectItem>
                      <SelectItem value="resolved" className="text-green-600 focus:text-green-700">
                        <span className="flex items-center gap-2">● Resolved & Closed</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-slate-600">Internal Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add administrative notes regarding this request..."
                    rows={6}
                    className="resize-none border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="reminder" className="text-slate-600">Follow-up Reminder</Label>
                  <div className="flex gap-2">
                    <Input
                      id="reminder"
                      type="date"
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      className="flex-1 h-10 border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <Button
                      onClick={handleSetReminder}
                      disabled={!reminderDate || updating}
                      variant="outline"
                      className="h-10 hover:bg-slate-100 hover:text-indigo-700 border-slate-200"
                    >
                      Set
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t border-slate-100 bg-white z-20">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-500 hover:text-slate-800 hover:bg-slate-100">
            Cancel
          </Button>
          <Button
            onClick={handleUpdateStatus}
            disabled={updating}
            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px] shadow-lg shadow-indigo-200"
          >
            {updating ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Updating...
              </span>
            ) : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestDetailsModal;