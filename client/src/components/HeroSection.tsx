/**
 * [client/src/components/HeroSection.tsx]
 * Sarvam.ai-inspired spacious Hero with vibrant gradient, confident headlines, and marquee strip.
 */

import React from 'react';
import { ArrowRight, ShieldCheck, Zap, Eye, Terminal } from 'lucide-react';
import { Button } from './ui/Button.js';

export interface HeroSectionProps {
  onNavigate: (tab: string) => void;
  onRunScan: () => void;
  isScanning: boolean;
  totalThreats: number;
  brandName: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigate,
  onRunScan,
  isScanning,
  totalThreats,
  brandName,
}) => {
  const platforms = [
    { name: 'X (Twitter)', icon: '𝕏', tag: 'Social Graph' },
    { name: 'Instagram', icon: '📸', tag: 'Meta Graph' },
    { name: 'Google Play Store', icon: '▶', tag: 'Android APKs' },
    { name: 'Apple App Store', icon: '', tag: 'iOS Bundles' },
    { name: 'LinkedIn', icon: '💼', tag: 'Corporate Pages' },
    { name: 'Facebook', icon: 'f', tag: 'Pages & Groups' },
    { name: 'Telegram', icon: '✈', tag: 'Public Channels' },
  ];

  return (
    <section className="relative pt-10 pb-16 overflow-hidden hero-gradient bg-grid-pattern">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Eyebrow Chip */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-sm animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
            <span>Kampus.VC Hackathon Challenge &bull; Social & App Impersonation Defense</span>
          </div>
        </div>

        {/* Confident Large Headline */}
        <div className="text-center mt-6 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
            Autonomous Digital Risk Protection for{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Social & Mobile Ecosystems
            </span>
          </h1>

          <p className="mt-5 text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed">
            Eliminate brand impersonators, scam profiles, homoglyph typos, and counterfeit mobile apps with 100% explainable detection and Google AI Studio enrichment.
          </p>

          {/* Interactive CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onNavigate('detections')}
              className="shadow-lg shadow-indigo-500/25"
            >
              <Eye className="w-4 h-4 mr-1" />
              View Live Detections ({totalThreats})
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>

            <Button
              variant="lab"
              size="lg"
              onClick={() => onNavigate('lab')}
              className="shadow-md"
            >
              <Terminal className="w-4 h-4 mr-1" />
              Launch Look-alike Lab
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={onRunScan}
              loading={isScanning}
            >
              <Zap className="w-4 h-4 mr-1 text-amber-500" />
              Trigger Live Scan
            </Button>
          </div>

          {/* Seed Brand Protection Banner */}
          <div className="mt-6 inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-900/70 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Active Protected Brand: <strong className="text-slate-800 dark:text-slate-200">{brandName}</strong> (Official assets allowlisted)</span>
          </div>
        </div>

        {/* Monitored Platforms Marquee Strip */}
        <div className="mt-14 pt-8 border-t border-slate-200/60 dark:border-slate-800/80">
          <p className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
            Continuous Multi-Source Surveillance Across Global Channels
          </p>

          <div className="relative overflow-hidden w-full py-2">
            <div className="flex gap-4 sm:gap-6 animate-marquee whitespace-nowrap">
              {[...platforms, ...platforms].map((p, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm text-sm font-semibold text-slate-700 dark:text-slate-300 select-none"
                >
                  <span className="text-base">{p.icon}</span>
                  <span>{p.name}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                    {p.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
