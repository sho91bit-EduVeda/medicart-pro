import React from 'react';

interface BabyIconProps {
  className?: string;
  width?: number;
  height?: number;
}

export const BabyIcon: React.FC<BabyIconProps> = ({ 
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
        <linearGradient id="babyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#facc15" />
        </linearGradient>
      </defs>
      <circle 
        cx="12" 
        cy="10" 
        r="3" 
        fill="url(#babyGradient)" 
        stroke="white" 
        strokeWidth="1"
      />
      <path 
        d="M12 13C15.3137 13 18 15.6863 18 19V20H6V19C6 15.6863 8.68629 13 12 13Z" 
        fill="url(#babyGradient)" 
        stroke="white" 
        strokeWidth="1"
      />
      <circle 
        cx="9" 
        cy="9" 
        r="1" 
        fill="white"
      />
      <circle 
        cx="15" 
        cy="9" 
        r="1" 
        fill="white"
      />
      <path 
        d="M10 16C10 16 10.5 17 12 17C13.5 17 14 16 14 16" 
        stroke="white" 
        strokeWidth="1" 
        strokeLinecap="round"
      />
    </svg>
  );
};

export default BabyIcon;