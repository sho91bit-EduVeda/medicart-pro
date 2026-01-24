import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { whatsappService } from '@/services/whatsappService';
import { db } from '@/integrations/firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { auth } from '@/integrations/firebase/config';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

interface RequestMedicineFormProps {
  medicineName?: string;
  onClose?: () => void;
  isFromProductSection?: boolean;
}

const RequestMedicineForm: React.FC<RequestMedicineFormProps> = ({ medicineName = '', onClose, isFromProductSection = false }) => {
  const { prescriptionUpload } = useFeatureFlags(); // Use prescription upload flag
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [medicine, setMedicine] = useState(medicineName);
  const [message, setMessage] = useState('');
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Set default message when component mounts
  useEffect(() => {
    // Set a default urgent message
    setMessage('I need this medicine urgently. Can you please make it available and let me know when it arrives?');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Save to Firebase
      const requestRef = await addDoc(collection(db, 'medicine_requests'), {
        customer_name: name,
        email,
        phone,
        medicine_name: medicine,
        message,
        prescription_file_name: prescriptionFile?.name || null,
        prescription_file_size: prescriptionFile?.size || null,
        prescription_file_type: prescriptionFile?.type || null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Send WhatsApp notification
      await whatsappService.sendNotification(
        `💊 Medicine Request Form Submission!\n\n` +
        `Customer: ${name}\n` +
        `Email: ${email}\n` +
        `Phone: ${phone}\n` +
        `Medicine: ${medicine}\n` +
        `Message: ${message}\n` +
        `Time: ${new Date().toLocaleString()}\n\n` +
        `A customer has requested availability of a medicine.`
      );

      // Create notification for owner
      try {
        await addDoc(collection(db, 'notifications'), {
          type: 'medicine_request',
          title: 'New Medicine Request',
          message: `Customer ${name} requested ${medicine}`,
          read: false,
          action_url: `/owner#requests`, // Link to requests section
          created_at: new Date().toISOString(),
          // We'll add user_id for the owner when we implement owner identification
        });
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError);
        // Don't fail the whole request if notification creation fails
      }

      toast.success('Request submitted successfully! We will contact you when the medicine becomes available.');
      
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setMedicine(medicineName);
      setMessage('');
      
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      console.error('Error submitting medicine request:', error);
      
      // Check if it's a permissions error
      if (error.code === 'permission-denied' || (error.message && error.message.includes('permissions'))) {
        toast.error('Unable to save request to database due to permissions. The request has still been sent to our team via WhatsApp. We will contact you when the medicine becomes available.');
        
        // Still send WhatsApp notification even if Firebase fails
        try {
          await whatsappService.sendNotification(
            `💊 Medicine Request Form Submission!\n\n` +
            `Customer: ${name}\n` +
            `Email: ${email}\n` +
            `Phone: ${phone}\n` +
            `Medicine: ${medicine}\n` +
            `Message: ${message}\n` +
            `Time: ${new Date().toLocaleString()}\n\n` +
            `A customer has requested availability of a medicine.\n\n` +
            `Note: Firebase storage failed due to permissions.`
          );
          
          // Reset form
          setName('');
          setEmail('');
          setPhone('');
          setMedicine(medicineName);
          setMessage('');
          
          if (onClose) {
            onClose();
          }
        } catch (whatsappError) {
          toast.error('Failed to send notification. Please contact us directly.');
          console.error('Error sending WhatsApp notification:', whatsappError);
        }
      } else {
        toast.error('Failed to submit request. Please try again.');
        console.error('Error submitting medicine request:', error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card 1: Personal Information */}
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Your Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                autoComplete="name"
              />
            </div>
                        
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>
                        
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
                autoComplete="tel"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Card 2: Medicine Information */}
      <Card className="bg-white rounded-xl shadow-sm border border-blue-100">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-blue-200">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Medicine Details</h3>
          </div>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="medicine">Medicine Name *</Label>
              <Input
                id="medicine"
                value={medicine}
                onChange={(e) => {
                  // Only allow changing medicine name if not from product section
                  if (!isFromProductSection) {
                    setMedicine(e.target.value);
                  }
                }}
                placeholder={isFromProductSection ? "Medicine name is pre-filled and locked" : "Enter the name of the medicine you're looking for"}
                required
                readOnly={isFromProductSection}
                className={isFromProductSection ? "cursor-not-allowed bg-muted" : ""}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Additional Information</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Any additional details about the medicine, dosage, brand preferences, or urgency..."
                rows={4}
                className="min-h-[100px]"
              />
            </div>
            
            {/* Prescription Upload Field - Only show if enabled */}
            {prescriptionUpload && (
              <div className="space-y-2">
                <Label htmlFor="prescription-upload">Upload Prescription (Optional)</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Input
                      id="prescription-upload"
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Validate file size (max 5MB)
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error('File size must be less than 5MB');
                            return;
                          }
                          
                          // Validate file type
                          const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
                          if (!validTypes.includes(file.type)) {
                            toast.error('Please upload a JPG, PNG, or PDF file');
                            return;
                          }
                          
                          setPrescriptionFile(file);
                          
                          // Create preview for images
                          if (file.type.startsWith('image/')) {
                            const url = URL.createObjectURL(file);
                            setPreviewUrl(url);
                          }
                        }
                      }}
                      className="flex-1"
                    />
                    {prescriptionFile && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setPrescriptionFile(null);
                          setPreviewUrl(null);
                          // Reset the input
                          const input = document.getElementById('prescription-upload') as HTMLInputElement;
                          if (input) input.value = '';
                        }}
                        className="h-9 px-3"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Accepts JPG, PNG, PDF formats (max 5MB). Prescription required for scheduled/controlled medicines.
                  </p>
                  
                  {/* Preview for image files */}
                  {previewUrl && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-1">Preview:</p>
                      <img 
                        src={previewUrl} 
                        alt="Prescription preview" 
                        className="max-w-xs max-h-40 object-contain border rounded-md" 
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Submit Buttons */}
      <div className="flex flex-col gap-3 pt-2">
        <Button type="submit" className="w-full h-11" disabled={submitting}>
          {submitting ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Submitting Request...
            </span>
          ) : 'Submit Medicine Request'}
        </Button>
        {onClose && (
          <Button type="button" variant="outline" className="w-full h-11" onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default RequestMedicineForm;