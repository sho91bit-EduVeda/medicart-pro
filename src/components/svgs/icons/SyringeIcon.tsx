import React from 'react';

interface SyringeIconProps {
  className?: string;
  width?: number;
  height?: number;
}

export const SyringeIcon: React.FC<SyringeIconProps> = ({ 
  className = '', 
  width = 24, 
  height = 24 
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 24 24" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="syringeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <path 
        d="M3 10L10 10" 
        stroke="url(#syringeGradient)" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M7 6L7 14" 
        stroke="url(#syringeGradient)" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M10 7L18 7" 
        stroke="url(#syringeGradient)" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M14 3L21 10" 
        stroke="url(#syringeGradient)" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M14 11L21 18" 
        stroke="url(#syringeGradient)" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M18 14L18 21" 
        stroke="url(#syringeGradient)" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <circle 
        cx="18" 
        cy="10" 
        r="2" 
        fill="url(#syringeGradient)"
      />
    </svg>
  );
};

export default SyringeIcon;