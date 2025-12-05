import React from 'react';

interface BandageIconProps {
  className?: string;
  width?: number;
  height?: number;
}

export const BandageIcon: React.FC<BandageIconProps> = ({ 
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
        <linearGradient id="bandageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="100%" stopColor="#f87171" />
        </linearGradient>
      </defs>
      <rect 
        x="6" 
        y="6" 
        width="12" 
        height="12" 
        rx="2" 
        fill="url(#bandageGradient)" 
        stroke="white" 
        strokeWidth="1"
      />
      <path 
        d="M10 10L14 14" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M14 10L10 14" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
    </svg>
  );
};

export default BandageIcon;