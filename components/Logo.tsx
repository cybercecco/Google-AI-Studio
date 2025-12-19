
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  lightText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "h-8", showText = true, lightText = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon Graphic */}
      <svg viewBox="0 0 100 100" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#1058a0" />
        <path d="M25 25 L45 50 L25 75" stroke="#71bc42" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M75 25 L55 50 L75 75" stroke="white" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`text-xl font-bold tracking-tight ${lightText ? 'text-white' : 'text-brand-blue'}`}>
            inXpire
          </span>
          <span className={`text-sm font-semibold tracking-wide ${lightText ? 'text-brand-green' : 'text-brand-green'}`}>
            It-Solutions
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
