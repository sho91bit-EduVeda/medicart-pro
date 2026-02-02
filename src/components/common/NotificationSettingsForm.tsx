import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { db } from '@/integrations/firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth } from '@/integrations/firebase/config';
import { DocumentData } from 'firebase/firestore';

interface NotificationSettingsFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
  refreshUserData?: () => void;
}

const NotificationSettingsForm: React.FC<NotificationSettingsFormProps> = ({ onClose, onSuccess, refreshUserData }) => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotionalOffers, setPromotionalOffers] = useState(true);
  const [loading, setLoading] = useState(false);

  // Load current notification preferences when component mounts
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        let userDocRef;
        if (currentUser.uid) {
          userDocRef = doc(db, 'users', currentUser.uid);
        } else {
          // For customer auth, we need to find by email
          // This is a simplified approach - in production you might want a more robust solution
          return;
        }

        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as DocumentData;
          const prefs = userData.notification_preferences || {};
          
          setEmailNotifications(prefs.email_notifications ?? true);
          setSmsNotifications(prefs.sms_notifications ?? true);
          setPushNotifications(prefs.push_notifications ?? true);
          setOrderUpdates(prefs.order_updates ?? true);
          setPromotionalOffers(prefs.promotional_offers ?? true);
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      let userDocRef;
      if (currentUser.uid) {
        userDocRef = doc(db, 'users', currentUser.uid);
      } else {
        // For customer auth, we need to find by email
        throw new Error('Cannot update notification settings: user ID not available');
      }

      await updateDoc(userDocRef, {
        notification_preferences: {
          email_notifications: emailNotifications,
          sms_notifications: smsNotifications,
          push_notifications: pushNotifications,
          order_updates: orderUpdates,
          promotional_offers: promotionalOffers,
        },
        updated_at: new Date().toISOString()
      });

      toast.success('Notification settings updated successfully!');

      if (refreshUserData) {
        refreshUserData();
      }

      if (onSuccess) {
        onSuccess();
      }

      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      console.error('Error updating notification settings:', error);
      let errorMessage = 'Failed to update notification settings';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
        <CardContent className="p-6">
          {/* <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Notification Settings</h3>
          </div> */}
          
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications" className="font-normal">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sms-notifications" className="font-normal">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates via SMS</p>
              </div>
              <Switch
                id="sms-notifications"
                checked={smsNotifications}
                onCheckedChange={setSmsNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications" className="font-normal">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
              </div>
              <Switch
                id="push-notifications"
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="order-updates" className="font-normal">Order Updates</Label>
                <p className="text-sm text-muted-foreground">Get notified about your order status</p>
              </div>
              <Switch
                id="order-updates"
                checked={orderUpdates}
                onCheckedChange={setOrderUpdates}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="promotional-offers" className="font-normal">Promotional Offers</Label>
                <p className="text-sm text-muted-foreground">Receive special offers and promotions</p>
              </div>
              <Switch
                id="promotional-offers"
                checked={promotionalOffers}
                onCheckedChange={setPromotionalOffers}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex flex-col gap-3 pt-2">
        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Saving Settings...
            </span>
          ) : 'Save Settings'}
        </Button>
        
        {onClose && (
          <Button 
            type="button" 
            variant="outline" 
            className="w-full h-11" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default NotificationSettingsForm;