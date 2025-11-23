
import React from 'react';

interface BrandLogoProps {
    className?: string;
    showText?: boolean;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ className = "", showText = true }) => {
  return (
    <div className={`inline-flex items-center gap-2 sm:gap-2.5 select-none ${className} group`}>
       {/* Logo Icon: Stylized Play Button / Chip - Responsive Sizing */}
       <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl border border-gray-700/80 shadow-lg overflow-hidden transition-transform duration-300 group-hover:scale-105 group-hover:border-teal-500/30">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Geometric Shapes */}
          <svg className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 4L16 12L6 20V4Z" className="fill-teal-400 group-hover:fill-teal-300 transition-colors" />
            <path d="M18 4V20" stroke="#D946EF" strokeWidth="2.5" strokeLinecap="round" className="group-hover:stroke-purple-400 transition-colors shadow-sm" />
          </svg>
       </div>
       
       {/* Typography - Responsive Sizing */}
       {showText && (
           <div className="font-black text-xl sm:text-2xl tracking-tighter flex items-baseline leading-none">
              <span className="text-gray-100 drop-shadow-sm">Y2</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400 drop-shadow-sm">Tube</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-fuchsia-500 to-pink-500 text-2xl sm:text-3xl ml-0.5 italic relative -top-0.5 drop-shadow-[0_2px_10px_rgba(217,70,239,0.4)]">X</span>
           </div>
       )}
    </div>
  );
};

export default BrandLogo;
