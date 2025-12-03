import React from 'react';
import { cn } from '../../lib/utils';

interface LogoProps {
  className?: string;
  collapsed?: boolean;
  size?: 'default' | 'large';
}

const Logo: React.FC<LogoProps> = ({ className, collapsed = false, size = 'default' }) => {
  const isLarge = size === 'large';

  return (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      {/* Icon: Hexagon with circuits */}
      <div className={cn(
        "relative flex items-center justify-center transition-all",
        isLarge ? "w-10 h-10" : "w-8 h-8"
      )}>
        <svg 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-primary"
        >
          <path 
            d="M16 2L2 10V22L16 30L30 22V10L16 2Z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-primary"
          />
          <path 
            d="M16 6V12" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-cyan-200"
          />
          <circle cx="16" cy="14" r="2" fill="currentColor" className="text-cyan-100" />
          <path 
            d="M9 10L12 12" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
             className="text-cyan-200"
          />
           <path 
            d="M23 10L20 12" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
             className="text-cyan-200"
          />
          <circle cx="10" cy="18" r="2" fill="currentColor" className="text-cyan-100" />
           <path 
            d="M10 18L13 16" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
             className="text-cyan-200"
          />
        </svg>
      </div>

      {/* Text: Hidden if collapsed */}
      {!collapsed && (
        <span className={cn(
          "font-bold tracking-tight text-white animate-in fade-in duration-300",
          isLarge ? "text-2xl" : "text-xl"
        )}>
          Criativo.io
        </span>
      )}
    </div>
  );
};

export default Logo;