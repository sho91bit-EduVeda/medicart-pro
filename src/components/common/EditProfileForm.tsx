import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { db } from '@/integrations/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { auth } from '@/integrations/firebase/config';
import { updateProfile } from 'firebase/auth';

interface EditProfileFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
  refreshUserData?: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ onClose, onSuccess, refreshUserData }) => {
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // Load current user data when component mounts
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setPhoneNumber(currentUser.phoneNumber || '');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Update profile in Firebase Authentication
      await updateProfile(currentUser, {
        displayName: displayName || null
      });

      // Update phone number in Firestore user document
      if (currentUser.email) {
        // Find user document by email (since we don't have UID for customers)
        // First try to find in users collection (for owners)
        let userDocRef;
        if (currentUser.uid) {
          userDocRef = doc(db, 'users', currentUser.uid);
        } else {
          // For customer auth, we need to find by email
          // This is a simplified approach - in production you might want a more robust solution
          throw new Error('Cannot update profile: user ID not available');
        }

        await updateDoc(userDocRef, {
          displayName: displayName || null,
          phoneNumber: phoneNumber || null,
          updated_at: new Date().toISOString()
        });
      }

      toast.success('Profile updated successfully!');
      
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
      console.error('Error updating profile:', error);
      let errorMessage = 'Failed to update profile';

      if (error instanceof Error) {
        if (error.message.includes('auth/requires-recent-login')) {
          errorMessage = 'Please sign out and sign in again to update your profile.';
        }
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
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Edit Profile</h3>
          </div> */}
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                autoComplete="name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98765 43210"
                autoComplete="tel"
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
              Updating Profile...
            </span>
          ) : 'Save Changes'}
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

export default EditProfileForm;