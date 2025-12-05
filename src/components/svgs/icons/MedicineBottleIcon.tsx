import React from 'react';

interface MedicineBottleIconProps {
  className?: string;
  width?: number;
  height?: number;
}

export const MedicineBottleIcon: React.FC<MedicineBottleIconProps> = ({ 
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
        <linearGradient id="bottleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
      </defs>
      <path 
        d="M6 4H18V20H6V4Z" 
        fill="url(#bottleGradient)" 
        stroke="white" 
        strokeWidth="1"
      />
      <path 
        d="M6 8H18" 
        stroke="white" 
        strokeWidth="1"
      />
      <path 
        d="M6 12H18" 
        stroke="white" 
        strokeWidth="1"
      />
      <path 
        d="M6 16H18" 
        stroke="white" 
        strokeWidth="1"
      />
      <path 
        d="M10 4V2" 
        stroke="white" 
        strokeWidth="1" 
        strokeLinecap="round"
      />
      <path 
        d="M14 4V2" 
        stroke="white" 
        strokeWidth="1" 
        strokeLinecap="round"
      />
      <rect 
        x="8" 
        y="2" 
        width="8" 
        height="2" 
        rx="1" 
        fill="white"
      />
    </svg>
  );
};

export default MedicineBottleIcon;