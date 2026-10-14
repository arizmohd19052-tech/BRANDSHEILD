/**
 * [client/src/components/ui/SourceStatusBadge.tsx]
 * Source health status indicator for external adapters.
 */

import React from 'react';
import { cn } from '../../lib/utils.js';

export interface SourceStatusBadgeProps {
  status: 'ok' | 'rate-limited' | 'unavailable' | 'disabled';
  name?: string;
  className?: string;
}

export const SourceStatusBadge: React.FC<SourceStatusBadgeProps> = ({
  status,
  name,
  className,
}) => {
  const styles = {
    ok: {
      dot: 'bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      text: 'Operational',
    },
    'rate-limited': {
      dot: 'bg-amber-500 animate-pulse',
      badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      text: 'Rate Limited (429)',
    },
    unavailable: {
      dot: 'bg-red-500',
      badge: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800',
      text: 'Unavailable',
    },
    disabled: {
      dot: 'bg-slate-400',
      badge: 'bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-slate-200 dark:border-slate-800',
      text: 'Disabled',
    },
  };

  const current = styles[status] || styles.ok;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border select-none',
        current.badge,
        className
      )}
    >
      <span className={cn('w-2 h-2 rounded-full', current.dot)} />
      {name && <span className="font-semibold text-slate-800 dark:text-slate-200">{name}:</span>}
      <span>{current.text}</span>
    </span>
  );
};
