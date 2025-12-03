import React from 'react';

interface KalyanamLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export const KalyanamLogo: React.FC<KalyanamLogoProps> = ({ 
  className = '', 
  width = 24, 
  height = 24 
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 100 100" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Elegant gradient with professional colors */}
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" /> {/* Cyan */}
          <stop offset="100%" stopColor="#0891b2" /> {/* Teal */}
        </linearGradient>
        
        {/* Soft shadow for depth */}
        <filter id="logoShadow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="3" result="offsetblur" />
          <feFlood floodColor="rgba(0,0,0,0.25)" />
          <feComposite in2="offsetblur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Subtle inner highlight */}
        <filter id="innerHighlight" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
          <feSpecularLighting in="blur" surfaceScale="2" specularConstant="0.75" specularExponent="15" lightingColor="#ffffff" result="spec">
            <fePointLight x="40" y="40" z="60" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceGraphic" operator="in" result="composite1" />
          <feComposite in="SourceGraphic" in2="composite1" operator="arithmetic" k1="0" k2="1" k3="0.7" k4="0" />
        </filter>
      </defs>
      
      {/* Pill-shaped capsule background */}
      <rect 
        x="15" 
        y="25" 
        width="70" 
        height="50" 
        rx="25" 
        fill="url(#logoGradient)" 
        filter="url(#logoShadow)"
      />
      
      {/* Capsule highlight */}
      <rect 
        x="18" 
        y="28" 
        width="64" 
        height="44" 
        rx="22" 
        fill="none" 
        stroke="rgba(255,255,255,0.4)" 
        strokeWidth="1"
      />
      
      {/* Letter "K" in elegant typography */}
      <path 
        d="M35 35 L35 65 M35 50 L50 35 M35 50 L50 65" 
        stroke="white" 
        strokeWidth="5" 
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#innerHighlight)"
      />
      
      {/* Letter "P" in matching style */}
      <path 
        d="M55 35 L55 65 M55 35 L65 35 M65 35 L65 50 M65 50 L55 50" 
        stroke="white" 
        strokeWidth="5" 
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#innerHighlight)"
      />
    </svg>
  );
};

export default KalyanamLogo;