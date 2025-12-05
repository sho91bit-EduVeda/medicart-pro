import React from 'react';

interface HeartPulseIconProps {
  className?: string;
  width?: number;
  height?: number;
}

export const HeartPulseIcon: React.FC<HeartPulseIconProps> = ({ 
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
        <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <path 
        d="M20.84 4.61C20.33 4.1 19.68 3.85 19 3.85C18.32 3.85 17.67 4.1 17.16 4.61L12 9.77L6.84 4.61C6.33 4.1 5.68 3.85 5 3.85C4.32 3.85 3.67 4.1 3.16 4.61C2.14 5.63 2.14 7.28 3.16 8.3L12 17.14L20.84 8.3C21.86 7.28 21.86 5.63 20.84 4.61Z" 
        fill="url(#heartGradient)" 
        stroke="white" 
        strokeWidth="1"
      />
      <path 
        d="M8 12H10L12 16L14 12H16" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default HeartPulseIcon;