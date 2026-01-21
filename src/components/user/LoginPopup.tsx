import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { auth, db } from "@/integrations/firebase/config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LoginPopupProps {
  trigger: React.ReactNode;
}

export const LoginPopup = ({ trigger }: LoginPopupProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // Add name state for signup
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [showSignupOption, setShowSignupOption] = useState(false);
  const closeBtnTimer = useRef<NodeJS.Timeout | null>(null);

  const { checkAuth } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Welcome back!");
        setIsOpen(false);
      } else {
        // For signup, we need to collect the owner's name
        if (!name.trim()) {
          toast.error("Please enter your name");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update user profile with display name
        await updateProfile(user, {
          displayName: name
        });

        // Save additional user info to Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          name: name,
          createdAt: new Date().toISOString(),
          role: "owner"
        });

        toast.success("Account created! You are now signed in.");
        setIsOpen(false);
      }
      // Refresh auth state
      await checkAuth();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Authentication failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    // Reset form when closing
    if (!open) {
      setEmail("");
      setPassword("");
      setName(""); // Reset name field
      setIsLogin(true);
      setShowSignupOption(false); // Reset signup visibility
    }
  };

  // Handle long press on dialog close button to reveal signup
  const handleDialogCloseMouseDown = () => {
    closeBtnTimer.current = setTimeout(() => {
      setShowSignupOption(true);
      toast.info("Owner signup option unlocked! Enter your full name during signup.", {
        duration: 5000,
      });
    }, 2000); // 2 seconds long press
  };

  const handleDialogCloseMouseUp = () => {
    if (closeBtnTimer.current) {
      clearTimeout(closeBtnTimer.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Press Ctrl+Shift+S to reveal signup (for owners who know the shortcut)
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      setShowSignupOption(true);
      toast.info("Owner signup option unlocked! Enter your full name during signup.", {
        duration: 5000,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md h-full overflow-y-auto p-0 overflow-hidden rounded-2xl border-0 shadow-2xl"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Add event listeners to the dialog's built-in close button */}
        <div
          className="absolute top-4 right-4 z-[60]"
          onMouseDown={handleDialogCloseMouseDown}
          onMouseUp={handleDialogCloseMouseUp}
          onMouseLeave={handleDialogCloseMouseUp}
          onTouchStart={handleDialogCloseMouseDown}
          onTouchEnd={handleDialogCloseMouseUp}
        />

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
              {isLogin ? "Owner Login" : "Create Owner Account"}
            </DialogTitle>
            <p className="text-blue-100 mt-1 text-center text-sm">
              {isLogin
                ? "Sign in to manage your medical store"
                : "Create an account to start managing products"}
            </p>
          </DialogHeader>
        </div>

        {/* Form Content */}
        <div className="p-6 bg-slate-50 relative">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            opacity: 0.3
          }}></div>

          <div className="relative z-10">
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 font-medium">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-lg border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="owner@kalyanampharmacy.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-lg border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                <Input
                  id="password"
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
                {isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              {isLogin ? (
                <>
                  {/* Signup option hidden by default, revealed for owners */}
                  {showSignupOption ? (
                    <button
                      type="button"
                      onClick={() => setIsLogin(false)}
                      className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
                    >
                      Need an account? Create one
                    </button>
                  ) : (
                    <p className="text-slate-500">
                      Only authorized personnel. <br />
                      <span className="text-xs text-blue-500/70">(Long press X or Ctrl+Shift+S to unlock signup)</span>
                    </p>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
                >
                  Already have an account? Sign in
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};