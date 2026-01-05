import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ShinyButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  icon?: LucideIcon | 'play-svg';
  bgColor?: string;
  hoverColor?: string;
  shadowColor?: string;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  paddingX?: string; // e.g., 'px-8', 'px-4'
  paddingY?: string; // e.g., 'py-3', 'py-2'
  textSize?: string; // e.g., 'text-sm', 'text-lg', 'md:text-xl'
}

export const ShinyButton: React.FC<ShinyButtonProps> = ({
  onClick,
  disabled = false,
  children,
  icon: Icon,
  bgColor = 'bg-indianred',
  hoverColor = 'hover:bg-red-700',
  shadowColor = 'hover:shadow-red-500/30',
  className = '',
  type = 'button',
  paddingX = 'px-8',
  paddingY = 'py-3',
  textSize = 'text-base md:text-xl',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`group/button relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-xl ${bgColor} ${hoverColor} ${paddingX} ${paddingY} font-bold ${textSize} text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg ${shadowColor} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${className}`}
    >
      {Icon && (
        <span className="flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded text-white">
          {Icon === 'play-svg' ? (
            <svg
              aria-hidden="true"
              className="h-6 w-6 md:h-8 md:w-8"
              viewBox="0 0 12 12"
              fill="currentColor"
            >
              <path d="M4 3.065v5.87a.4.4 0 0 0 .623.331l4.268-2.935a.4.4 0 0 0 0-.662L4.623 2.064A.4.4 0 0 0 4 2.395Z" />
            </svg>
          ) : (
            <Icon className="h-6 w-6 md:h-8 md:w-8" />
          )}
        </span>
      )}
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)] pointer-events-none">
        <div className="relative h-full w-10 md:w-16 bg-white/30" />
      </div>
    </button>
  );
};
