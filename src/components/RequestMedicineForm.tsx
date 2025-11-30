import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { whatsappService } from '@/services/whatsappService';
import { db } from '@/integrations/firebase/config';
import { collection, addDoc } from 'firebase/firestore';

interface RequestMedicineFormProps {
  medicineName?: string;
  onClose?: () => void;
}

const RequestMedicineForm: React.FC<RequestMedicineFormProps> = ({ medicineName = '', onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [medicine, setMedicine] = useState(medicineName);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Save to Firebase
      await addDoc(collection(db, 'medicine_requests'), {
        customer_name: name,
        email,
        phone,
        medicine_name: medicine,
        message,
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Request Medicine Availability</CardTitle>
        <CardDescription>
          Let us know which medicine you're looking for and we'll notify you when it becomes available.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="medicine">Medicine Name</Label>
            <Input
              id="medicine"
              value={medicine}
              onChange={(e) => setMedicine(e.target.value)}
              placeholder="Enter medicine name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Additional Information</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Any additional information about the medicine or your requirements..."
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
          {onClose && (
            <Button type="button" variant="outline" className="w-full" onClick={onClose}>
              Cancel
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
};

export default RequestMedicineForm;