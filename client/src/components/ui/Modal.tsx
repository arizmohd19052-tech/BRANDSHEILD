/**
 * [client/src/components/ui/Modal.tsx]
 * High-performance accessible modal dialog for BrandShield AI.
 * Free of lag-inducing backdrop-filter/blur; uses pure opacity and transform animations.
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Dark backdrop without blur for maximum performance */}
      <div
        className="fixed inset-0 bg-[#0F1B2D]/60 dark:bg-black/70 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={cn(
          'relative w-full bg-white dark:bg-[#121B25] rounded-xl border border-[#E3DFD6] dark:border-[#243140] overflow-hidden transform transition-all animate-fade-in z-10 my-6',
          maxWidthClasses[maxWidth]
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E3DFD6] dark:border-[#243140] bg-[#F7F5F0]/60 dark:bg-[#0B1118]/60">
          <div className="text-base font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
            {title}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#5B6675] hover:text-[#0F1B2D] dark:text-[#8B97A7] dark:hover:text-[#E8EDF2] hover:bg-[#E3DFD6]/60 dark:hover:bg-[#243140] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
