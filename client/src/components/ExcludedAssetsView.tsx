/**
 * [client/src/components/ExcludedAssetsView.tsx]
 * "Why Wasn't This Flagged?" Asset Auditor for BrandShield AI.
 * Displays all official and allowlisted assets excluded from threat alerts
 * to demonstrate false-positive prevention.
 */

import React from 'react';
import { ShieldCheck, Info, Lock, Share2, Smartphone } from 'lucide-react';
import { ExcludedAsset, BrandProfile } from '../types/index.js';
import { Card } from './ui/Card.js';
import { Badge } from './ui/Badge.js';

export interface ExcludedAssetsViewProps {
  excluded: ExcludedAsset[];
  profile: BrandProfile;
}

export const ExcludedAssetsView: React.FC<ExcludedAssetsViewProps> = React.memo(({
  excluded,
  profile,
}) => {
  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="brand">Asset Auditor & Allowlist Verification</Badge>
          <span className="text-xs text-[#5B6675] dark:text-[#8B97A7]">
            Core Scope: Exclusion First (Pillar A)
          </span>
        </div>
        <h1 className="text-2xl font-bold text-[#0F1B2D] dark:text-[#E8EDF2] mt-1 tracking-tight">
          "Why Wasn't This Flagged?" Asset Audit
        </h1>
        <p className="text-xs text-[#5B6675] dark:text-[#8B97A7] mt-1 max-w-3xl leading-relaxed">
          BrandShield AI operates on an <strong>Exclusion-First</strong> architecture. Any candidate matching registered official handles, package identifiers, or verified domains in the <strong>Brand Profile</strong> is unconditionally excluded from threat alerts to guarantee zero false positives.
        </p>
      </div>

      {/* Audit Banner */}
      <div className="p-3.5 rounded-lg bg-[#E6F0EE] dark:bg-[#0E5A52]/15 border border-[#0E5A52]/20 dark:border-[#0E5A52]/30 flex items-start gap-3">
        <Lock className="w-5 h-5 text-[#0E5A52] dark:text-[#A8DBC5] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#0E5A52] dark:text-[#A8DBC5]">
          <p className="font-bold text-sm">Active Allowlist Enforced for {profile.brandName || 'Monitored Brands'}</p>
          <p className="mt-0.5 opacity-90">
            The {excluded.length} official entities below were verified by the ingestion layer against official brand records. They are permanently shielded from takedown alerts and false positive queues.
          </p>
        </div>
      </div>

      {/* Excluded Assets List */}
      <div className="space-y-3">
        {excluded.length === 0 ? (
          <Card className="p-8 text-center">
            <Info className="w-8 h-8 text-[#5B6675] mx-auto" />
            <h3 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2] mt-2">
              No excluded records found in current scope
            </h3>
            <p className="text-xs text-[#5B6675] mt-1">
              Run Demo Analysis to evaluate and allowlist candidate assets.
            </p>
          </Card>
        ) : (
          excluded.map((item) => {
            const isApp = ['google play', 'apple app store', 'app store', 'google_play'].includes(item.platform.toLowerCase());

            return (
              <Card
                key={item.recordId || item.id}
                hoverLift
                accentBorder="verified"
                className="p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-[#F0F7FA] dark:bg-[#0B242F] border border-[#A2D0E0] dark:border-[#1F6F8B]/40 flex items-center justify-center flex-shrink-0 text-[#1F6F8B] mt-0.5">
                      {isApp ? <Smartphone className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
                          {item.name}
                        </h4>
                        <span className="text-[10px] font-semibold text-[#1F6F8B] bg-[#F0F7FA] dark:bg-[#0B242F] border border-[#A2D0E0] px-1.5 py-0.5 rounded">
                          Official Allowlisted
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5B6675] dark:text-[#8B97A7] mt-1">
                        <span>Brand: <strong>{item.brandName || profile.brandName}</strong></span>
                        <span>Platform: <strong>{item.platform}</strong></span>
                        {item.handle && <span>Handle: <code className="font-mono">@{item.handle}</code></span>}
                        {item.packageId && <span>Package: <code className="font-mono">{item.packageId}</code></span>}
                        {item.publisherOrDeveloper && <span>Publisher: <strong>{item.publisherOrDeveloper}</strong></span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F0F9F5] text-[#2E7D5B] dark:bg-[#0A261A] dark:text-[#A8DBC5] text-xs font-semibold border border-[#A8DBC5]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Zero Risk (Excluded)
                    </span>
                  </div>
                </div>

                {/* Audit Justification Reason */}
                <div className="mt-3 pt-3 border-t border-[#E3DFD6] dark:border-[#243140] text-xs flex items-start gap-2 text-[#5B6675] dark:text-[#8B97A7]">
                  <span className="font-bold text-[#0E5A52] dark:text-[#A8DBC5] flex-shrink-0">Exclusion Audit Reason:</span>
                  <span>{item.exclusionReason}</span>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
});
