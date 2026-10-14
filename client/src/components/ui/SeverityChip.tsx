/**
 * [client/src/components/ui/SeverityChip.tsx]
 * Accessible severity indicator using Sarvam semantic risk colours, always paired with icons and labels:
 * Critical #B3261E, High #D9622B, Medium #C99A1F, Low #2E7D5B, Verified/Official #1F6F8B.
 */

import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, ShieldCheck } from 'lucide-react';
import { RiskLevel } from '../../types/index.js';
import { cn } from '../../lib/utils.js';

export interface SeverityChipProps {
  severity: RiskLevel | string;
  className?: string;
  showIcon?: boolean;
}

export const SeverityChip: React.FC<SeverityChipProps> = ({
  severity,
  className,
  showIcon = true,
}) => {
  const config: Record<string, { bg: string; icon: React.ReactNode; label: string }> = {
    Critical: {
      bg: 'bg-[#FDF2F2] text-[#B3261E] border-[#F8B4B4] dark:bg-[#2E100F] dark:text-[#F8B4B4] dark:border-[#B3261E]/50',
      icon: <AlertCircle className="w-3.5 h-3.5 text-[#B3261E]" />,
      label: 'Critical Threat',
    },
    High: {
      bg: 'bg-[#FDF5F0] text-[#D9622B] border-[#F7C6B0] dark:bg-[#34160C] dark:text-[#F7C6B0] dark:border-[#D9622B]/50',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-[#D9622B]" />,
      label: 'High Risk',
    },
    Medium: {
      bg: 'bg-[#FEF9EC] text-[#C99A1F] border-[#F6DF9C] dark:bg-[#332709] dark:text-[#F6DF9C] dark:border-[#C99A1F]/50',
      icon: <Info className="w-3.5 h-3.5 text-[#C99A1F]" />,
      label: 'Medium Risk',
    },
    Low: {
      bg: 'bg-[#F0F9F5] text-[#2E7D5B] border-[#A8DBC5] dark:bg-[#0A261A] dark:text-[#A8DBC5] dark:border-[#2E7D5B]/50',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D5B]" />,
      label: 'Low / Benign',
    },
    Safe: {
      bg: 'bg-[#F0F7FA] text-[#1F6F8B] border-[#A2D0E0] dark:bg-[#0B242F] dark:text-[#A2D0E0] dark:border-[#1F6F8B]/50',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-[#1F6F8B]" />,
      label: 'Verified Official',
    },
  };

  const item = config[severity] || config.Low;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border select-none',
        item.bg,
        className
      )}
    >
      {showIcon && item.icon}
      <span>{item.label}</span>
    </span>
  );
};
