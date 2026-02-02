import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { auth } from '@/integrations/firebase/config';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

interface ChangePasswordFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
  refreshUserData?: () => void;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onClose, onSuccess, refreshUserData }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    
    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Re-authenticate the user with their current password
      if (currentUser.email) {
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          currentPassword
        );
        await reauthenticateWithCredential(currentUser, credential);
      }

      // Update the password
      await updatePassword(currentUser, newPassword);

      toast.success('Password updated successfully!');

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      
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
      console.error('Error updating password:', error);
      let errorMessage = 'Failed to update password';

      if (error instanceof Error) {
        if (error.message.includes('auth/wrong-password')) {
          errorMessage = 'Current password is incorrect. Please try again.';
        } else if (error.message.includes('auth/requires-recent-login')) {
          errorMessage = 'Please sign out and sign in again to update your password.';
        } else if (error.message.includes('auth/weak-password')) {
          errorMessage = 'New password is too weak. Please use a stronger password.';
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
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Change Password</h3>
          </div> */}
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm New Password</Label>
              <Input
                id="confirm-new-password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
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
              Updating Password...
            </span>
          ) : 'Update Password'}
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

export default ChangePasswordForm;