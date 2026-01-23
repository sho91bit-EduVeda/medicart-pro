import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { auth, db } from '@/integrations/firebase/config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, ShieldCheck, User, Building2, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface UnifiedAuthProps {
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export const UnifiedAuth = ({ trigger, onSuccess }: UnifiedAuthProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showProfileUpdate, setShowProfileUpdate] = useState(false);
  const [tempUserId, setTempUserId] = useState('');
  const [tempUserData, setTempUserData] = useState({ name: '', phone: '' });
  
  const { checkAuth } = useAuth();
  const { initializeAuth: initializeCustomerAuth } = useCustomerAuth();

  const validateInputs = (isSignUp: boolean) => {
    if (!email.trim()) {
      toast.error('Please enter your email');
      return false;
    }
    
    if (!password) {
      toast.error('Please enter your password');
      return false;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }
    
    if (isSignUp) {
      if (!email.trim()) {
        toast.error('Please enter your email');
        return false;
      }
      
      if (!password) {
        toast.error('Please enter your password');
        return false;
      }
      
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return false;
      }
    }
    
    return true;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs(false)) {
      return;
    }

    setLoading(true);
    try {
      // Authenticate user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check user role from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      let role = 'CUSTOMER'; // Default role
      
      if (userDoc.exists()) {
        role = userDoc.data().role || 'CUSTOMER';
      } else {
        // Check if user exists in customers collection (backward compatibility)
        const customerDoc = await getDoc(doc(db, "customers", user.uid));
        if (customerDoc.exists()) {
          role = 'CUSTOMER';
        } else {
          // Check if user exists in legacy users collection
          const legacyUserDoc = await getDoc(doc(db, "users", user.uid));
          if (legacyUserDoc.exists() && legacyUserDoc.data().role === 'owner') {
            role = 'OWNER';
          }
        }
      }
      
      toast.success("Welcome back!");
      
      // Refresh auth state to update UI
      await checkAuth();
      
      // Role-based redirection
      if (role === 'OWNER') {
        navigate('/owner');
      } else {
        navigate('/');
      }
      
      setOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      let errorMessage = "Failed to sign in. Please try again.";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format.";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled.";
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For signup, only validate email and password
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    
    if (!password) {
      toast.error('Please enter your password');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update user profile with email as display name temporarily
      await updateProfile(user, {
        displayName: email
      });
      
      // Attempt to create user documents, but handle permission errors gracefully
      try {
        // Create unified user document with CUSTOMER role (owners must be created separately)
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          role: 'CUSTOMER',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } catch (userError) {
        console.warn("Could not create user document due to permissions. This may require admin processing.", userError);
      }
      
      try {
        // Create customer document for backward compatibility
        await setDoc(doc(db, "customers", user.uid), {
          email: email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } catch (customerError) {
        console.warn("Could not create customer document due to permissions. This may require admin processing.", customerError);
      }
      
      toast.success("Account created successfully!");
      
      // Refresh auth state to update UI
      await checkAuth();
      
      // Set temporary user data and show profile update modal
      setTempUserId(user.uid);
      setShowProfileUpdate(true);
      
      // Keep the main modal open, only loading state changes
      setLoading(false);
    } catch (error: any) {
      console.error("Sign up error:", error);
      let errorMessage = "Failed to create account. Please try again.";
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password must be at least 6 characters long.";
      } else if (error.message.includes("Password must be at least")) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset form when closing
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
      // Also close profile update modal if open
      setShowProfileUpdate(false);
    }
  };

  const handleProfileUpdateOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setShowProfileUpdate(false);
      setOpen(false); // Also close main dialog when profile update is cancelled
    }
  };

  const handleProfileUpdate = async () => {
    if (!tempUserData.name.trim() || !tempUserData.phone.trim()) {
      toast.error('Please fill in both name and phone number');
      return;
    }

    try {
      // Update user profile
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, {
          displayName: tempUserData.name
        });
      }
      
      // Update user document in Firestore
      try {
        const userDocRef = doc(db, "users", tempUserId);
        await updateDoc(userDocRef, {
          name: tempUserData.name,
          phone: tempUserData.phone,
          updated_at: new Date().toISOString()
        });
      } catch (userUpdateError) {
        console.warn("Could not update user document due to permissions. This may require admin processing.", userUpdateError);
      }
      
      // Update customer document for backward compatibility
      try {
        const customerDocRef = doc(db, "customers", tempUserId);
        await updateDoc(customerDocRef, {
          name: tempUserData.name,
          phone: tempUserData.phone,
          updated_at: new Date().toISOString()
        });
      } catch (customerUpdateError) {
        console.warn("Could not update customer document due to permissions. This may require admin processing.", customerUpdateError);
      }
      
      toast.success("Profile updated successfully!");
      
      // Refresh auth state to update UI
      await checkAuth();
      await initializeCustomerAuth();
      
      // Close the profile update modal and main modal
      setShowProfileUpdate(false);
      setOpen(false);
      
      // Navigate to home page
      navigate('/');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    }
  };

  return (
    <>
      {/* Main Auth Dialog */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg max-h-[90vh] h-auto flex flex-col p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <DialogHeader className="relative z-10">
              <div className="flex justify-center mb-3">
                <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-white text-center">
                Welcome to Kalyanam Pharmaceuticals
              </DialogTitle>
              <p className="text-blue-100 mt-1 text-center text-sm">
                Sign in or create an account to get started
              </p>
            </DialogHeader>
          </div>
          
          {/* Content Area with Background Pattern */}
          <div className="flex-1 bg-slate-50 relative p-6">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0" style={
              {
                backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                opacity: 0.3
              }
            }></div>
            
            <div className="relative z-10">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Login
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="pt-2">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-slate-700 font-medium">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="rounded-lg border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-slate-700 font-medium">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="rounded-lg border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-11 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 shadow-lg shadow-blue-200 text-white font-medium" 
                      disabled={loading}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup" className="pt-2">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-slate-700 font-medium">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="rounded-lg border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-slate-700 font-medium">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="rounded-lg border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500"
                      />
                      <p className="text-xs text-slate-600 mt-1">
                        Password must be at least 6 characters long
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        type="submit" 
                        className="flex-1 h-11 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 shadow-lg shadow-blue-200 text-white font-medium" 
                        disabled={loading}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Account
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="p-2 rounded-full bg-slate-200/50 hover:bg-slate-300/50 transition-colors cursor-pointer">
                              <Info className="w-4 h-4 text-slate-600" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-slate-800 text-white text-xs p-3 border-0 shadow-lg">
                            <p className="font-medium mb-1">Important Notice:</p>
                            <p>Only customer accounts can be created publicly.</p>
                            <p className="mt-1">Owner accounts must be created by administrators.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Profile Update Modal - Separate Dialog for better UX */}
      <Dialog open={showProfileUpdate} onOpenChange={handleProfileUpdateOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] h-auto flex flex-col p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <DialogHeader className="relative z-10">
              <div className="flex justify-center mb-3">
                <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                  <Info className="w-8 h-8 text-white" />
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-white text-center">
                Complete Your Profile
              </DialogTitle>
              <p className="text-blue-100 mt-1 text-center text-sm">
                Please update your details to continue
              </p>
            </DialogHeader>
          </div>
          
          {/* Content Area with Background Pattern */}
          <div className="flex-1 bg-slate-50 relative p-6">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0" style={
              {
                backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                opacity: 0.3
              }
            }></div>
            
            <div className="relative z-10">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleProfileUpdate();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="profile-name" className="text-slate-700 font-medium">Full Name</Label>
                  <Input
                    id="profile-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={tempUserData.name}
                    onChange={(e) => setTempUserData({...tempUserData, name: e.target.value})}
                    required
                    className="rounded-lg border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-phone" className="text-slate-700 font-medium">Phone Number</Label>
                  <Input
                    id="profile-phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={tempUserData.phone}
                    onChange={(e) => setTempUserData({...tempUserData, phone: e.target.value})}
                    required
                    className="rounded-lg border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 shadow-lg shadow-blue-200 text-white font-medium" 
                >
                  Continue to Website
                </Button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};