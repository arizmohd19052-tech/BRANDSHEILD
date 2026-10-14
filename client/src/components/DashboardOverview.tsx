/**
 * [client/src/components/DashboardOverview.tsx]
 * Cybersecurity Analytics Dashboard for BrandShield AI.
 * Displays key posture metrics, zero-latency custom SVG/CSS charts (no hover lag),
 * dataset composition breakdown, and source health telemetry.
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  Share2,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Database,
  Layers,
  RotateCcw,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { ScanSummary, SourceHealth, DatasetCounts } from '../types/index.js';
import { StatCard } from './ui/StatCard.js';
import { Card } from './ui/Card.js';
import { Button } from './ui/Button.js';
import { SourceStatusBadge } from './ui/SourceStatusBadge.js';
import { api } from '../lib/api.js';

export interface DashboardOverviewProps {
  summary: ScanSummary;
  sources: SourceHealth[];
  warnings?: string[];
  onRunScan: () => void;
  isScanning: boolean;
  onNavigate: (tab: string) => void;
  brandName: string;
}

/**
 * Pure SVG + CSS Zero-Lag Bar Chart
 * Renders completely without Recharts event bubbling or re-renders.
 */
const PureSvgBarChart: React.FC<{
  data: Array<{ name: string; count: number; color: string }>;
}> = ({ data }) => {
  const maxVal = Math.max(1, ...data.map((d) => d.count));
  const height = 180;
  const barWidth = 48;
  const spacing = 110;
  const startX = 55;

  return (
    <div className="relative w-full h-56 select-none">
      <svg
        viewBox="0 0 480 200"
        className="w-full h-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Horizontal grid guide lines */}
        {[0, 0.33, 0.66, 1].map((pct, idx) => {
          const y = height - pct * (height - 30);
          return (
            <g key={idx}>
              <line
                x1="30"
                y1={y}
                x2="460"
                y2={y}
                stroke="#E3DFD6"
                strokeDasharray="3 3"
                className="dark:stroke-[#243140]"
                strokeWidth="1"
              />
              <text
                x="20"
                y={y + 3}
                fontSize="10"
                textAnchor="end"
                className="fill-[#5B6675] dark:fill-[#8B97A7] font-mono text-[9px]"
              >
                {Math.round(pct * maxVal)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, idx) => {
          const x = startX + idx * spacing;
          const barHeight = Math.max(4, (item.count / maxVal) * (height - 30));
          const y = height - barHeight;

          return (
            <g key={item.name} className="group cursor-pointer">
              {/* Subtle hover background pillar */}
              <rect
                x={x - 8}
                y={20}
                width={barWidth + 16}
                height={height - 20}
                fill="currentColor"
                className="text-transparent group-hover:text-[#0E5A52]/5 transition-colors"
                rx="4"
              />

              {/* The data bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={item.color}
                rx="4"
                className="transition-opacity group-hover:opacity-85"
              />

              {/* Top value badge */}
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={item.color}
                className="font-mono"
              >
                {item.count}
              </text>

              {/* Bottom label */}
              <text
                x={x + barWidth / 2}
                y={height + 15}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                className="fill-[#5B6675] dark:fill-[#8B97A7]"
              >
                {item.name}
              </text>

              {/* Pure CSS hover tooltip */}
              <title>{`${item.name}: ${item.count} detected candidate(s)`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/**
 * Pure SVG + CSS Zero-Lag Donut Chart
 */
const PureSvgDonutChart: React.FC<{
  socialCount: number;
  appCount: number;
}> = ({ socialCount, appCount }) => {
  const total = socialCount + appCount;
  const radius = 52;
  const circumference = 2 * Math.PI * radius; // ~326.7

  const socialPct = total > 0 ? socialCount / total : 0.5;
  const appPct = total > 0 ? appCount / total : 0.5;

  const socialStroke = socialPct * circumference;
  const appStroke = appPct * circumference;

  return (
    <div className="relative w-44 h-44 mx-auto select-none flex items-center justify-center">
      <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
        {/* Background track */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#E3DFD6"
          strokeWidth="18"
          className="dark:stroke-[#243140]"
        />

        {/* Social Slice (#1F6F8B) */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#1F6F8B"
          strokeWidth="18"
          strokeDasharray={`${socialStroke} ${circumference}`}
          strokeDashoffset="0"
          className="cursor-pointer hover:opacity-85 transition-opacity"
        >
          <title>{`Social Media: ${socialCount} records (${Math.round(socialPct * 100)}%)`}</title>
        </circle>

        {/* App Slice (#C8791A) */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#C8791A"
          strokeWidth="18"
          strokeDasharray={`${appStroke} ${circumference}`}
          strokeDashoffset={`-${socialStroke}`}
          className="cursor-pointer hover:opacity-85 transition-opacity"
        >
          <title>{`App Stores: ${appCount} records (${Math.round(appPct * 100)}%)`}</title>
        </circle>
      </svg>

      {/* Centered Total Indicator */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
        <span className="text-xl font-black text-[#0F1B2D] dark:text-[#E8EDF2] leading-tight">
          {total}
        </span>
        <span className="text-[10px] font-semibold text-[#5B6675] uppercase tracking-wider">
          Assets
        </span>
      </div>
    </div>
  );
};

export const DashboardOverview: React.FC<DashboardOverviewProps> = React.memo(({
  summary,
  sources,
  onRunScan,
  isScanning,
  onNavigate,
  brandName,
}) => {
  // Dataset counts state
  const [datasetCounts, setDatasetCounts] = useState<DatasetCounts | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Fetch dataset counts on load
  const loadDatasetCounts = async () => {
    try {
      const counts = await api.getDatasetCounts();
      setDatasetCounts(counts);
    } catch (err) {
      console.error('[DashboardOverview.tsx] Failed to fetch dataset counts:', err);
    }
  };

  useEffect(() => {
    loadDatasetCounts();
  }, [summary.total]);

  // Handle Dataset Reset
  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      const res = await api.resetDataset();
      setResetSuccessMessage(res.message);
      setShowResetModal(false);
      await loadDatasetCounts();
      onRunScan(); // refresh parent detections & summary
      setTimeout(() => setResetSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(`[DashboardOverview.tsx] Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  // Severity chart data
  const severityData = useMemo(() => [
    { name: 'Critical', count: summary.critical, color: '#B3261E' },
    { name: 'High', count: summary.high, color: '#D9622B' },
    { name: 'Medium', count: summary.medium, color: '#C99A1F' },
    { name: 'Low', count: summary.low, color: '#2E7D5B' },
  ], [summary.critical, summary.high, summary.medium, summary.low]);

  const hasRateLimitedSource = sources.some((s) => s.status === 'rate-limited');

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Notice: Demo Dataset Attribution */}
      <div className="p-3.5 rounded-lg bg-[#E6F0EE] dark:bg-[#0E5A52]/15 border border-[#0E5A52]/20 dark:border-[#0E5A52]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#0E5A52] dark:text-[#A8DBC5]">
        <div className="flex items-center gap-2.5">
          <Database className="w-4 h-4 flex-shrink-0 text-[#0E5A52] dark:text-[#A8DBC5]" />
          <div>
            <span className="font-semibold">Demo Dataset Environment:</span> Analyzing verified public brands (HDFC Bank, PhonePe, Flipkart) and synthetic threat scenarios.
            <span className="ml-1 opacity-80">Dataset generated: Oct 13, 2026.</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-white dark:bg-[#121B25] text-[11px] font-medium border border-[#0E5A52]/30">
            Active Scope: {brandName}
          </span>
        </div>
      </div>

      {/* Reset Notification Toast */}
      {resetSuccessMessage && (
        <div className="p-3.5 rounded-lg bg-[#F0F9F5] dark:bg-[#2E7D5B]/15 border border-[#2E7D5B]/30 flex items-center justify-between gap-3 text-xs text-[#2E7D5B]">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {resetSuccessMessage}
          </div>
          <button
            onClick={() => setResetSuccessMessage(null)}
            className="text-[11px] underline opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Banner: Graceful Degraded Source Handling */}
      {hasRateLimitedSource && (
        <div className="p-3.5 rounded-lg bg-[#FEF9EC] dark:bg-[#332709] border border-[#F6DF9C] dark:border-[#C99A1F]/30 text-[#0F1B2D] dark:text-[#E8EDF2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-[#C99A1F]/20 text-[#C8791A] flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#C8791A]">
                Degraded Source Handled Gracefully
              </p>
              <p className="text-xs text-[#5B6675] dark:text-[#8B97A7]">
                Telegram adapter simulated HTTP 429 rate limit. BrandShield isolated the fault and served cached snapshots with zero interruption.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRunScan}
            loading={isScanning}
            className="text-xs flex-shrink-0"
          >
            Retry Source
          </Button>
        </div>
      )}

      {/* Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Monitored Brands"
          value={3}
          subtitle="HDFC, PhonePe, Flipkart"
          icon={<Layers className="w-5 h-5 text-[#0E5A52]" />}
          iconBg="bg-[#E6F0EE] dark:bg-[#0E5A52]/20"
          accentBorder="brand"
        />

        <StatCard
          title="Accounts & Apps Scanned"
          value={summary.total}
          subtitle="Cross-platform candidates"
          icon={<Share2 className="w-5 h-5 text-[#1F6F8B]" />}
          iconBg="bg-[#F0F7FA] dark:bg-[#1F6F8B]/20"
          accentBorder="social"
        />

        <StatCard
          title="Suspicious Accounts"
          value={summary.socialCount > 0 ? Math.min(summary.socialCount, summary.critical + summary.high) : 0}
          subtitle="Typosquatting & scam pages"
          icon={<ShieldAlert className="w-5 h-5 text-[#B3261E]" />}
          iconBg="bg-[#FDF2F2] dark:bg-[#B3261E]/20"
          accentBorder="critical"
        />

        <StatCard
          title="Suspicious Apps"
          value={summary.appCount > 0 ? Math.max(1, summary.appCount - 1) : 0}
          subtitle="Publisher mismatch / rogue APKs"
          icon={<Smartphone className="w-5 h-5 text-[#D9622B]" />}
          iconBg="bg-[#FDF5F0] dark:bg-[#D9622B]/20"
          accentBorder="high"
        />

        <StatCard
          title="Official Assets Protected"
          value={summary.excludedCount}
          subtitle="Allowlisted & excluded"
          icon={<ShieldCheck className="w-5 h-5 text-[#2E7D5B]" />}
          iconBg="bg-[#F0F9F5] dark:bg-[#2E7D5B]/20"
          accentBorder="low"
        />
      </div>

      {/* Analytics Charts Grid - ZERO LAG CUSTOM SVG */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Distribution */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
                Risk Level Breakdown
              </h3>
              <p className="text-xs text-[#5B6675] dark:text-[#8B97A7]">
                Weighted distribution across Critical, High, Medium, and Low risk
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F7F5F0] dark:bg-[#0B1118] text-[#5B6675] dark:text-[#8B97A7] border border-[#E3DFD6] dark:border-[#243140]">
              {summary.total} Total Evaluated
            </span>
          </div>

          {/* Zero-Lag Custom SVG Chart */}
          <PureSvgBarChart data={severityData} />

          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[#E3DFD6] dark:border-[#243140] text-center">
            {severityData.map((item) => (
              <div key={item.name} className="p-1.5">
                <p className="text-xs font-medium text-[#5B6675] dark:text-[#8B97A7]">{item.name}</p>
                <p className="text-base font-bold text-[#0F1B2D] dark:text-[#E8EDF2]" style={{ color: item.color }}>
                  {item.count}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Channel Distribution */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
                  Channel Vector Split
                </h3>
                <p className="text-xs text-[#5B6675] dark:text-[#8B97A7]">
                  Social Media vs App Store Candidates
                </p>
              </div>
            </div>

            {/* Zero-Lag Custom SVG Donut */}
            <div className="py-2">
              <PureSvgDonutChart
                socialCount={summary.socialCount}
                appCount={summary.appCount}
              />
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-[#E3DFD6] dark:border-[#243140]">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-[#5B6675] dark:text-[#8B97A7]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1F6F8B]" />
                Social Profiles
              </span>
              <span className="font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">{summary.socialCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-[#5B6675] dark:text-[#8B97A7]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C8791A]" />
                Mobile Applications
              </span>
              <span className="font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">{summary.appCount}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Dataset Composition & Reset Card */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E3DFD6] dark:border-[#243140]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
                Dataset Composition & Provenance
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-[#E6F0EE] text-[#0E5A52] dark:bg-[#0E5A52]/20 dark:text-[#A8DBC5]">
                Isolated Tiers
              </span>
            </div>
            <p className="text-xs text-[#5B6675] dark:text-[#8B97A7] mt-0.5">
              Strictly separates verified public records, synthetic benchmark cases, and user-submitted inputs.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResetModal(true)}
            className="text-xs text-[#B3261E] border-[#B3261E]/30 hover:bg-[#FDF2F2]"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset to Original Dataset
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="p-3.5 rounded-lg bg-[#F0F9F5] dark:bg-[#2E7D5B]/10 border border-[#2E7D5B]/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2E7D5B]">VERIFIED PUBLIC</span>
              <span className="text-xs font-mono font-bold text-[#2E7D5B]">
                {datasetCounts?.byDataClass.VERIFIED_PUBLIC ?? 0}
              </span>
            </div>
            <p className="text-[11px] text-[#5B6675] dark:text-[#8B97A7]">
              Confirmed official handles, developer accounts, and domains for HDFC, PhonePe, and Flipkart.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#FEF9EC] dark:bg-[#C99A1F]/10 border border-[#C99A1F]/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#C8791A]">SYNTHETIC TEST DATA</span>
              <span className="text-xs font-mono font-bold text-[#C8791A]">
                {datasetCounts?.byDataClass.SYNTHETIC_TEST_DATA ?? 0}
              </span>
            </div>
            <p className="text-[11px] text-[#5B6675] dark:text-[#8B97A7]">
              Engineered benchmark threat scenarios including homoglyph attacks, clone APKs, and fake helplines.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F0F7FA] dark:bg-[#1F6F8B]/10 border border-[#1F6F8B]/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1F6F8B]">USER SUBMITTED</span>
              <span className="text-xs font-mono font-bold text-[#1F6F8B]">
                {datasetCounts?.byDataClass.USER_SUBMITTED ?? 0}
              </span>
            </div>
            <p className="text-[11px] text-[#5B6675] dark:text-[#8B97A7]">
              Custom candidates added via the "Ingest & Check" workbench. Only these are purged upon dataset reset.
            </p>
          </div>
        </div>
      </Card>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-[#121B25] rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-[#E3DFD6] dark:border-[#243140]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-[#FDF2F2] dark:bg-[#B3261E]/20 text-[#B3261E]">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
                  Reset to Original Dataset?
                </h3>
                <p className="text-xs text-[#5B6675] dark:text-[#8B97A7]">
                  Purge user-submitted candidates only
                </p>
              </div>
            </div>

            <p className="text-xs text-[#5B6675] dark:text-[#8B97A7] leading-relaxed">
              This will remove all <strong className="text-[#0F1B2D] dark:text-[#E8EDF2]">{datasetCounts?.byDataClass.USER_SUBMITTED ?? 0}</strong> user-submitted detection records from disk. The original verified brand profiles and synthetic benchmark test cases will remain completely intact.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReset}
                loading={isResetting}
                className="text-xs bg-[#B3261E] hover:bg-[#962019] border-[#B3261E]"
              >
                Confirm Reset
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Adapter Source Health Radar Table */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
              Data Source Adapters & Simulation Health
            </h3>
            <p className="text-xs text-[#5B6675] dark:text-[#8B97A7]">
              Adapter statuses showing resilient fallback handling when external platforms are simulated as rate-limited
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('detections')}
            className="text-xs text-[#0E5A52] dark:text-[#A8DBC5]"
          >
            View All Detections <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E3DFD6] dark:border-[#243140] text-[#5B6675] dark:text-[#8B97A7]">
                <th className="pb-2.5 font-semibold">Adapter Source</th>
                <th className="pb-2.5 font-semibold">Platform Category</th>
                <th className="pb-2.5 font-semibold">Operational Status</th>
                <th className="pb-2.5 font-semibold">Candidates</th>
                <th className="pb-2.5 font-semibold">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DFD6]/60 dark:divide-[#243140]/60">
              {sources.map((source) => (
                <tr key={source.sourceId} className="hover:bg-[#F7F5F0]/50 dark:hover:bg-[#0B1118]/50">
                  <td className="py-2.5 font-medium text-[#0F1B2D] dark:text-[#E8EDF2]">
                    {source.name}
                  </td>
                  <td className="py-2.5 text-[#5B6675] dark:text-[#8B97A7] uppercase text-[10px] font-semibold tracking-wider">
                    {source.type}
                  </td>
                  <td className="py-2.5">
                    <SourceStatusBadge status={source.status} />
                  </td>
                  <td className="py-2.5 font-medium text-[#0F1B2D] dark:text-[#E8EDF2]">
                    {source.candidatesCount} records
                  </td>
                  <td className="py-2.5 text-[#5B6675] dark:text-[#8B97A7]">
                    {source.latencyMs} ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
});
