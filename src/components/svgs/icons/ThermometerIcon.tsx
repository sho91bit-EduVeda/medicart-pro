import React from 'react';

interface ThermometerIconProps {
  className?: string;
  width?: number;
  height?: number;
}

export const ThermometerIcon: React.FC<ThermometerIconProps> = ({ 
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
        <linearGradient id="thermometerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <path 
        d="M12 4V20" 
        stroke="url(#thermometerGradient)" 
        strokeWidth="3" 
        strokeLinecap="round"
      />
      <circle 
        cx="12" 
        cy="6" 
        r="3" 
        fill="url(#thermometerGradient)"
      />
      <path 
        d="M12 18C13.6569 18 15 16.6569 15 15C15 13.3431 13.6569 12 12 12C10.3431 12 9 13.3431 9 15C9 16.6569 10.3431 18 12 18Z" 
        fill="url(#thermometerGradient)"
      />
    </svg>
  );
};

export default ThermometerIcon;