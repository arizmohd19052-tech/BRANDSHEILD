/**
 * [client/src/components/FeatureShowcase.tsx]
 * Numbered capability showcase sections (01 / 02 / 03 / 04) inspired by Sarvam.ai layout.
 */

import React from 'react';
import { ShieldCheck, Share2, Smartphone, Terminal, ArrowUpRight } from 'lucide-react';
import { Card } from './ui/Card.js';
import { Button } from './ui/Button.js';

export interface FeatureShowcaseProps {
  onNavigate: (tab: string) => void;
}

export const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({ onNavigate }) => {
  const capabilities = [
    {
      num: '01',
      title: 'Brand Profile & Allowlist',
      accent: 'teal',
      tag: 'Foundation',
      icon: <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      desc: 'Define official company handles, app package IDs, and authorized publishers. Inputs act as an unassailable allowlist, guaranteeing official marketing assets are NEVER flagged.',
      tab: 'profile',
      actionText: 'Manage Brand Allowlist',
      stats: '100% False-Positive Immunity on Official Assets',
    },
    {
      num: '02',
      title: 'Social Media Impersonation Radar',
      accent: 'sky',
      tag: 'Social Intelligence',
      icon: <Share2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
      desc: 'Discovers fake company pages, deceptive customer support clones, and predatory refund accounts across X, Instagram, Facebook, LinkedIn, and Telegram.',
      tab: 'detections',
      actionText: 'View Social Threats',
      stats: '5 Global Platforms Monitored Simultaneously',
    },
    {
      num: '03',
      title: 'App Store Counterfeit Hunter',
      accent: 'orange',
      tag: 'Mobile Ecosystem',
      icon: <Smartphone className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
      desc: 'Scours Google Play and Apple App Store for unauthorized publisher mismatches, fake loan apps, and logo clones designed to harvest mobile credentials.',
      tab: 'detections',
      actionText: 'Inspect Counterfeit Apps',
      stats: 'Automated Publisher Verification & APK Analysis',
    },
    {
      num: '04',
      title: 'Deep Look-alike & Homoglyph Lab',
      accent: 'purple',
      tag: 'Bonus Feature',
      icon: <Terminal className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      desc: 'Detects character swaps (0->o, rn->m, vv->w), deceptive spacing (A c m e), and added tokens (Support, Official). Features over-flagging protection for benign businesses.',
      tab: 'lab',
      actionText: 'Open Testbench Lab',
      stats: 'Interactive Real-Time Typo & Unicode Engine',
    },
  ];

  return (
    <section className="py-12 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-200/60 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-xs font-bold text-[#0E5A52] dark:text-[#A8DBC5] uppercase tracking-widest">
            Core Capabilities & Detection Architecture
          </h2>
          <p className="mt-2 text-3xl font-extrabold text-[#0F1B2D] dark:text-[#E8EDF2] tracking-tight">
            How BrandShield AI Defends Your Digital Presence
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {capabilities.map((c) => (
            <Card
              key={c.num}
              hoverLift
              className="p-6 flex flex-col justify-between border-slate-200/80 dark:border-slate-800/80"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-slate-300 dark:text-slate-700 font-mono">
                    {c.num}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {c.tag}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 mt-4">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {c.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {c.title}
                  </h3>
                </div>

                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {c.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {c.stats}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate(c.tab)}
                  className="gap-1 text-xs"
                >
                  {c.actionText}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
