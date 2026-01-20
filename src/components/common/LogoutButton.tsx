import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const LogoutButton = () => {
  const { signOut } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    }
  };

  return (
    <button
      className={`relative flex items-center justify-start w-10 h-10 border-none rounded-full cursor-pointer overflow-hidden transition-all duration-300 shadow-sm bg-red-500 hover:bg-red-600 ${isHovered ? 'w-[110px] rounded-[40px]' : ''}`}
      onClick={handleLogout}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setTimeout(() => setIsHovered(false), 300)}
    >
      <div
        className={`transition-all duration-300 flex items-center justify-center ${isHovered ? 'w-[35%] pl-4' : 'w-full'}`}
      >
        <svg
          viewBox="0 0 512 512"
          className="w-4 h-4"
        >
          <path
            d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"
            fill="white"
          />
        </svg>
      </div>
      <div
        className={`absolute right-0 text-white font-medium text-sm transition-all duration-300 ${isHovered ? 'opacity-100 w-[65%] pr-3' : 'opacity-0 w-0'}`}
      >
        Logout
      </div>
    </button>
  );
};

export default LogoutButton;