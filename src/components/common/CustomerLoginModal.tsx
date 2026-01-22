import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomerLoginForm } from './CustomerLoginForm';
import { CustomerSignupForm } from './CustomerSignupForm';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

interface CustomerLoginModalProps {
  trigger: React.ReactNode;
}

export default function CustomerLoginModal({ trigger }: CustomerLoginModalProps) {
  const [open, setOpen] = useState(false);
  const { deliveryEnabled } = useFeatureFlags();

  if (!deliveryEnabled) {
    return null; // Don't render if delivery is disabled
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Welcome to Kalyanam Pharmaceuticals</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="pt-4">
            <CustomerLoginForm 
              onSuccess={() => setOpen(false)} 
              onSwitchToSignup={() => {}}
            />
          </TabsContent>
          <TabsContent value="signup" className="pt-4">
            <CustomerSignupForm 
              onSuccess={() => setOpen(false)} 
              onSwitchToLogin={() => {}}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}