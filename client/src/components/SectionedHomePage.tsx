/**
 * [client/src/components/SectionedHomePage.tsx]
 * High-engagement, multi-scroll home page for BrandShield AI.
 * Includes:
 * 1. Hero Section with quick CTA links
 * 2. Live Dashboard with zero-lag SVG charts
 * 3. 4-Step "How It Works" Workflow
 * 4. Enterprise Capabilities Grid
 * 5. Top 5 Recent Candidate Detections
 * 6. "Why It Matters / Trust & Data Integrity" Dark Navy Contrast Band
 * 7. FAQ Accordion (6 items)
 * 8. User Feedback & Insights Form
 */

import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  Search,
  Sparkles,
  Layers,
  Lock,
  Eye,
  FileCheck2,
  ExternalLink,
  Smartphone,
  Share2,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { Button } from './ui/Button.js';
import { Card } from './ui/Card.js';
import { SeverityChip } from './ui/SeverityChip.js';
import { DashboardOverview, DashboardOverviewProps } from './DashboardOverview.js';
import { FeedbackSection } from './FeedbackSection.js';
import { Detection, BrandProfile } from '../types/index.js';

interface SectionedHomePageProps extends DashboardOverviewProps {
  detections: Detection[];
  onNavigateToTab: (tab: string) => void;
  brands: BrandProfile[];
}

