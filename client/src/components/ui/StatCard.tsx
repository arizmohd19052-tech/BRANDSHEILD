/**
 * [client/src/components/ui/StatCard.tsx]
 * High-performance metric card with animated count-up and Sarvam styling.
 */

import React, { useEffect, useState } from 'react';
import { Card } from './Card.js';
import { cn } from '../../lib/utils.js';

export interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  trend?: string;
  accentBorder?: 'brand' | 'social' | 'appstore' | 'lab' | 'critical' | 'high' | 'medium' | 'low' | 'verified' | 'none';
}

function useCountUp(target: number, duration: number = 350): number {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(target);
      return;
    }

    let start = 0;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + (target - start) * easeProgress));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  return count;
}

export const StatCard: React.FC<StatCardProps> = React.memo(({
  title,
  value,
  subtitle,
  icon,
  iconBg = 'bg-[#E6F0EE] dark:bg-[#0E5A52]/20',
  iconColor = 'text-[#0E5A52] dark:text-[#A8DBC5]',
  trend,
  accentBorder = 'none',
}) => {
  const isNumeric = typeof value === 'number';
  const animatedValue = isNumeric ? useCountUp(value as number) : value;

  return (
    <Card hoverLift accentBorder={accentBorder} className="p-5 relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[#5B6675] dark:text-[#8B97A7] uppercase tracking-wider">
            {title}
          </p>
          <p className="text-3xl font-bold text-[#0F1B2D] dark:text-[#E8EDF2] mt-1.5 tracking-tight">
            {animatedValue}
          </p>
          {subtitle && (
            <p className="text-xs text-[#5B6675] dark:text-[#8B97A7] mt-1">
              {subtitle}
            </p>
          )}
          {trend && (
            <span className="inline-block mt-2 text-xs font-medium text-[#2E7D5B] dark:text-[#A8DBC5]">
              {trend}
            </span>
          )}
        </div>
        <div
          className={cn(
            'p-2.5 rounded-lg flex-shrink-0 transition-transform duration-150',
            iconBg,
            iconColor
          )}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
});
