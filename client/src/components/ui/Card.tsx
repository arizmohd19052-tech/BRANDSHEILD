/**
 * [client/src/components/ui/Card.tsx]
 * High-performance container card based on Sarvam styling.
 * Fast hover lift using transform only, with no expensive filter or blur operations.
 */

import React from 'react';
import { cn } from '../../lib/utils.js';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverLift?: boolean;
  accentBorder?: 'brand' | 'social' | 'appstore' | 'lab' | 'critical' | 'high' | 'medium' | 'low' | 'verified' | 'none';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverLift = false,
  accentBorder = 'none',
  ...props
}) => {
  const accentStyles = {
    none: '',
    brand: 'border-l-4 border-l-[#0E5A52]',
    social: 'border-l-4 border-l-[#1F6F8B]',
    appstore: 'border-l-4 border-l-[#C8791A]',
    lab: 'border-l-4 border-l-[#3B5B8C]', // Steel blue
    critical: 'border-l-4 border-l-[#B3261E]',
    high: 'border-l-4 border-l-[#D9622B]',
    medium: 'border-l-4 border-l-[#C99A1F]',
    low: 'border-l-4 border-l-[#2E7D5B]',
    verified: 'border-l-4 border-l-[#1F6F8B]',
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-[#121B25] rounded-xl border border-[#E3DFD6] dark:border-[#243140] transition-transform duration-150',
        hoverLift && 'hover:-translate-y-0.5',
        accentStyles[accentBorder],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
