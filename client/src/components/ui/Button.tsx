/**
 * [client/src/components/ui/Button.tsx]
 * Mature, high-contrast button component based on the Sarvam palette.
 * Free of all purple/neon gradients; uses deep teal, warm amber, and steel blue.
 */

import React from 'react';
import { cn } from '../../lib/utils.js';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'brand' | 'accent' | 'social' | 'appstore' | 'lab' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none transform hover:-translate-y-0.5 active:translate-y-0';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-2.5 gap-2.5 font-semibold',
  };

  const variantStyles = {
    primary: 'bg-[#0E5A52] hover:bg-[#0A443E] text-white shadow-sm focus:ring-[#0E5A52] border-0',
    secondary: 'bg-[#F7F5F0] hover:bg-[#E3DFD6] text-[#0F1B2D] dark:bg-[#121B25] dark:hover:bg-[#243140] dark:text-[#E8EDF2] border border-[#E3DFD6] dark:border-[#243140]',
    outline: 'border border-[#E3DFD6] dark:border-[#243140] hover:bg-[#F7F5F0] dark:hover:bg-[#121B25] text-[#0F1B2D] dark:text-[#E8EDF2]',
    ghost: 'hover:bg-[#F7F5F0] dark:hover:bg-[#121B25] text-[#5B6675] dark:text-[#8B97A7] hover:text-[#0F1B2D] dark:hover:text-[#E8EDF2]',
    brand: 'bg-[#0E5A52] hover:bg-[#0A443E] text-white focus:ring-[#0E5A52]',
    accent: 'bg-[#C8791A] hover:bg-[#A96312] text-white focus:ring-[#C8791A]',
    social: 'bg-[#1F6F8B] hover:bg-[#17556B] text-white focus:ring-[#1F6F8B]',
    appstore: 'bg-[#C8791A] hover:bg-[#A96312] text-white focus:ring-[#C8791A]',
    lab: 'bg-[#3B5B8C] hover:bg-[#2F4970] text-white focus:ring-[#3B5B8C]', // Steel blue
    danger: 'bg-[#B3261E] hover:bg-[#961F18] text-white focus:ring-[#B3261E]',
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
};
