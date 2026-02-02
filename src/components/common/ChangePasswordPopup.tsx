import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import ChangePasswordForm from './ChangePasswordForm';

interface ChangePasswordPopupProps {
  children: React.ReactNode;
  refreshUserData?: () => void;
}

const ChangePasswordPopup: React.FC<ChangePasswordPopupProps> = ({ children, refreshUserData }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl border-0 shadow-2xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => {
          // Prevent pointer events from propagating to underlying components
          e.preventDefault();
          e.stopPropagation();
        }}
        onInteractOutside={(e) => {
          // Prevent interactions from affecting other components
          e.preventDefault();
          e.stopPropagation();
        }}
        onEscapeKeyDown={(e) => {
          // Prevent escape key from triggering other components
          e.preventDefault();
          e.stopPropagation();
        }}
        onCloseAutoFocus={(e) => {
          // Prevent focus events from triggering other components
          e.preventDefault();
          e.stopPropagation();
          // Blur the active element to prevent focus from going to the underlying component
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }}
      >
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <DialogHeader className="relative z-10">
            <div className="flex justify-center mb-2">
              <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
            <DialogTitle className="text-lg font-bold tracking-tight text-white text-center">
              Change Password
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-center mt-1 text-sm">
              Update your password here
            </DialogDescription>
          </DialogHeader>
        </div>
        
        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto p-6 bg-slate-50 relative"
          onClick={(e) => {
            // Prevent click events from bubbling up to parent components
            e.stopPropagation();
          }}
        >
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            opacity: 0.3
          }}></div>
            
          <div className="relative z-10">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-200 mb-4">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Change Password</h3>
              </div>
              <ChangePasswordForm 
                onClose={() => setIsOpen(false)} 
                onSuccess={() => setIsOpen(false)}
                refreshUserData={refreshUserData}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordPopup;