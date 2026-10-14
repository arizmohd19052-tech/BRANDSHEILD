/**
 * [client/src/components/Navbar.tsx]
 * Sticky top navbar for BrandShield AI.
 * Follows the mature Sarvam design language: warm paper/ink background, deep teal accents,
 * persistent Demo Dataset badge, brand switcher, and Run Demo Analysis CTA.
 */

import React from 'react';
import { Shield, Moon, Sun, RefreshCw, Database } from 'lucide-react';
import { Button } from './ui/Button.js';
import { cn } from '../lib/utils.js';
import { BrandProfile } from '../types/index.js';
import { api } from '../lib/api.js';

export interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  brands: BrandProfile[];
  selectedBrand: string;
  onSelectBrand: (brandName: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onRunScan: () => void;
  isScanning: boolean;
  threatCount?: number;
}

export const Navbar: React.FC<NavbarProps> = React.memo(({
  activeTab,
  onTabChange,
  brands,
  selectedBrand,
  onSelectBrand,
  darkMode,
  onToggleDarkMode,
  onRunScan,
  isScanning,
  threatCount = 0,
}) => {
  const [aiInfo, setAiInfo] = React.useState<{
    status: 'available' | 'degraded' | 'unavailable' | 'checking';
    model?: string;
    reason?: string | null;
  }>({ status: 'checking', model: 'gemini-3.8-flash' });

  React.useEffect(() => {
    let mounted = true;
    const checkAiHealth = () => {
      api.getHealth()
        .then((res: any) => {
          if (mounted) {
            const aiData = typeof res.ai === 'object' && res.ai !== null ? res.ai : null;
            const status = aiData
              ? aiData.status
              : (res.aiStatus || (res.ai === 'available' ? 'available' : res.ai === 'degraded' ? 'degraded' : 'unavailable'));
            const model = aiData?.model || res.model || 'gemini-3.8-flash';
            const reason = aiData?.lastError || null;
            setAiInfo({ status, model, reason });
          }
        })
        .catch(() => {
          if (mounted) setAiInfo({ status: 'unavailable', reason: 'Backend unreachable' });
        });
    };
    checkAiHealth();
    return () => {
      mounted = false;
    };
  }, [isScanning]);

  const navItems = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'ingest', label: 'Ingest & Check' },
    { id: 'detections', label: `Detections (${threatCount})` },
    { id: 'profile', label: 'Brand Profile' },
    { id: 'lab', label: 'Look-alike Lab' },
    { id: 'excluded', label: 'Asset Auditor' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFFFF] dark:bg-[#121B25] border-b border-[#E3DFD6] dark:border-[#243140] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Wordmark */}
        <div
          onClick={() => onTabChange('dashboard')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-lg bg-[#0E5A52] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-[#0F1B2D] dark:text-[#E8EDF2] tracking-tight">
                BrandShield<span className="text-[#0E5A52] dark:text-[#2E7D5B]">.AI</span>
              </span>
            </div>
            <span className="block text-[10px] text-[#5B6675] dark:text-[#8B97A7] font-medium tracking-wide -mt-0.5">
              Digital Brand Protection
            </span>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#F7F5F0] dark:bg-[#0B1118] p-1 rounded-lg border border-[#E3DFD6] dark:border-[#243140]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
                activeTab === item.id
                  ? 'bg-white dark:bg-[#121B25] text-[#0E5A52] dark:text-[#2E7D5B] font-semibold shadow-xs'
                  : 'text-[#5B6675] dark:text-[#8B97A7] hover:text-[#0F1B2D] dark:hover:text-[#E8EDF2]'
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right: Brand Selector, Demo Dataset Badge, Theme Toggle & CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Brand Selector Dropdown */}
          {brands.length > 0 && (
            <div className="relative">
              <select
                value={selectedBrand}
                onChange={(e) => onSelectBrand(e.target.value)}
                className="text-xs font-medium bg-[#F7F5F0] dark:bg-[#0B1118] text-[#0F1B2D] dark:text-[#E8EDF2] border border-[#E3DFD6] dark:border-[#243140] rounded-md px-2.5 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-[#0E5A52] cursor-pointer"
                title="Filter monitored brand profile"
              >
                <option value="All">All Brands ({brands.length})</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.brandName}>
                    {b.brandName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Persistent Demo Dataset Badge */}
          <div
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#E6F0EE] text-[#0E5A52] border border-[#0E5A52]/20 dark:bg-[#0E5A52]/20 dark:text-[#A8DBC5] dark:border-[#0E5A52]/30 select-none"
            title="Analysis operates against verified public profiles and synthetic test candidates"
          >
            <Database className="w-3.5 h-3.5 text-[#0E5A52] dark:text-[#A8DBC5]" />
            <span className="text-[11px] font-semibold tracking-wide">Demo Dataset</span>
          </div>

          {/* AI: on/degraded/off Badge */}
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border select-none transition-colors',
              aiInfo.status === 'available'
                ? 'bg-[#E6F0EE] text-[#0E5A52] border-[#0E5A52]/30 dark:bg-[#0E5A52]/20 dark:text-[#A8DBC5] dark:border-[#0E5A52]/40'
                : aiInfo.status === 'degraded'
                ? 'bg-[#FEF7EC] text-[#B45309] border-[#B45309]/30 dark:bg-[#B45309]/20 dark:text-[#FCD34D] dark:border-[#B45309]/40'
                : 'bg-[#F7F5F0] text-[#7A8699] border-[#E3DFD6] dark:bg-[#121B25] dark:text-[#8B97A7] dark:border-[#243140]'
            )}
            title={
              aiInfo.status === 'available'
                ? `AI Enrichment Active (Model: ${aiInfo.model || 'gemini-3.8-flash'})`
                : aiInfo.status === 'degraded'
                ? `AI Enrichment Degraded (${aiInfo.reason || 'Recent timeouts or quota limits'})`
                : `AI Enrichment Offline (${aiInfo.reason || 'No API key or rule-based fallback active'})`
            }
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                aiInfo.status === 'available'
                  ? 'bg-[#2E7D5B] animate-pulse'
                  : aiInfo.status === 'degraded'
                  ? 'bg-[#D97706] animate-pulse'
                  : 'bg-[#8B97A7]'
              )}
            />
            <span className="text-[11px] font-bold tracking-wide">
              {aiInfo.status === 'available'
                ? 'AI: on'
                : aiInfo.status === 'degraded'
                ? 'AI: degraded'
                : 'AI: off (rule-based mode)'}
            </span>
          </div>

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-md text-[#5B6675] hover:text-[#0F1B2D] dark:text-[#8B97A7] dark:hover:text-[#E8EDF2] hover:bg-[#F7F5F0] dark:hover:bg-[#0B1118] border border-[#E3DFD6] dark:border-[#243140] transition-colors"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-[#C8791A]" /> : <Moon className="w-4 h-4 text-[#5B6675]" />}
          </button>

          {/* Run Demo Analysis CTA */}
          <Button
            variant="primary"
            size="sm"
            onClick={onRunScan}
            loading={isScanning}
            className="font-medium"
            title="Analyses the verified & synthetic demo dataset"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', isScanning && 'animate-spin')} />
            Run Demo Analysis
          </Button>
        </div>
      </div>
    </header>
  );
});
