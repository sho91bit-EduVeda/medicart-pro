import React from 'react';

interface StethoscopeIconProps {
  className?: string;
  width?: number;
  height?: number;
}

export const StethoscopeIcon: React.FC<StethoscopeIconProps> = ({ 
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
        <linearGradient id="stethoscopeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <path 
        d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" 
        fill="url(#stethoscopeGradient)" 
        stroke="white" 
        strokeWidth="1"
      />
      <path 
        d="M16 8L20 8" 
        stroke="url(#stethoscopeGradient)" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M4 8L8 8" 
        stroke="url(#stethoscopeGradient)" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M12 12L12 16" 
        stroke="url(#stethoscopeGradient)" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M8 16L16 16" 
        stroke="url(#stethoscopeGradient)" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M8 20L16 20" 
        stroke="url(#stethoscopeGradient)" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <circle 
        cx="8" 
        cy="20" 
        r="2" 
        fill="url(#stethoscopeGradient)"
      />
      <circle 
        cx="16" 
        cy="20" 
        r="2" 
        fill="url(#stethoscopeGradient)"
      />
    </svg>
  );
};

export default StethoscopeIcon;