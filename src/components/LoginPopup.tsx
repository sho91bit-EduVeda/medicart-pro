import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/integrations/firebase/config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
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
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Account created! You are now signed in.");
        setIsOpen(false);
      }
      // Refresh auth state
      await checkAuth();
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
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
      setIsLogin(true);
      setShowSignupOption(false); // Reset signup visibility
    }
  };

  // Handle long press on dialog close button to reveal signup
  const handleDialogCloseMouseDown = () => {
    closeBtnTimer.current = setTimeout(() => {
      setShowSignupOption(true);
      toast.info("Signup option unlocked for owner access", {
        duration: 3000,
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
      toast.info("Signup option unlocked for owner access", {
        duration: 3000,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Add event listeners to the dialog's built-in close button */}
        <div 
          className="absolute top-4 right-4 z-10"
          onMouseDown={handleDialogCloseMouseDown}
          onMouseUp={handleDialogCloseMouseUp}
          onMouseLeave={handleDialogCloseMouseUp}
          onTouchStart={handleDialogCloseMouseDown}
          onTouchEnd={handleDialogCloseMouseUp}
        />
        
        <div className="relative">
          <Card className="border-0 shadow-none bg-gradient-to-br from-background to-muted">
            <CardHeader className="space-y-1 text-center pt-8 pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <ShieldCheck className="w-10 h-10 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {isLogin ? "Owner Login" : "Create Owner Account"}
              </CardTitle>
              <CardDescription>
                {isLogin
                  ? "Sign in to manage your medical store"
                  : "Create an account to start managing products"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8 px-8">
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="owner@kalyanampharmacy.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="rounded-xl"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 shadow-lg"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLogin ? "Sign In" : "Create Account"}
                </Button>
              </form>
              
              {/* Hint for owners - subtle text at the bottom */}
              {!showSignupOption && isLogin && (
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Long press close button or press Ctrl+Shift+S for owner signup
                </p>
              )}
              
              <div className="mt-4 text-center text-sm">
                {isLogin ? (
                  <>
                    {/* Signup option hidden by default, revealed for owners */}
                    {showSignupOption ? (
                      <button
                        type="button"
                        onClick={() => setIsLogin(false)}
                        className="text-primary hover:underline font-medium transition-colors"
                      >
                        Need an account? Create one
                      </button>
                    ) : (
                      <p className="text-muted-foreground">
                        Only authorized personnel
                      </p>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="text-primary hover:underline font-medium transition-colors"
                  >
                    Already have an account? Sign in
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};