import React from 'react';

interface PillIconProps {
  className?: string;
  width?: number;
  height?: number;
}

export const PillIcon: React.FC<PillIconProps> = ({ 
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
        <linearGradient id="pillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <path 
        d="M12 4C8.676 4 6 6.676 6 10C6 13.324 8.676 16 12 16C15.324 16 18 13.324 18 10C18 6.676 15.324 4 12 4Z" 
        fill="url(#pillGradient)" 
        stroke="white" 
        strokeWidth="1"
      />
      <path 
        d="M10 8L14 12" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M14 8L10 12" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
    </svg>
  );
};

export default PillIcon;