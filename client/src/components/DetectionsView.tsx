/**
 * [client/src/components/DetectionsView.tsx]
 * Detections Management View for BrandShield AI.
 * Includes URL-synced combinable filters, 25/page pagination, CSV export,
 * and deterministic Threat Analysis modal with side-by-side comparison and score gauge.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Download,
  CheckCircle,
  XCircle,
  ExternalLink,
  Shield,
  Smartphone,
  Share2,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Info,
  CheckSquare,
  Building,
  Globe,
  Sparkles,
} from 'lucide-react';
import { Detection, BrandProfile } from '../types/index.js';
import { Card } from './ui/Card.js';
import { Button } from './ui/Button.js';
import { SeverityChip } from './ui/SeverityChip.js';
import { Badge } from './ui/Badge.js';
import { Modal } from './ui/Modal.js';
import { exportDetectionsToCSV } from '../lib/utils.js';
import { api } from '../lib/api.js';

export interface DetectionsViewProps {
  detections: Detection[];
  profile: BrandProfile;
  brands: BrandProfile[];
  onUpdateStatus: (id: string, status: 'active' | 'confirmed' | 'false_positive') => Promise<void>;
}

export const DetectionsView: React.FC<DetectionsViewProps> = React.memo(({
  detections,
  profile,
  brands,
  onUpdateStatus,
}) => {
  // Initialize filter state from URL search params if present
  const [searchQuery, setSearchQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || '';
  });
  const [brandFilter, setBrandFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('brand') || 'all';
  });
  const [platformFilter, setPlatformFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('platform') || 'all';
  });
  const [riskFilter, setRiskFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('risk') || 'all';
  });
  const [reasonFilter, setReasonFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('reason') || 'all';
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);

  const handleEnrichAI = async () => {
    if (!selectedDetection) return;
    setIsEnriching(true);
    try {
      const res = await api.enrichThreat(selectedDetection.recordId || selectedDetection.id);
      setSelectedDetection((prev) => (prev ? { ...prev, analysis: res.enrichment } : null));
    } catch (err: any) {
      alert(`[DetectionsView.tsx] AI Enrichment failed: ${err.message}`);
    } finally {
      setIsEnriching(false);
    }
  };

  // Sync state to URL search parameters without page reload
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (brandFilter !== 'all') params.set('brand', brandFilter);
    if (platformFilter !== 'all') params.set('platform', platformFilter);
    if (riskFilter !== 'all') params.set('risk', riskFilter);
    if (reasonFilter !== 'all') params.set('reason', reasonFilter);

    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [searchQuery, brandFilter, platformFilter, riskFilter, reasonFilter]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, brandFilter, platformFilter, riskFilter, reasonFilter]);

  // Filter evaluation
  const filtered = useMemo(() => {
    return detections.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (d.accountOrAppName || d.name || '').toLowerCase().includes(q) ||
        (d.handle || '').toLowerCase().includes(q) ||
        (d.packageId || '').toLowerCase().includes(q) ||
        (d.publisherOrDeveloper || d.developerName || '').toLowerCase().includes(q) ||
        (d.description || '').toLowerCase().includes(q);

      const matchesBrand =
        brandFilter === 'all' ||
        (d.brandName || '').toLowerCase() === brandFilter.toLowerCase();

      const matchesPlatform =
        platformFilter === 'all' ||
        d.platform.toLowerCase().includes(platformFilter.toLowerCase());

      const matchesRisk =
        riskFilter === 'all' ||
        d.riskLevel === riskFilter ||
        d.severity === riskFilter;

      const matchesReason =
        reasonFilter === 'all' ||
        d.reasons.some((r) => {
          if (reasonFilter === 'lookalike') return r.includes('NAME_SIMILARITY') || r.includes('HOMOGLYPH') || r.includes('ADDED_AFFIXES');
          if (reasonFilter === 'scam') return r.includes('SCAM') || r.includes('PHISHING') || r.includes('HIGH_RISK');
          if (reasonFilter === 'publisher') return r.includes('PUBLISHER_MISMATCH');
          if (reasonFilter === 'domain') return r.includes('DOMAIN_MISMATCH');
          return true;
        });

      return matchesSearch && matchesBrand && matchesPlatform && matchesRisk && matchesReason;
    });
  }, [detections, searchQuery, brandFilter, platformFilter, riskFilter, reasonFilter]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage]);

  const handleStatusChange = useCallback(async (status: 'confirmed' | 'false_positive') => {
    if (!selectedDetection) return;
    await onUpdateStatus(selectedDetection.recordId || selectedDetection.id, status);
    setSelectedDetection((prev) => prev ? { ...prev, status } : null);
  }, [selectedDetection, onUpdateStatus]);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="brand">BrandShield Threat Intelligence</Badge>
            <span className="text-xs text-[#5B6675] dark:text-[#8B97A7]">
              Multi-Signal Detection
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F1B2D] dark:text-[#E8EDF2] mt-1 tracking-tight">
            Impersonation Detections
          </h1>
          <p className="text-xs text-[#5B6675] dark:text-[#8B97A7] mt-0.5">
            Transparent risk scores with itemized evidence points and false-positive prevention.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportDetectionsToCSV(filtered, brandFilter === 'all' ? 'All_Brands' : brandFilter)}
            className="text-xs"
            title="Download detections report in CSV format"
          >
            <Download className="w-3.5 h-3.5 mr-1 text-[#0E5A52] dark:text-[#A8DBC5]" />
            Export CSV ({filtered.length})
          </Button>
        </div>
      </div>

      {/* Combinable & URL-Synced Filters Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#5B6675] dark:text-[#8B97A7]" />
            <input
              type="text"
              placeholder="Search name, handle, publisher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-[#F7F5F0] dark:bg-[#0B1118] text-[#0F1B2D] dark:text-[#E8EDF2] border border-[#E3DFD6] dark:border-[#243140] rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0E5A52]"
            />
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full text-xs bg-[#F7F5F0] dark:bg-[#0B1118] text-[#0F1B2D] dark:text-[#E8EDF2] border border-[#E3DFD6] dark:border-[#243140] rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0E5A52]"
            >
              <option value="all">All Brands</option>
              <option value="HDFC Bank">HDFC Bank</option>
              <option value="PhonePe">PhonePe</option>
              <option value="Flipkart">Flipkart</option>
            </select>
          </div>

          {/* Platform Filter */}
          <div>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full text-xs bg-[#F7F5F0] dark:bg-[#0B1118] text-[#0F1B2D] dark:text-[#E8EDF2] border border-[#E3DFD6] dark:border-[#243140] rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0E5A52]"
            >
              <option value="all">All Platforms</option>
              <option value="x">X (Twitter)</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="linkedin">LinkedIn</option>
              <option value="telegram">Telegram</option>
              <option value="google play">Google Play</option>
              <option value="app store">Apple App Store</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full text-xs bg-[#F7F5F0] dark:bg-[#0B1118] text-[#0F1B2D] dark:text-[#E8EDF2] border border-[#E3DFD6] dark:border-[#243140] rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0E5A52]"
            >
              <option value="all">All Risk Levels</option>
              <option value="Critical">Critical Threat</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low / Benign</option>
              <option value="Safe">Safe / Official</option>
            </select>
          </div>

          {/* Detection Reason Filter */}
          <div>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="w-full text-xs bg-[#F7F5F0] dark:bg-[#0B1118] text-[#0F1B2D] dark:text-[#E8EDF2] border border-[#E3DFD6] dark:border-[#243140] rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0E5A52]"
            >
              <option value="all">All Detection Reasons</option>
              <option value="lookalike">Lookalike / Homoglyph</option>
              <option value="scam">Scam / Phishing Intent</option>
              <option value="publisher">Publisher Mismatch</option>
              <option value="domain">Domain Mismatch</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Tags */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E3DFD6] dark:border-[#243140] text-xs text-[#5B6675] dark:text-[#8B97A7]">
          <span>
            Showing <strong className="text-[#0F1B2D] dark:text-[#E8EDF2]">{filtered.length}</strong> matching candidates
          </span>
          {(searchQuery || brandFilter !== 'all' || platformFilter !== 'all' || riskFilter !== 'all' || reasonFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setBrandFilter('all');
                setPlatformFilter('all');
                setRiskFilter('all');
                setReasonFilter('all');
              }}
              className="text-[#0E5A52] hover:underline font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </Card>

      {/* Detections Data Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F7F5F0]/70 dark:bg-[#0B1118]/70 border-b border-[#E3DFD6] dark:border-[#243140] text-[#5B6675] dark:text-[#8B97A7]">
                <th className="py-3 px-4 font-semibold">Brand & Asset Name</th>
                <th className="py-3 px-3 font-semibold">Platform & Type</th>
                <th className="py-3 px-3 font-semibold">Data Class</th>
                <th className="py-3 px-3 font-semibold">Publisher / Handle</th>
                <th className="py-3 px-3 font-semibold">Risk Score</th>
                <th className="py-3 px-3 font-semibold">Severity</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DFD6]/60 dark:divide-[#243140]/60">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5B6675] dark:text-[#8B97A7]">
                    No candidate records match your current filter parameters.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((item) => {
                  const isApp = ['google play', 'apple app store', 'app store', 'google_play'].includes(item.platform.toLowerCase());
                  const displayName = item.accountOrAppName || item.name;
                  const isExcluded = item.isExcluded;

                  return (
                    <tr
                      key={item.recordId || item.id}
                      className="hover:bg-[#F7F5F0]/50 dark:hover:bg-[#0B1118]/50 transition-colors"
                    >
                      {/* Name & Brand */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded bg-[#F7F5F0] dark:bg-[#0B1118] border border-[#E3DFD6] dark:border-[#243140] flex items-center justify-center flex-shrink-0 text-[#5B6675]">
                            {isApp ? <Smartphone className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
                                {displayName}
                              </span>
                              {isExcluded && (
                                <span className="text-[10px] font-semibold text-[#1F6F8B] bg-[#F0F7FA] px-1.5 rounded border border-[#A2D0E0]">
                                  Official
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#5B6675] dark:text-[#8B97A7]">
                              Target: {item.brandName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Platform */}
                      <td className="py-3 px-3">
                        <span className="font-medium text-[#0F1B2D] dark:text-[#E8EDF2]">
                          {item.platform}
                        </span>
                      </td>

                      {/* Data Class */}
                      <td className="py-3 px-3">
                        {item.dataClass === 'SYNTHETIC_TEST_DATA' ? (
                          <Badge variant="synthetic">SYNTHETIC TEST DATA</Badge>
                        ) : (
                          <Badge variant="verified">VERIFIED PUBLIC</Badge>
                        )}
                      </td>

                      {/* Publisher or Handle */}
                      <td className="py-3 px-3">
                        <span className="text-[#5B6675] dark:text-[#8B97A7] truncate max-w-[160px] block">
                          {item.publisherOrDeveloper || item.developerName || (item.handle ? `@${item.handle}` : 'N/A')}
                        </span>
                      </td>

                      {/* Risk Score */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#0F1B2D] dark:text-[#E8EDF2]">
                            {item.riskScore}
                          </span>
                          <span className="text-[10px] text-[#5B6675]">/100</span>
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="py-3 px-3">
                        <SeverityChip severity={item.riskLevel || item.severity} />
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDetection(item)}
                          className="text-xs"
                        >
                          Inspect Analysis
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls (25 items per page) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E3DFD6] dark:border-[#243140] text-xs">
            <span className="text-[#5B6675] dark:text-[#8B97A7]">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Modal — Deterministic Threat Analysis Panel */}
      {selectedDetection && (
        <Modal
          isOpen={Boolean(selectedDetection)}
          onClose={() => setSelectedDetection(null)}
          maxWidth="2xl"
          title={
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0E5A52]" />
              <span>Candidate Threat Analysis & Audit</span>
            </div>
          }
        >
          <div className="space-y-5 text-xs">
            {/* Top Bar: Identity & Data Class */}
            <div className="p-3.5 rounded-lg bg-[#F7F5F0] dark:bg-[#0B1118] border border-[#E3DFD6] dark:border-[#243140] flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-sm text-[#0F1B2D] dark:text-[#E8EDF2]">
                  {selectedDetection.accountOrAppName || selectedDetection.name}
                </p>
                <p className="text-[11px] text-[#5B6675] dark:text-[#8B97A7]">
                  Record ID: <code className="font-mono">{selectedDetection.recordId || selectedDetection.id}</code> · Platform: <strong>{selectedDetection.platform}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedDetection.dataClass === 'SYNTHETIC_TEST_DATA' ? (
                  <Badge variant="synthetic">SYNTHETIC TEST DATA</Badge>
                ) : (
                  <Badge variant="verified">VERIFIED PUBLIC</Badge>
                )}
                <SeverityChip severity={selectedDetection.riskLevel || selectedDetection.severity} />
              </div>
            </div>

            {/* Score Breakdown Gauge & Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-lg border border-[#E3DFD6] dark:border-[#243140] text-center bg-white dark:bg-[#121B25]">
                <p className="text-[10px] uppercase font-bold text-[#5B6675] dark:text-[#8B97A7]">Risk Score</p>
                <div className="text-3xl font-extrabold text-[#0F1B2D] dark:text-[#E8EDF2] my-1">
                  {selectedDetection.riskScore}<span className="text-xs text-[#5B6675]">/100</span>
                </div>
                <div className="w-full bg-[#E3DFD6] dark:bg-[#243140] h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${selectedDetection.riskScore}%`,
                      backgroundColor:
                        selectedDetection.riskScore >= 80 ? '#B3261E' :
                        selectedDetection.riskScore >= 60 ? '#D9622B' :
                        selectedDetection.riskScore >= 35 ? '#C99A1F' : '#2E7D5B',
                    }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-[#E3DFD6] dark:border-[#243140] bg-white dark:bg-[#121B25] space-y-1.5">
                <p className="text-[10px] uppercase font-bold text-[#5B6675] dark:text-[#8B97A7]">Similarity Metrics</p>
                <div className="flex justify-between">
                  <span className="text-[#5B6675]">Name Similarity:</span>
                  <strong className="text-[#0F1B2D] dark:text-[#E8EDF2]">{selectedDetection.nameSimilarityScore ?? 'N/A'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B6675]">Logo Similarity:</span>
                  <strong className="text-[#0F1B2D] dark:text-[#E8EDF2]">{selectedDetection.logoSimilarityScore !== null ? `${Math.round(selectedDetection.logoSimilarityScore * 100)}%` : 'Null (No asset)'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B6675]">Domain Match:</span>
                  <strong className={selectedDetection.officialDomainMatch === 'Yes' ? 'text-[#2E7D5B]' : 'text-[#B3261E]'}>
                    {selectedDetection.officialDomainMatch || 'No'}
                  </strong>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-[#E3DFD6] dark:border-[#243140] bg-white dark:bg-[#121B25] space-y-1.5">
                <p className="text-[10px] uppercase font-bold text-[#5B6675] dark:text-[#8B97A7]">Audit Attribution</p>
                <div className="flex justify-between">
                  <span className="text-[#5B6675]">Data Source:</span>
                  <strong className="text-[#0F1B2D] dark:text-[#E8EDF2]">{selectedDetection.dataSource}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B6675]">Dataset Gen:</span>
                  <strong className="text-[#0F1B2D] dark:text-[#E8EDF2]">Oct 13, 2026</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B6675]">Status:</span>
                  <strong className="capitalize text-[#0E5A52] dark:text-[#A8DBC5]">{selectedDetection.status}</strong>
                </div>
              </div>
            </div>

            {/* AI Threat Intel Panel / Enrichment CTA */}
            <div className="p-3.5 rounded-lg border border-[#0E5A52]/30 bg-[#E6F0EE]/30 dark:bg-[#0E5A52]/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#0E5A52] dark:text-[#A8DBC5]">
                  <Sparkles className="w-3.5 h-3.5 text-[#0E5A52] dark:text-[#A8DBC5]" />
                  <span>AI Threat Intelligence & Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white dark:bg-[#121B25] border border-[#0E5A52]/30 text-[#0E5A52] dark:text-[#A8DBC5]">
                    {selectedDetection.analysis?.provider?.includes('Gemini')
                      ? 'Generated by Gemini'
                      : 'AI unavailable, showing rule-based analysis'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEnrichAI}
                    loading={isEnriching}
                    className="text-[11px] h-7 px-2.5 border-[#0E5A52] text-[#0E5A52] hover:bg-[#0E5A52] hover:text-white"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {selectedDetection.analysis?.provider?.includes('Gemini') ? 'Re-analyze with Gemini' : 'Enrich with Gemini AI'}
                  </Button>
                </div>
              </div>

              {isEnriching ? (
                <div className="space-y-2 py-1 animate-pulse">
                  <div className="h-3 bg-[#0E5A52]/15 dark:bg-[#0E5A52]/25 rounded w-full" />
                  <div className="h-3 bg-[#0E5A52]/15 dark:bg-[#0E5A52]/25 rounded w-5/6" />
                </div>
              ) : (
                <>
                  <p className="text-xs text-[#0F1B2D] dark:text-[#E8EDF2] leading-relaxed">
                    {selectedDetection.analysis?.threatExplanation || 'Analyzing threat vectors across social channels and app ecosystem...'}
                  </p>

                  {selectedDetection.analysis?.scamIntent && (
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-white dark:bg-[#121B25] border border-[#0E5A52]/20 text-[11px]">
                      <span className="font-bold text-[#0E5A52] dark:text-[#A8DBC5]">
                        AI-assisted signal:
                      </span>
                      <span className="text-[#5B6675] dark:text-[#8B97A7]">
                        Scam intent: <strong className="text-[#0F1B2D] dark:text-[#E8EDF2] capitalize">{selectedDetection.analysis.scamIntent.classification}</strong> (confidence: {Math.round(selectedDetection.analysis.scamIntent.confidence * 100)}%)
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Official Asset vs Candidate Asset Side-by-Side Comparison */}
            <div className="p-3.5 rounded-lg border border-[#E3DFD6] dark:border-[#243140] bg-[#F7F5F0]/40 dark:bg-[#0B1118]/40 space-y-2.5">
              <p className="font-bold text-xs text-[#0F1B2D] dark:text-[#E8EDF2] flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#0E5A52]" />
                Official Asset vs Candidate Side-by-Side Comparison
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded bg-white dark:bg-[#121B25] border border-[#A8DBC5]/40 space-y-1">
                  <span className="text-[10px] font-bold text-[#2E7D5B] uppercase block">Official Brand Asset</span>
                  <p className="font-semibold text-[#0F1B2D] dark:text-[#E8EDF2]">{selectedDetection.brandName}</p>
                  <p className="text-[11px] text-[#5B6675]">Verified Domain: {profile.officialDomain || profile.domains[0] || 'Official Domain'}</p>
                  <p className="text-[11px] text-[#5B6675]">Publisher: {profile.officialApps[0]?.publisherName || profile.legalName || 'Authorized Entity'}</p>
                </div>

                <div className="p-2.5 rounded bg-white dark:bg-[#121B25] border border-[#F8B4B4]/40 space-y-1">
                  <span className="text-[10px] font-bold text-[#B3261E] uppercase block">Candidate Under Review</span>
                  <p className="font-semibold text-[#0F1B2D] dark:text-[#E8EDF2]">{selectedDetection.accountOrAppName || selectedDetection.name}</p>
                  <p className="text-[11px] text-[#5B6675]">Listing / URL: {selectedDetection.urlOrListing || selectedDetection.profileUrl || 'None'}</p>
                  <p className="text-[11px] text-[#5B6675]">Claimed Publisher: {selectedDetection.publisherOrDeveloper || selectedDetection.developerName || 'Unauthorized / None'}</p>
                </div>
              </div>
            </div>

            {/* Assessment Reasons Table */}
            <div>
              <p className="font-bold text-xs text-[#0F1B2D] dark:text-[#E8EDF2] mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#0E5A52]" />
                Assessment Evidence & Scoring Reasons
              </p>
              <ul className="space-y-1.5">
                {selectedDetection.reasons.map((reason, idx) => (
                  <li
                    key={idx}
                    className="p-2 rounded bg-white dark:bg-[#121B25] border border-[#E3DFD6] dark:border-[#243140] flex items-start gap-2 text-xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0E5A52] mt-1.5 flex-shrink-0" />
                    <span className="text-[#0F1B2D] dark:text-[#E8EDF2]">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Action & Operational Checklist */}
            <div className="p-3.5 rounded-lg bg-[#E6F0EE] dark:bg-[#0E5A52]/15 border border-[#0E5A52]/20 dark:border-[#0E5A52]/30 space-y-2">
              <p className="font-bold text-xs text-[#0E5A52] dark:text-[#A8DBC5] flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-[#0E5A52] dark:text-[#A8DBC5]" />
                Recommended Response Action
              </p>
              <p className="text-xs text-[#0F1B2D] dark:text-[#E8EDF2]">
                {selectedDetection.recommendedAction}
              </p>

              {selectedDetection.actionChecklist?.length > 0 && (
                <div className="pt-2 border-t border-[#0E5A52]/20">
                  <p className="text-[11px] font-semibold text-[#0E5A52] dark:text-[#A8DBC5] mb-1">Operational Checklist:</p>
                  <ul className="space-y-1">
                    {selectedDetection.actionChecklist.map((task, i) => (
                      <li key={i} className="flex items-center gap-2 text-[11px] text-[#0F1B2D] dark:text-[#E8EDF2]">
                        <input type="checkbox" className="rounded text-[#0E5A52] focus:ring-0" defaultChecked={i === 0} />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer: Triage Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#E3DFD6] dark:border-[#243140]">
              <div className="text-[11px] text-[#5B6675]">
                Triage Status: <strong className="capitalize">{selectedDetection.status}</strong>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('false_positive')}
                  className="text-xs text-[#2E7D5B] border-[#A8DBC5]"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  Mark False Positive
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleStatusChange('confirmed')}
                  className="text-xs"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Confirm Threat
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
});
