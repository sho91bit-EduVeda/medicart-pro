import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { db } from '@/integrations/firebase/config';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth } from '@/integrations/firebase/config';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, createUserWithEmailAndPassword } from 'firebase/auth';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Building2, 
  UserRound, 
  LogOut,
  Search,
  Package,
  Heart,
  ArrowRight,
  ShieldCheck,
  Store,
  ChevronDown,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { QuickLinksSidebar } from '@/components/layout/QuickLinksSidebar';
import { UserAccountDropdown } from '@/components/common/UserAccountDropdown';
import NotificationBell from '@/components/common/NotificationBell';
import { UnifiedAuth } from '@/components/common/UnifiedAuth';
import logoImage from '@/assets/Logo.png';
import RequestMedicineSheet from '@/components/common/RequestMedicineSheet';
import CommonHeader from '@/components/layout/CommonHeader';
import CompleteFooter from '@/components/layout/CompleteFooter';
import EditProfilePopup from '@/components/common/EditProfilePopup';
import ChangePasswordPopup from '@/components/common/ChangePasswordPopup';
import NotificationSettingsPopup from '@/components/common/NotificationSettingsPopup';

export default function Profile() {
  const navigate = useNavigate();
  const { isAuthenticated, user: ownerUser, checkAuth, signOut: ownerSignOut, isAdmin } = useAuth();
  const { 
    isAuthenticated: isCustomerAuthenticated, 
    user: customerUser,
    signOut: customerSignOut
  } = useCustomerAuth();
  
  // Check authentication status
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Determine which user is logged in
  const isAnyUserLoggedIn = isAuthenticated || isCustomerAuthenticated;
  const currentUser = isAuthenticated ? ownerUser : customerUser;
  const isCurrentUserOwner = isAuthenticated && isAdmin;

  // Function to refresh user data
  const refreshUserData = () => {
    if (isAuthenticated) {
      checkAuth();
    } else if (isCustomerAuthenticated) {
      // For customer, we may need to reload customer auth state
      // This depends on how the customer auth hook works
    }
    
    // Reload user creation date
    const loadUserCreationDate = async () => {
      if (isAuthenticated && ownerUser?.uid) {
        // Load owner creation date
        try {
          const userDoc = await getDoc(doc(db, "users", ownerUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setMemberSince(userData.created_at || '');
          }
        } catch (error) {
          console.error('Error loading owner creation date:', error);
        }
      } else if (isCustomerAuthenticated && customerUser?.uid) {
        // Load customer creation date
        try {
          const userDoc = await getDoc(doc(db, "customers", customerUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setMemberSince(userData.created_at || '');
          }
        } catch (error) {
          console.error('Error loading customer creation date:', error);
          // Fallback: try to find by email in users collection for customers
          try {
            // Attempt to find customer in users collection if not in customers collection
            const userDoc = await getDoc(doc(db, "users", customerUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setMemberSince(userData.created_at || '');
            }
          } catch (fallbackError) {
            console.error('Error loading customer creation date from fallback:', fallbackError);
          }
        }
      }
    };
    
    loadUserCreationDate();
  };

  // Handle logout based on user type
  const handleLogout = async () => {
    try {
      if (isAuthenticated) {
        // Logout owner
        await ownerSignOut();
      } else if (isCustomerAuthenticated) {
        // Logout customer
        await customerSignOut();
      }
      toast.success("Logged out successfully");
      navigate('/');
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  // State for owner login management
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerConfirmPassword, setOwnerConfirmPassword] = useState('');
  const [loadingOwnerUpdate, setLoadingOwnerUpdate] = useState(false);
  
  // State for creating new owners
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPassword, setNewOwnerPassword] = useState('');
  const [newOwnerConfirmPassword, setNewOwnerConfirmPassword] = useState('');
  const [loadingNewOwner, setLoadingNewOwner] = useState(false);
  
  // State for member since date
  const [memberSince, setMemberSince] = useState<string>('');
  
  // Load owner login details if user is owner
  useEffect(() => {
    const loadOwnerDetails = async () => {
      if (isAuthenticated && isCurrentUserOwner) {
        try {
          const userDoc = await getDoc(doc(db, "users", ownerUser?.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setOwnerEmail(userData.email || '');
          }
        } catch (error) {
          console.error('Error loading owner details:', error);
        }
      }
    };
    
    loadOwnerDetails();
  }, [isAuthenticated, isCurrentUserOwner, ownerUser?.uid]);
  
  // Load user creation date for both owners and customers
  useEffect(() => {
    const loadUserCreationDate = async () => {
      if (isAuthenticated && ownerUser?.uid) {
        // Load owner creation date
        try {
          const userDoc = await getDoc(doc(db, "users", ownerUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setMemberSince(userData.created_at || '');
          }
        } catch (error) {
          console.error('Error loading owner creation date:', error);
        }
      } else if (isCustomerAuthenticated && customerUser?.uid) {
        // Load customer creation date
        try {
          const userDoc = await getDoc(doc(db, "customers", customerUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setMemberSince(userData.created_at || '');
          }
        } catch (error) {
          console.error('Error loading customer creation date:', error);
          // Fallback: try to find by email in users collection for customers
          try {
            // Attempt to find customer in users collection if not in customers collection
            const userDoc = await getDoc(doc(db, "users", customerUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setMemberSince(userData.created_at || '');
            }
          } catch (fallbackError) {
            console.error('Error loading customer creation date from fallback:', fallbackError);
          }
        }
      }
    };
    
    loadUserCreationDate();
  }, [isAuthenticated, isCustomerAuthenticated, ownerUser?.uid, customerUser?.uid]);
  
  // Handle owner login update
  const handleOwnerLoginUpdate = async () => {
    if (!ownerPassword) {
      toast.error('Please enter a password');
      return;
    }
    
    if (ownerPassword !== ownerConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (ownerPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    setLoadingOwnerUpdate(true);
    try {
      // Get the current user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      // Update the user's password
      await updatePassword(currentUser, ownerPassword);
      
      // Update the email if it has changed
      if (currentUser.email !== ownerEmail) {
        // Note: Changing email requires re-authentication
        // For simplicity in this implementation, we'll skip email change
        // In a real app, you'd need to re-authenticate the user first
        toast.info('Email change requires re-authentication (skipped in this demo)');
      }
      
      toast.success('Owner login details updated successfully!');
      setOwnerPassword('');
      setOwnerConfirmPassword('');
    } catch (error) {
      console.error('Error updating owner login:', error);
      let errorMessage = 'Failed to update owner login details';
      
      if (error instanceof Error) {
        if (error.message.includes('auth/requires-recent-login')) {
          errorMessage = 'Please sign out and sign in again to update your password.';
        } else if (error.message.includes('auth/weak-password')) {
          errorMessage = 'Password is too weak. Please use a stronger password.';
        } else if (error.message.includes('auth/email-already-in-use')) {
          errorMessage = 'This email is already in use by another account.';
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoadingOwnerUpdate(false);
    }
  };
  
  // Handle creating a new owner
  const handleCreateNewOwner = async () => {
    if (!newOwnerEmail || !newOwnerPassword) {
      toast.error('Please enter both email and password');
      return;
    }
    
    if (newOwnerPassword !== newOwnerConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newOwnerPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newOwnerEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setLoadingNewOwner(true);
    try {
      // Create a new user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, newOwnerEmail, newOwnerPassword);
      const newUser = userCredential.user;
      
      // Create a user document in Firestore with owner role
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        email: newOwnerEmail,
        role: 'OWNER',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      toast.success('New owner account created successfully!');
      
      // Clear the form
      setNewOwnerEmail('');
      setNewOwnerPassword('');
      setNewOwnerConfirmPassword('');
    } catch (error) {
      console.error('Error creating new owner:', error);
      let errorMessage = 'Failed to create new owner account';
      
      if (error instanceof Error) {
        if (error.message.includes('auth/email-already-in-use')) {
          errorMessage = 'An account with this email already exists.';
        } else if (error.message.includes('auth/weak-password')) {
          errorMessage = 'Password is too weak. Please use a stronger password.';
        } else if (error.message.includes('auth/invalid-email')) {
          errorMessage = 'Please enter a valid email address.';
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoadingNewOwner(false);
    }
  };
  
  useEffect(() => {
    if (!isAnyUserLoggedIn) {
      navigate('/auth');
    }
  }, [isAnyUserLoggedIn, navigate]);

  // Helper function to format date as '1st January 2026'
  const formatDate = (date: Date): string => {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    
    // Add ordinal suffix to day
    let daySuffix = 'th';
    if (day % 10 === 1 && day !== 11) {
      daySuffix = 'st';
    } else if (day % 10 === 2 && day !== 12) {
      daySuffix = 'nd';
    } else if (day % 10 === 3 && day !== 13) {
      daySuffix = 'rd';
    }
    
    return `${day}${daySuffix} ${month} ${year}`;
  };
  
  // Redirect if not authenticated
  if (!isAnyUserLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Quick Links Sidebar - Show when authenticated (owner or customer) */}
      {(isAuthenticated || isCustomerAuthenticated) && <QuickLinksSidebar />}

      <CommonHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-primary/10 rounded-full">
              <UserRound className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Profile</h1>
              <p className="text-muted-foreground">
                Manage your {isCurrentUserOwner ? 'owner' : 'customer'} account
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Info Card */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary rounded-full">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Display Name</p>
                      <p className="font-medium">
                        {currentUser?.displayName || 
                         currentUser?.email?.split('@')[0] || 
                         'N/A'}
                      </p>
                    </div>
                  </div>
          
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary rounded-full">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">
                        {currentUser?.email || 'N/A'}
                      </p>
                    </div>
                  </div>
          
                  {currentUser?.phoneNumber && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary rounded-full">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">
                          {currentUser.phoneNumber}
                        </p>
                      </div>
                    </div>
                  )}
          
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary rounded-full">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Account Type</p>
                      <Badge variant={isCurrentUserOwner ? "default" : "secondary"}>
                        {isCurrentUserOwner ? 'Owner' : 'Customer'}
                      </Badge>
                    </div>
                  </div>
          
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary rounded-full">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Member Since</p>
                      <p className="font-medium">
                        {memberSince ? formatDate(new Date(memberSince)) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          
            {/* Account Actions Card */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserRound className="w-5 h-5" />
                    Account Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <EditProfilePopup refreshUserData={refreshUserData}>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      Edit Profile
                    </Button>
                  </EditProfilePopup>
                            
                  <ChangePasswordPopup refreshUserData={refreshUserData}>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      Change Password
                    </Button>
                  </ChangePasswordPopup>
                            
                  <NotificationSettingsPopup refreshUserData={refreshUserData}>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      Notification Settings
                    </Button>
                  </NotificationSettingsPopup>
                            
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Owner Management Section - Only show for owners */}
          {isCurrentUserOwner && (
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    Owner Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="update-details" className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
                      <AccordionTrigger className="w-full p-4 text-base font-medium text-gray-800 hover:text-gray-900 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" />
                          Update My Login Details
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-4 bg-white/50">
                        <div className="space-y-4 pt-2">
                          <div className="space-y-2">
                            <Label htmlFor="owner-email">Owner Email</Label>
                            <Input 
                              id="owner-email"
                              type="email"
                              placeholder="owner@example.com"
                              value={ownerEmail}
                              onChange={(e) => setOwnerEmail(e.target.value)}
                              disabled={!isCurrentUserOwner}
                            />
                          </div>
                                            
                          <div className="space-y-2">
                            <Label htmlFor="owner-password">New Password</Label>
                            <Input 
                              id="owner-password"
                              type="password"
                              placeholder="Enter new password"
                              value={ownerPassword}
                              onChange={(e) => setOwnerPassword(e.target.value)}
                              disabled={!isCurrentUserOwner}
                            />
                          </div>
                                            
                          <div className="space-y-2">
                            <Label htmlFor="owner-confirm-password">Confirm New Password</Label>
                            <Input 
                              id="owner-confirm-password"
                              type="password"
                              placeholder="Confirm new password"
                              value={ownerConfirmPassword}
                              onChange={(e) => setOwnerConfirmPassword(e.target.value)}
                              disabled={!isCurrentUserOwner}
                            />
                          </div>
                                            
                          <Button 
                            className="w-full"
                            onClick={handleOwnerLoginUpdate}
                            disabled={loadingOwnerUpdate || !isCurrentUserOwner}
                          >
                            {loadingOwnerUpdate ? 'Updating...' : 'Update My Login Details'}
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                                      
                    <AccordionItem value="create-owner" className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
                      <AccordionTrigger className="w-full p-4 text-base font-medium text-gray-800 hover:text-gray-900 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition-all duration-200">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Create New Owner Account
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-4 bg-white/50">
                        <div className="space-y-4 pt-2">
                          <div className="space-y-2">
                            <Label htmlFor="new-owner-email">New Owner Email</Label>
                            <Input 
                              id="new-owner-email"
                              type="email"
                              placeholder="newowner@example.com"
                              value={newOwnerEmail}
                              onChange={(e) => setNewOwnerEmail(e.target.value)}
                              disabled={!isCurrentUserOwner}
                            />
                          </div>
                                            
                          <div className="space-y-2">
                            <Label htmlFor="new-owner-password">Password</Label>
                            <Input 
                              id="new-owner-password"
                              type="password"
                              placeholder="Enter password"
                              value={newOwnerPassword}
                              onChange={(e) => setNewOwnerPassword(e.target.value)}
                              disabled={!isCurrentUserOwner}
                            />
                          </div>
                                            
                          <div className="space-y-2">
                            <Label htmlFor="new-owner-confirm-password">Confirm Password</Label>
                            <Input 
                              id="new-owner-confirm-password"
                              type="password"
                              placeholder="Confirm password"
                              value={newOwnerConfirmPassword}
                              onChange={(e) => setNewOwnerConfirmPassword(e.target.value)}
                              disabled={!isCurrentUserOwner}
                            />
                          </div>
                                            
                          <Button 
                            className="w-full"
                            onClick={handleCreateNewOwner}
                            disabled={loadingNewOwner || !isCurrentUserOwner}
                          >
                            {loadingNewOwner ? 'Creating...' : 'Create New Owner'}
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Order History Section (Placeholder) */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Recent orders and activity will appear here.
                  <br />
                  {isCurrentUserOwner 
                    ? "As an owner, you can manage store operations from the dashboard." 
                    : "Place orders and track your purchases here."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}