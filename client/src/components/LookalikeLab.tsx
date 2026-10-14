/**
 * [client/src/components/LookalikeLab.tsx]
 * Look-alike Name Detection Lab for BrandShield AI.
 * Styled with Steel Blue (#3B5B8C) module accent (zero purple).
 * Interactive testbench demonstrating homoglyph folding, typos, spacing regularizers,
 * and over-flagging suppression against real brand targets.
 */

import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Shield,
  Layers,
} from 'lucide-react';
import { Card } from './ui/Card.js';
import { Button } from './ui/Button.js';
import { Badge } from './ui/Badge.js';
import { api } from '../lib/api.js';
import { LookalikeTestResult } from '../types/index.js';

export interface LookalikeLabProps {
  brandName: string;
}

export const LookalikeLab: React.FC<LookalikeLabProps> = ({ brandName }) => {
  const [candidateName, setCandidateName] = useState('Flipk4rt Wholesale Seller');
  const [context, setContext] = useState('Official wholesale onboarding and merchant deposits');
  const [result, setResult] = useState<LookalikeTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const presets = [
    {
      label: "Homoglyph 'Flipk4rt'",
      name: 'Flipk4rt Wholesale Seller',
      context: 'Official merchant portal for B2B seller registration',
      desc: "Substitutes number '4' for letter 'a'",
    },
    {
      label: "Support Affix 'care24x7'",
      name: 'HDFC Bank Care 24x7 Support',
      context: 'Official customer support and ticket reactivation',
      desc: "Concatenates coercive support tokens 'care24x7'",
    },
    {
      label: "Deceptive Spacing 'P h o n e P e'",
      name: 'P h o n e P e Rewards Official',
      context: 'Claim cash vouchers and UPI scratch card bonuses',
      desc: 'Injects spaces between characters to evade naive keyword regexes',
    },
    {
      label: "Character Swap '0' for 'o'",
      name: 'HDFC 0fficial Helpdesk',
      context: 'Customer care executive resolution desk',
      desc: "Substitutes zero '0' for letter 'o'",
    },
    {
      label: 'Benign Guard (No Over-flagging)',
      name: 'Flipkart Stationery & Printing Supplies',
      context: 'Local shop selling paper, notebooks, and office stationery in Delhi',
      desc: 'Unrelated business sharing common words - Protected from false positives',
    },
  ];

  const runTest = async (testName: string, testContext: string) => {
    setIsLoading(true);
    try {
      const res = await api.testLookalike(testName, testContext);
      setResult(res.result);
    } catch (err) {
      console.error('[client/src/components/LookalikeLab.tsx] Test error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runTest(candidateName, context);
  }, []);

  const handleApplyPreset = (p: typeof presets[0]) => {
    setCandidateName(p.name);
    setContext(p.context);
    runTest(p.name, p.context);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="lab">Look-alike Intelligence Engine</Badge>
          <span className="text-xs text-[#5B6675] dark:text-[#8B97A7]">
            Bonus Feature (Multi-stage Pipeline)
          </span>
        </div>
        <h1 className="text-2xl font-bold text-[#0F1B2D] dark:text-[#E8EDF2] mt-1 tracking-tight">
          Look-alike Name Detection Lab
        </h1>
        <p className="text-xs text-[#5B6675] dark:text-[#8B97A7] mt-1 max-w-3xl leading-relaxed">
          Test arbitrary string mutations against <strong className="text-[#0F1B2D] dark:text-[#E8EDF2]">{brandName}</strong>.
          Observe the multi-stage pipeline: unicode normalization, homoglyph folding, spacing regularizers, Jaro-Winkler/Levenshtein matching, and over-flagging suppression.
        </p>
      </div>

      {/* Preset Test Case Chips */}
      <div>
        <p className="text-xs font-bold text-[#5B6675] dark:text-[#8B97A7] uppercase tracking-wider mb-2">
          Interactive Evaluation Presets:
        </p>
        <div className="flex flex-wrap gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(p)}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-white dark:bg-[#121B25] hover:bg-[#EBF1F9] dark:hover:bg-[#3B5B8C]/20 text-[#0F1B2D] dark:text-[#E8EDF2] border border-[#E3DFD6] dark:border-[#243140] hover:border-[#3B5B8C]/50 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-3 h-3 text-[#3B5B8C]" />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Testing Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Panel */}
        <Card className="lg:col-span-5 p-5 flex flex-col justify-between" accentBorder="lab">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2] flex items-center gap-2 pb-2.5 border-b border-[#E3DFD6] dark:border-[#243140]">
              <Terminal className="w-4 h-4 text-[#3B5B8C]" />
              Input Testbench
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[#0F1B2D] dark:text-[#E8EDF2] mb-1">
                Candidate Name to Test:
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g. Flipk4rt Wholesale"
                className="w-full px-3 py-2 rounded-md bg-[#F7F5F0] dark:bg-[#0B1118] border border-[#E3DFD6] dark:border-[#243140] text-xs font-mono text-[#0F1B2D] dark:text-[#E8EDF2] focus:outline-none focus:ring-1 focus:ring-[#3B5B8C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F1B2D] dark:text-[#E8EDF2] mb-1">
                Candidate Context / Bio (Optional):
              </label>
              <textarea
                rows={3}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Bio text or store description..."
                className="w-full px-3 py-2 rounded-md bg-[#F7F5F0] dark:bg-[#0B1118] border border-[#E3DFD6] dark:border-[#243140] text-xs text-[#0F1B2D] dark:text-[#E8EDF2] focus:outline-none focus:ring-1 focus:ring-[#3B5B8C]"
              />
              <p className="text-[11px] text-[#5B6675] dark:text-[#8B97A7] mt-1">
                Context is evaluated for industry keywords vs unrelated sector guards.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E3DFD6] dark:border-[#243140] flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCandidateName('');
                setContext('');
              }}
              className="text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
            <Button
              variant="lab"
              size="sm"
              loading={isLoading}
              onClick={() => runTest(candidateName, context)}
              className="text-xs font-medium"
            >
              Analyze String
            </Button>
          </div>
        </Card>

        {/* Right Column: Pipeline Diagnostic Output */}
        <Card className="lg:col-span-7 p-5 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#E3DFD6] dark:border-[#243140]">
            <h2 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#3B5B8C]" />
              Pipeline Transformation & Scoring
            </h2>
            {result && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded border ${
                  result.isLookalike
                    ? 'bg-[#FDF2F2] text-[#B3261E] border-[#F8B4B4]'
                    : 'bg-[#F0F9F5] text-[#2E7D5B] border-[#A8DBC5]'
                }`}
              >
                {result.isLookalike ? 'FLAGGED AS LOOK-ALIKE' : 'BENIGN / NOT FLAGGED'}
              </span>
            )}
          </div>

          {result ? (
            <div className="space-y-4">
              {/* String Transformations Table */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-[#5B6675] dark:text-[#8B97A7] uppercase tracking-wider">
                  Transformation Stages:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-[#F7F5F0] dark:bg-[#0B1118] border border-[#E3DFD6] dark:border-[#243140]">
                    <span className="text-[10px] text-[#5B6675] uppercase block font-sans font-bold">1. Input:</span>
                    <span className="text-[#0F1B2D] dark:text-[#E8EDF2] font-semibold">{result.originalInput || '(empty)'}</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#F7F5F0] dark:bg-[#0B1118] border border-[#E3DFD6] dark:border-[#243140]">
                    <span className="text-[10px] text-[#5B6675] uppercase block font-sans font-bold">2. Normalized:</span>
                    <span className="text-[#0F1B2D] dark:text-[#E8EDF2]">{result.normalizedInput || '(empty)'}</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#F7F5F0] dark:bg-[#0B1118] border border-[#E3DFD6] dark:border-[#243140]">
                    <span className="text-[10px] text-[#5B6675] uppercase block font-sans font-bold">3. Homoglyph Folded:</span>
                    <span className="text-[#0E5A52] dark:text-[#A8DBC5] font-semibold">{result.homoglyphFolded}</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#F7F5F0] dark:bg-[#0B1118] border border-[#E3DFD6] dark:border-[#243140]">
                    <span className="text-[10px] text-[#5B6675] uppercase block font-sans font-bold">4. Condensed:</span>
                    <span className="text-[#3B5B8C] font-semibold">{result.condensedInput}</span>
                  </div>
                </div>
              </div>

              {/* Detected Mutations */}
              {result.detectedVariations.length > 0 && (
                <div className="p-3 rounded bg-[#FEF9EC] dark:bg-[#332709] border border-[#F6DF9C] dark:border-[#C99A1F]/30 text-xs">
                  <p className="font-bold text-[#C8791A] flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Detected Character Manipulations:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-[#0F1B2D] dark:text-[#E8EDF2]">
                    {result.detectedVariations.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Over-flagging Guard Notice */}
              {result.overflaggingGuardTriggered && (
                <div className="p-3 rounded bg-[#F0F9F5] dark:bg-[#0A261A] border border-[#A8DBC5] dark:border-[#2E7D5B]/30 text-xs">
                  <p className="font-bold text-[#2E7D5B] flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Over-Flagging Guard Activated
                  </p>
                  <p className="text-[#0F1B2D] dark:text-[#E8EDF2]">
                    Unrelated sector guard depressed risk score to prevent false-positive flagging of legitimate non-impersonating businesses.
                  </p>
                </div>
              )}

              {/* Score Breakdown Bar */}
              <div className="p-3 rounded bg-[#F7F5F0] dark:bg-[#0B1118] border border-[#E3DFD6] dark:border-[#243140] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#5B6675] dark:text-[#8B97A7]">Computed Similarity Score:</span>
                  <div className="text-xl font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
                    {result.score} <span className="text-xs text-[#5B6675]">/ 100</span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <span className="text-[#5B6675]">Target Brand:</span>
                  <p className="font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">{brandName}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-[#5B6675]">
              No test has been executed yet. Select a preset above or input a test string.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