export const SectionedHomePage: React.FC<SectionedHomePageProps> = ({
  detections,
  onNavigateToTab,
  brands,
  ...dashboardProps
}) => {
  // FAQ accordion open states
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const topDetections = detections.slice(0, 5);

  const faqs = [
    {
      q: 'How does BrandShield AI guarantee official brand accounts are never flagged?',
      a: 'BrandShield enforces a strict Allowlist Exclusion Layer as step one of every evaluation pipeline. Official social handles, domains, package identifiers, and publisher entities specified in the verified Brand Profile are cross-checked before running threat scoring. If a match occurs, the candidate is instantly classified as an excluded official asset with an audit trail note and zero risk points.',
    },
    {
      q: 'How are risk scores calculated, and how is Gemini AI utilized?',
      a: 'BrandShield employs a strictly deterministic scoring engine as the single source of truth for risk scores and levels—ensuring reproducible, auditable detections without hallucination. Google AI Studio (Gemini) provides an optional threat intelligence enrichment layer for plain-language incident summaries, bio scam-intent classification, and structured takedown checklists.',
    },
    {
      q: 'What is the distinction between VERIFIED_PUBLIC, SYNTHETIC_TEST_DATA, and USER_SUBMITTED?',
      a: 'Data provenance is strictly preserved. VERIFIED_PUBLIC represents verified public assets for real enterprises (HDFC Bank, PhonePe, Flipkart). SYNTHETIC_TEST_DATA represents engineered test vectors designed to benchmark adversarial edge cases without impersonating live accounts. USER_SUBMITTED represents custom candidates ingested through the Ingest & Check tool.',
    },
    {
      q: 'How does the Look-alike Name Detection algorithm prevent over-flagging?',
      a: 'Our look-alike engine requires correlated signals before raising alarms. It folds homoglyphs (e.g. Cyrillic letters, number-letter swaps), analyzes condensed stems, and applies strict over-flagging guards so that generic names or coincidental partial matches receive low scores or clear "Why not flagged" justifications.',
    },
    {
      q: 'Can I test my own suspicious URLs, handles, or APK packages?',
      a: 'Yes! Navigate to the "Ingest & Check" workbench in the top navigation. You can test single candidates with optional logo uploads, or upload a bulk CSV file containing up to 200 candidates to get instantaneous deterministic evaluations.',
    },
    {
      q: 'How does the platform handle external platform rate limits or API outages?',
      a: 'BrandShield features resilient circuit-breaking and source status telemetry. When an external source simulator encounters rate limits (such as an HTTP 429 response), it isolates the degraded source, serves cached telemetry snapshots, and maintains overall dashboard availability without failing.',
    },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* 1. HERO SECTION */}
      <section id="hero" className="relative pt-12 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Subtle badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6F0EE] dark:bg-[#0E5A52]/20 border border-[#0E5A52]/30 text-[#0E5A52] dark:text-[#A8DBC5] text-xs font-semibold mb-6">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Next-Generation Digital Risk Protection</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-[#0F1B2D] dark:text-[#E8EDF2] tracking-tight max-w-4xl mx-auto leading-tight">
          Autonomous Brand Impersonation Defense Across Social & App Stores
        </h1>

        <p className="mt-5 text-sm sm:text-base text-[#5B6675] dark:text-[#8B97A7] max-w-2xl mx-auto leading-relaxed">
          BrandShield AI identifies fake accounts, scam pages, typosquatted look-alikes, and rogue mobile APKs across digital channels—grounded in verified allowlists with zero false positives.
        </p>

        {/* Quick CTA Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Button
            variant="primary"
            size="md"
            onClick={() => onNavigateToTab('ingest')}
            className="text-xs sm:text-sm font-semibold px-5 py-2.5 shadow-sm"
          >
            <Search className="w-4 h-4 mr-2" />
            Ingest & Check a Candidate
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => onNavigateToTab('detections')}
            className="text-xs sm:text-sm font-semibold px-5 py-2.5"
          >
            Explore Active Detections ({detections.length})
          </Button>

          <a
            href="#dashboard-live"
            className="inline-flex items-center text-xs font-semibold text-[#0E5A52] dark:text-[#A8DBC5] hover:underline px-3 py-2"
          >
            View Live Posture <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </a>
        </div>

        {/* Feature Highlights Pills */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
          <div className="p-3 rounded-lg bg-white dark:bg-[#121B25] border border-[#E3DFD6] dark:border-[#243140] flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0E5A52] flex-shrink-0" />
            <span className="text-xs font-semibold text-[#0F1B2D] dark:text-[#E8EDF2]">
              100% Deterministic Engine
            </span>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-[#121B25] border border-[#E3DFD6] dark:border-[#243140] flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0E5A52] flex-shrink-0" />
            <span className="text-xs font-semibold text-[#0F1B2D] dark:text-[#E8EDF2]">
              Official Asset Allowlisting
            </span>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-[#121B25] border border-[#E3DFD6] dark:border-[#243140] flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0E5A52] flex-shrink-0" />
            <span className="text-xs font-semibold text-[#0F1B2D] dark:text-[#E8EDF2]">
              Deterministic Scoring Core
            </span>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-[#121B25] border border-[#E3DFD6] dark:border-[#243140] flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0E5A52] flex-shrink-0" />
            <span className="text-xs font-semibold text-[#0F1B2D] dark:text-[#E8EDF2]">
              Audited Data Provenance
            </span>
          </div>
        </div>
      </section>

      {/* 2. LIVE DASHBOARD SECTION */}
      <section id="dashboard-live" className="scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
              Live Posture & Security Telemetry
            </h2>
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-[#E6F0EE] text-[#0E5A52] dark:bg-[#0E5A52]/20 dark:text-[#A8DBC5]">
              Real-time Analysis
            </span>
          </div>
          <p className="text-xs text-[#5B6675] dark:text-[#8B97A7] mt-0.5">
            Real-time evaluation across verified enterprise profiles and synthetic threat scenarios.
          </p>
        </div>
        <DashboardOverview {...dashboardProps} />
      </section>

      {/* 3. 4-STEP "HOW IT WORKS" */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
            How BrandShield AI Works
          </h2>
          <p className="text-xs sm:text-sm text-[#5B6675] dark:text-[#8B97A7] mt-1.5">
            A deterministic 4-stage pipeline that balances sensitivity and false-positive resistance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Curate Brand Profile',
              desc: 'Define official domains, trademarks, social handles, and Google Play / App Store developer accounts.',
              icon: <Layers className="w-5 h-5 text-[#0E5A52]" />,
            },
            {
              step: '02',
              title: 'Allowlist Exclusion',
              desc: 'Official properties are matched first and excluded automatically with zero false positives.',
              icon: <ShieldCheck className="w-5 h-5 text-[#2E7D5B]" />,
            },
            {
              step: '03',
              title: 'Multi-Signal Correlation',
              desc: 'Cross-checks homoglyphs, publisher mismatches, scam keywords, and visual similarity without single-signal bias.',
              icon: <Zap className="w-5 h-5 text-[#C8791A]" />,
            },
            {
              step: '04',
              title: 'Actionable Takedown Intel',
              desc: 'Generates itemized evidence points, composite severity scores, and platform takedown checklists.',
              icon: <FileCheck2 className="w-5 h-5 text-[#1F6F8B]" />,
            },
          ].map((s) => (
            <Card key={s.step} className="p-5 relative flex flex-col justify-between hover:border-[#0E5A52]/40 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-2xl font-black text-[#E3DFD6] dark:text-[#243140]">
                    {s.step}
                  </span>
                  <div className="p-2 rounded-lg bg-[#F7F5F0] dark:bg-[#0B1118]">
                    {s.icon}
                  </div>
                </div>
                <h3 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2] mb-1.5">
                  {s.title}
                </h3>
                <p className="text-xs text-[#5B6675] dark:text-[#8B97A7] leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. ENTERPRISE CAPABILITIES GRID */}
      <section id="capabilities" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
            Comprehensive Threat Vector Coverage
          </h2>
          <p className="text-xs sm:text-sm text-[#5B6675] dark:text-[#8B97A7] mt-1.5">
            Engineered specifically to counter high-risk social engineering vectors targeting financial and consumer brands.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#F0F7FA] dark:bg-[#1F6F8B]/20 text-[#1F6F8B] flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
              Social Impersonation Discovery
            </h3>
            <p className="text-xs text-[#5B6675] dark:text-[#8B97A7] leading-relaxed">
              Monitors X (Twitter), Telegram, Instagram, and Facebook for rogue customer support handles, emergency helpline scams, and urgent credential traps.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#FDF5F0] dark:bg-[#D9622B]/20 text-[#D9622B] flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
              Rogue Mobile APK Sentinel
            </h3>
            <p className="text-xs text-[#5B6675] dark:text-[#8B97A7] leading-relaxed">
              Detects cloned Android applications, unauthorized APK mirrors, package ID collisions, and developer mismatches across Google Play and third-party stores.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#FEF9EC] dark:bg-[#C99A1F]/20 text-[#C8791A] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
              Homoglyph & Typosquatting Lab
            </h3>
            <p className="text-xs text-[#5B6675] dark:text-[#8B97A7] leading-relaxed">
              Real-time Unicode character canonicalization: catches zero-for-O, Cyrillic look-alikes, punctuation insertion, and brand modifier keywords.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#E6F0EE] dark:bg-[#0E5A52]/20 text-[#0E5A52] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
              Zero False-Positive Allowlisting
            </h3>
            <p className="text-xs text-[#5B6675] dark:text-[#8B97A7] leading-relaxed">
              Verified corporate assets are systematically immune from threat flagging. Complete audit logs explain why each asset was excluded.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#FDF2F2] dark:bg-[#B3261E]/20 text-[#B3261E] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
              Multi-Signal Correlation
            </h3>
            <p className="text-xs text-[#5B6675] dark:text-[#8B97A7] leading-relaxed">
              Never flags on a single weak indicator (such as an unverified badge). Requires correlated name, domain, publisher, or bio intent markers.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#F7F5F0] dark:bg-[#243140] text-[#0F1B2D] dark:text-[#E8EDF2] flex items-center justify-center">
              <FileCheck2 className="w-5 h-5 text-[#0E5A52]" />
            </div>
            <h3 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
              Audited Dataset Provenance
            </h3>
            <p className="text-xs text-[#5B6675] dark:text-[#8B97A7] leading-relaxed">
              Maintains strict separation between verified public information, synthetic adversarial benchmarks, and user-submitted inputs.
            </p>
          </Card>
        </div>
      </section>

      {/* 5. RECENT DETECTIONS PREVIEW (5 Rows) */}
      <section id="recent-detections" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E3DFD6] dark:border-[#243140]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
                  Recent Candidate Detections
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[#FDF2F2] text-[#B3261E] dark:bg-[#B3261E]/20">
                  Top Flagged
                </span>
              </div>
              <p className="text-xs text-[#5B6675] dark:text-[#8B97A7] mt-0.5">
                Highest-severity candidates identified by the deterministic detection engine.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateToTab('detections')}
              className="text-xs"
            >
              View All {detections.length} Detections <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>

          <div className="divide-y divide-[#E3DFD6]/60 dark:divide-[#243140]/60">
            {topDetections.map((det) => (
              <div
                key={det.recordId || det.id}
                className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-[#F7F5F0]/40 dark:hover:bg-[#0B1118]/40 px-2 rounded-lg transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[#0F1B2D] dark:text-[#E8EDF2]">
                      {det.accountOrAppName || det.name}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#5B6675] px-1.5 py-0.5 bg-[#F7F5F0] dark:bg-[#0B1118] rounded border border-[#E3DFD6] dark:border-[#243140]">
                      {det.platform}
                    </span>
                    <span className="text-[10px] font-medium text-[#0E5A52] dark:text-[#A8DBC5]">
                      target: {det.brandName}
                    </span>
                  </div>
                  <p className="text-xs text-[#5B6675] dark:text-[#8B97A7] line-clamp-1">
                    {det.reasons[0] || 'Suspected brand impersonation and handle squatting'}
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="font-mono text-xs font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
                    Score: {det.riskScore}/100
                  </span>
                  <SeverityChip severity={det.riskLevel} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigateToTab('detections')}
                    className="text-xs text-[#0E5A52] hover:bg-[#E6F0EE] px-2 py-1"
                  >
                    Inspect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* 6. "WHY IT MATTERS / TRUST & DATA INTEGRITY" DARK NAVY CONTRAST BAND */}
      <section id="trust-integrity" className="bg-[#0F1B2D] text-[#E8EDF2] py-16 px-4 sm:px-6 lg:px-8 border-y border-[#243140]">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <span className="text-xs uppercase tracking-widest font-bold text-[#A8DBC5]">
              Integrity & Trust Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Why Transparent Risk Protection Matters
            </h2>
            <p className="text-xs sm:text-sm text-[#8B97A7] leading-relaxed">
              Brand impersonation is not a theoretical exercise—it is the #1 gateway for phishing, unauthorized payment collection, and customer fraud.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-[#162338] border border-[#243140] space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#0E5A52]/30 text-[#A8DBC5] flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Customer Financial Protection
              </h3>
              <p className="text-xs text-[#8B97A7] leading-relaxed">
                Rogue UPI payment apps and fake social support handles extract credentials and initiate fraudulent transactions within minutes of publication.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#162338] border border-[#243140] space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#C8791A]/30 text-[#F6DF9C] flex items-center justify-center font-bold">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Deterministic Explainability
              </h3>
              <p className="text-xs text-[#8B97A7] leading-relaxed">
                Black-box AI models hallucinate threats. BrandShield delivers fully auditable mathematical breakdown: exact homoglyph mappings, token weights, and allowlist rules.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#162338] border border-[#243140] space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#1F6F8B]/30 text-[#A5D2E2] flex items-center justify-center font-bold">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Strict Data Provenance
              </h3>
              <p className="text-xs text-[#8B97A7] leading-relaxed">
                Clear labels separate verified corporate entities from synthetic adversarial scenarios and user inputs, eliminating data contamination.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ ACCORDION SECTION */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 scroll-mt-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-[#5B6675] dark:text-[#8B97A7] mt-1">
            Technical answers regarding detection logic, allowlisting, and operational safety.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <Card
                key={index}
                className="overflow-hidden border border-[#E3DFD6] dark:border-[#243140] transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                >
                  <span className="text-xs sm:text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#5B6675] transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? 'rotate-180 text-[#0E5A52]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs text-[#5B6675] dark:text-[#8B97A7] leading-relaxed border-t border-[#E3DFD6]/60 dark:border-[#243140]/60">
                    <p className="mt-3">{faq.a}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* 8. FEEDBACK & COMMUNITY INSIGHTS SECTION */}
      <section id="feedback-section" className="scroll-mt-20">
        <FeedbackSection />
      </section>
    </div>
  );
};
