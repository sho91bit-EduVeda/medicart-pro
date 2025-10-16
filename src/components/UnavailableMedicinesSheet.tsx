import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Clock, CheckCircle, Package, Search, MessageSquare } from 'lucide-react';
import { whatsappService, UnavailableMedicine } from '@/services/whatsappService';
import { toast } from 'sonner';

interface UnavailableMedicinesSheetProps {
  children: React.ReactNode;
}

const UnavailableMedicinesSheet: React.FC<UnavailableMedicinesSheetProps> = ({ children }) => {
  const [medicines, setMedicines] = useState<UnavailableMedicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<UnavailableMedicine | null>(null);
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'resolved'>('pending');
  const [notes, setNotes] = useState('');

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const data = await whatsappService.getUnavailableMedicines();
      setMedicines(data);
    } catch (error) {
      toast.error('Failed to load unavailable medicines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  const handleStatusUpdate = async () => {
    if (!selectedMedicine) return;

    try {
      const success = await whatsappService.updateMedicineStatus(
        selectedMedicine.id,
        status,
        notes
      );

      if (success) {
        toast.success('Medicine status updated successfully');
        await loadMedicines();
        setSelectedMedicine(null);
        setNotes('');
      } else {
        toast.error('Failed to update medicine status');
      }
    } catch (error) {
      toast.error('Error updating medicine status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <AlertCircle className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-[600px] sm:w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Unavailable Medicines Tracking
          </SheetTitle>
          <SheetDescription>
            Track medicines that customers searched for but are not available in your inventory.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Total Searches</p>
                    <p className="text-2xl font-bold">{medicines.reduce((sum, med) => sum + med.search_count, 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium">Pending</p>
                    <p className="text-2xl font-bold">{medicines.filter(m => m.status === 'pending').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Resolved</p>
                    <p className="text-2xl font-bold">{medicines.filter(m => m.status === 'resolved').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Medicines List */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Medicines List</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading...</p>
              </div>
            ) : medicines.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No unavailable medicines tracked yet.</p>
                </CardContent>
              </Card>
            ) : (
              medicines.map((medicine) => (
                <Card key={medicine.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold capitalize">{medicine.medicine_name}</h4>
                          <Badge className={getStatusColor(medicine.status)}>
                            {getStatusIcon(medicine.status)}
                            <span className="ml-1 capitalize">{medicine.status}</span>
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Searched {medicine.search_count} time{medicine.search_count !== 1 ? 's' : ''}</p>
                          <p>First searched: {formatDate(medicine.first_searched_at)}</p>
                          <p>Last searched: {formatDate(medicine.last_searched_at)}</p>
                          {medicine.notes && (
                            <p className="mt-2 p-2 bg-muted rounded text-xs">
                              <MessageSquare className="w-3 h-3 inline mr-1" />
                              {medicine.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMedicine(medicine);
                          setStatus(medicine.status);
                          setNotes(medicine.notes || '');
                        }}
                      >
                        Update Status
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Update Status Modal */}
          {selectedMedicine && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Update Status: {selectedMedicine.medicine_name}</CardTitle>
                <CardDescription>
                  Update the status and add notes for this medicine.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add notes about this medicine..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleStatusUpdate}>
                    Update Status
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedMedicine(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UnavailableMedicinesSheet;
