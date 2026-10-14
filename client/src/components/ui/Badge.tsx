/**
 * [client/src/components/ui/Badge.tsx]
 * Modular tinted badge chip for BrandShield AI.
 * Free of all purple colors; supports steel blue for lab, deep teal for brand, and dataClass tags.
 */

import React from 'react';
import { cn } from '../../lib/utils.js';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'brand' | 'social' | 'appstore' | 'lab' | 'synthetic' | 'verified' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  ...props
}) => {
  const styles = {
    default: 'bg-[#F7F5F0] text-[#0F1B2D] dark:bg-[#121B25] dark:text-[#E8EDF2] border-[#E3DFD6] dark:border-[#243140]',
    brand: 'bg-[#E6F0EE] text-[#0E5A52] dark:bg-[#0E5A52]/20 dark:text-[#A8DBC5] border-[#0E5A52]/20',
    social: 'bg-[#F0F7FA] text-[#1F6F8B] dark:bg-[#1F6F8B]/20 dark:text-[#A2D0E0] border-[#1F6F8B]/20',
    appstore: 'bg-[#FDF4E9] text-[#C8791A] dark:bg-[#C8791A]/20 dark:text-[#F6DF9C] border-[#C8791A]/20',
    lab: 'bg-[#EBF1F9] text-[#3B5B8C] dark:bg-[#3B5B8C]/20 dark:text-[#A0B8DE] border-[#3B5B8C]/30', // Steel blue
    synthetic: 'bg-[#FEF9EC] text-[#C8791A] dark:bg-[#332709] dark:text-[#F6DF9C] border-[#F6DF9C] dark:border-[#C99A1F]/30',
    verified: 'bg-[#F0F7FA] text-[#1F6F8B] dark:bg-[#0B242F] dark:text-[#A2D0E0] border-[#A2D0E0] dark:border-[#1F6F8B]/30',
    outline: 'bg-transparent text-[#5B6675] dark:text-[#8B97A7] border-[#E3DFD6] dark:border-[#243140]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border select-none',
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
