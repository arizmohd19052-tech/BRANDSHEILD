/**
 * [client/src/components/IngestCheckView.tsx]
 * "Ingest & Check" interactive analysis workbench.
 * Supports single item testing with logo upload and bulk CSV evaluation (up to 200 rows),
 * runs the server-side deterministic detection engine, excludes official assets first,
 * and allows saving verified detections as USER_SUBMITTED records.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Info,
  ExternalLink,
  Download,
  Database,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Card } from './ui/Card.js';
import { Button } from './ui/Button.js';
import { SeverityChip } from './ui/SeverityChip.js';
import { api } from '../lib/api.js';
import { cn } from '../lib/utils.js';
import {
  BrandProfile,
  IngestCheckResponse,
  Detection,
  ThreatAnalysis,
} from '../types/index.js';

interface IngestCheckViewProps {
  brands: BrandProfile[];
  activeBrandName: string;
  onDetectionAdded?: (detection: Detection) => void;
  onNavigate?: (tab: string) => void;
}

interface BulkRowResult {
  row: number;
  brandName: string;
  type: string;
  name: string;
  result?: IngestCheckResponse;
  error?: string;
  saved?: boolean;
}

export const IngestCheckView: React.FC<IngestCheckViewProps> = ({
  brands,
  activeBrandName,
  onDetectionAdded,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  // Single Form State
  const [brandName, setBrandName] = useState(activeBrandName || (brands[0]?.brandName ?? 'HDFC Bank'));
  const [type, setType] = useState<'social' | 'app' | 'domain'>('social');
  const [name, setName] = useState('');
  const [urlOrListing, setUrlOrListing] = useState('');
  const [publisher, setPublisher] = useState('');
  const [description, setDescription] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Single Evaluation State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<IngestCheckResponse | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [aiEnrichment, setAiEnrichment] = useState<ThreatAnalysis | null>(null);
  const [isEnrichingAI, setIsEnrichingAI] = useState(false);

  // Bulk State
  const [csvText, setCsvText] = useState('');
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [isBulkEvaluating, setIsBulkEvaluating] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkRowResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeBrandName && brands.some((b) => b.brandName === activeBrandName)) {
      setBrandName(activeBrandName);
    }
  }, [activeBrandName, brands]);

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setValidationErrors((prev) => ({ ...prev, logo: 'Logo must be PNG, JPEG, or WebP' }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setValidationErrors((prev) => ({ ...prev, logo: 'Logo size exceeds 2 MB limit' }));
      return;
    }

    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next.logo;
      return next;
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  // Validate Single Form
  const validateSingle = (): boolean => {
    const errors: { [key: string]: string } = {};
    if (!brandName.trim()) errors.brandName = 'Brand to protect is required';
    if (!name.trim()) errors.name = 'Candidate account or app name is required';
    if (name.trim().length > 120) errors.name = 'Name must be 120 characters or fewer';
    if (urlOrListing && urlOrListing.length > 500) errors.urlOrListing = 'URL exceeds 500 characters';
    if (publisher && publisher.length > 150) errors.publisher = 'Publisher name exceeds 150 characters';
    if (description && description.length > 1000) errors.description = 'Description exceeds 1000 characters';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Single Form
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSingle()) return;

    setIsEvaluating(true);
    setEvalError(null);
    setResult(null);
    setIsSaved(false);
    setAiEnrichment(null);
    setIsEnrichingAI(false);

    try {
      const res = await api.checkIngest({
        brandName,
        type,
        name: name.trim(),
        urlOrListing: urlOrListing.trim() || undefined,
        publisher: publisher.trim() || undefined,
        description: description.trim() || undefined,
        logoDataUrl: logoPreview || undefined,
      });
      setResult(res);

      // Async AI Threat Intelligence: Non-blocking separate call
      if (res.detection && !res.isExcluded) {
        setIsEnrichingAI(true);
        api.enrichThreatDirect(res.detection, brandName)
          .then((enrichRes) => {
            if (enrichRes?.enrichment) {
              setAiEnrichment(enrichRes.enrichment);
            }
          })
          .catch((err) => {
            console.warn('[IngestCheckView.tsx] AI enrichment fallback:', err);
            if (res.detection?.analysis) {
              setAiEnrichment(res.detection.analysis);
            }
          })
          .finally(() => {
            setIsEnrichingAI(false);
          });
      }
    } catch (err: any) {
      setEvalError(err.message || 'Failed to evaluate candidate');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Save to detections
  const handleSaveToDetections = async () => {
    if (!result?.detection || isSaved) return;

    setSaveLoading(true);
    try {
      const savedRes = await api.saveIngest(result.detection);
      setIsSaved(true);
      if (onDetectionAdded) {
        onDetectionAdded(savedRes.detection);
      }
    } catch (err: any) {
      alert(`[IngestCheckView.tsx] Failed to save detection: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  // Download CSV template
  const handleDownloadTemplate = () => {
    const csvContent =
      'brandName,type,name,urlOrListing,publisher,description\n' +
      'HDFC Bank,social,HDFC Bank Official Support,https://twitter.com/hdfc_urgent_care,,24x7 customer support desk\n' +
      'PhonePe,app,PhonePe Fast Cash Loan,https://play.google.com/store/apps/details?id=com.instant.phonepepay,Fast Loans Inc,Instant 5 minute loans via UPI\n' +
      'Flipkart,domain,flipkart-exclusive-deals.net,https://flipkart-exclusive-deals.net,,Discount warehouse portal\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'brandshield_ingest_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle CSV file upload
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      validateCsv(text);
    };
    reader.readAsText(file);
  };

  // Validate CSV
  const validateCsv = (text: string): { valid: boolean; rows: any[] } => {
    const errors: string[] = [];
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (lines.length <= 1) {
      errors.push('CSV must contain a header row and at least 1 data row.');
      setBulkErrors(errors);
      return { valid: false, rows: [] };
    }

    if (lines.length > 201) {
      errors.push('Maximum 200 candidate rows per bulk ingestion run.');
      setBulkErrors(errors);
      return { valid: false, rows: [] };
    }

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const brandIdx = header.indexOf('brandname');
    const typeIdx = header.indexOf('type');
    const nameIdx = header.indexOf('name');
    const urlIdx = header.indexOf('urlorlisting');
    const pubIdx = header.indexOf('publisher');
    const descIdx = header.indexOf('description');

    if (brandIdx === -1 || typeIdx === -1 || nameIdx === -1) {
      errors.push("CSV header must contain at least 'brandName', 'type', and 'name' columns.");
      setBulkErrors(errors);
      return { valid: false, rows: [] };
    }

    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      const rowBrand = cols[brandIdx] || '';
      const rowType = (cols[typeIdx] || '').toLowerCase();
      const rowName = cols[nameIdx] || '';

      if (!rowBrand) {
        errors.push(`Row ${i + 1}: Missing brandName.`);
      }
      if (!['social', 'app', 'domain'].includes(rowType)) {
        errors.push(`Row ${i + 1}: Type must be 'social', 'app', or 'domain' (found '${rowType}').`);
      }
      if (!rowName) {
        errors.push(`Row ${i + 1}: Missing candidate name.`);
      }

      rows.push({
        row: i + 1,
        brandName: rowBrand,
        type: rowType as 'social' | 'app' | 'domain',
        name: rowName,
        urlOrListing: urlIdx !== -1 ? cols[urlIdx] : '',
        publisher: pubIdx !== -1 ? cols[pubIdx] : '',
        description: descIdx !== -1 ? cols[descIdx] : '',
      });
    }

    setBulkErrors(errors);
    return { valid: errors.length === 0, rows };
  };

  // Run Bulk Evaluation
  const handleRunBulk = async () => {
    const { valid, rows } = validateCsv(csvText);
    if (!valid || rows.length === 0) return;

    setIsBulkEvaluating(true);
    setBulkResults([]);

    const results: BulkRowResult[] = [];
    for (const r of rows) {
      try {
        const res = await api.checkIngest({
          brandName: r.brandName,
          type: r.type,
          name: r.name,
          urlOrListing: r.urlOrListing || undefined,
          publisher: r.publisher || undefined,
          description: r.description || undefined,
        });
        results.push({
          row: r.row,
          brandName: r.brandName,
          type: r.type,
          name: r.name,
          result: res,
        });
      } catch (err: any) {
        results.push({
          row: r.row,
          brandName: r.brandName,
          type: r.type,
          name: r.name,
          error: err.message || 'Evaluation failed',
        });
      }
      setBulkResults([...results]);
    }

    setIsBulkEvaluating(false);
  };

  // Bulk Save Single Row
  const handleBulkSaveRow = async (index: number) => {
    const item = bulkResults[index];
    if (!item?.result?.detection || item.saved) return;

    try {
      const savedRes = await api.saveIngest(item.result.detection);
      const updated = [...bulkResults];
      updated[index] = { ...item, saved: true };
      setBulkResults(updated);
      if (onDetectionAdded) onDetectionAdded(savedRes.detection);
    } catch (err: any) {
      alert(`[IngestCheckView.tsx] Failed to save row ${item.row}: ${err.message}`);
    }
  };

  // Bulk Save All Flagged
  const handleBulkSaveAll = async () => {
    for (let i = 0; i < bulkResults.length; i++) {
      const item = bulkResults[i];
      if (item.result?.detection && !item.saved) {
        await handleBulkSaveRow(i);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E3DFD6] dark:border-[#243140]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
              Ingest & Check Candidate Names
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[#E6F0EE] dark:bg-[#0E5A52]/20 text-[#0E5A52] dark:text-[#A8DBC5] border border-[#0E5A52]/30">
              Deterministic Engine
            </span>
          </div>
          <p className="text-xs text-[#5B6675] dark:text-[#8B97A7] mt-1">
            Input arbitrary suspicious social accounts, mobile apps, or domains to test them against your protected brand profile in real-time.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-[#F7F5F0] dark:bg-[#0B1118] p-1 rounded-lg border border-[#E3DFD6] dark:border-[#243140]">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'single'
                ? 'bg-white dark:bg-[#1A2634] text-[#0F1B2D] dark:text-[#E8EDF2] shadow-sm'
                : 'text-[#5B6675] dark:text-[#8B97A7] hover:text-[#0F1B2D]'
            }`}
          >
            Single Candidate Check
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'bulk'
                ? 'bg-white dark:bg-[#1A2634] text-[#0F1B2D] dark:text-[#E8EDF2] shadow-sm'
                : 'text-[#5B6675] dark:text-[#8B97A7] hover:text-[#0F1B2D]'
            }`}
          >
            Bulk CSV Ingest
          </button>
        </div>
      </div>

      {/* Explicit Disclosure Notice */}
      <div className="p-3.5 rounded-lg bg-[#F0F7FA] dark:bg-[#1F6F8B]/15 border border-[#1F6F8B]/25 text-xs text-[#1F6F8B] dark:text-[#A5D2E2] flex items-start gap-2.5">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div className="space-y-0.5">
          <p className="font-semibold">Analysis Scope Disclosure</p>
          <p className="opacity-90">
            This analyses the data you entered against the brand profile. It does not query live platforms. Official assets are verified against the allowlist first, and flagging requires multiple correlated threat indicators.
          </p>
        </div>
      </div>

      {activeTab === 'single' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Input Form */}
          <div className="lg:col-span-6 space-y-4">
            <Card className="p-5">
              <h2 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2] mb-3">
                Candidate Information
              </h2>
              <form onSubmit={handleSingleSubmit} className="space-y-4">
                {/* Brand Selection */}
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B2D] dark:text-[#E8EDF2] mb-1">
                    Brand to Protect *
                  </label>
                  <select
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-[#0B1118] border border-[#E3DFD6] dark:border-[#243140] text-[#0F1B2D] dark:text-[#E8EDF2] focus:outline-none focus:ring-1 focus:ring-[#0E5A52]"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.brandName}>
                        {b.brandName} ({b.industry})
                      </option>
                    ))}
                  </select>
                  {validationErrors.brandName && (
                    <p className="text-[11px] text-[#B3261E] mt-1">{validationErrors.brandName}</p>
                  )}
                </div>

                {/* Candidate Type */}
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B2D] dark:text-[#E8EDF2] mb-1">
                    Target Type *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'social', label: 'Social Profile' },
                      { id: 'app', label: 'Mobile App' },
                      { id: 'domain', label: 'URL / Domain' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setType(item.id as any)}
                        className={`py-2 px-2 text-xs font-medium rounded-md border text-center transition-colors ${
                          type === item.id
                            ? 'bg-[#0E5A52] text-white border-[#0E5A52]'
                            : 'bg-white dark:bg-[#0B1118] text-[#5B6675] dark:text-[#8B97A7] border-[#E3DFD6] dark:border-[#243140] hover:bg-[#F7F5F0]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Candidate Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B2D] dark:text-[#E8EDF2] mb-1">
                    Account or App Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      type === 'app'
                        ? 'e.g. PhonePe Instant Cash'
                        : type === 'domain'
                        ? 'e.g. hdfc-netbanking-login.com'
                        : 'e.g. HDFC Customer Support 24x7'
                    }
                    className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-[#0B1118] border border-[#E3DFD6] dark:border-[#243140] text-[#0F1B2D] dark:text-[#E8EDF2] focus:outline-none focus:ring-1 focus:ring-[#0E5A52]"
                  />
                  {validationErrors.name && (
                    <p className="text-[11px] text-[#B3261E] mt-1">{validationErrors.name}</p>
                  )}
                </div>

                {/* URL or Store Listing */}
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B2D] dark:text-[#E8EDF2] mb-1">
                    URL or Store Listing Link <span className="font-normal text-[#5B6675]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={urlOrListing}
                    onChange={(e) => setUrlOrListing(e.target.value)}
                    placeholder="e.g. https://play.google.com/store/apps/details?id=com.fake.app"
                    className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-[#0B1118] border border-[#E3DFD6] dark:border-[#243140] text-[#0F1B2D] dark:text-[#E8EDF2] focus:outline-none focus:ring-1 focus:ring-[#0E5A52]"
                  />
                  {validationErrors.urlOrListing && (
                    <p className="text-[11px] text-[#B3261E] mt-1">{validationErrors.urlOrListing}</p>
                  )}
                </div>

                {/* Publisher / Developer */}
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B2D] dark:text-[#E8EDF2] mb-1">
                    Publisher or Developer <span className="font-normal text-[#5B6675]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    placeholder="e.g. QuickLoan Services Ltd."
                    className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-[#0B1118] border border-[#E3DFD6] dark:border-[#243140] text-[#0F1B2D] dark:text-[#E8EDF2] focus:outline-none focus:ring-1 focus:ring-[#0E5A52]"
                  />
                </div>

                {/* Bio / Description */}
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B2D] dark:text-[#E8EDF2] mb-1">
                    Bio or App Description <span className="font-normal text-[#5B6675]">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Paste bio, claims of 24x7 helpline, urgency warnings, or promotional text..."
                    className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-[#0B1118] border border-[#E3DFD6] dark:border-[#243140] text-[#0F1B2D] dark:text-[#E8EDF2] focus:outline-none focus:ring-1 focus:ring-[#0E5A52]"
                  />
                </div>

                {/* Logo Image Upload */}
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B2D] dark:text-[#E8EDF2] mb-1">
                    Logo / Avatar Image <span className="font-normal text-[#5B6675]">(optional, PNG/JPG/WebP &le; 2MB)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      className="text-xs"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      Upload Logo
                    </Button>
                    {logoPreview && (
                      <div className="flex items-center gap-2">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-7 h-7 rounded border border-[#E3DFD6] object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleClearLogo}
                          className="text-[11px] text-[#B3261E] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                  {validationErrors.logo && (
                    <p className="text-[11px] text-[#B3261E] mt-1">{validationErrors.logo}</p>
                  )}
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full text-xs font-semibold py-2.5"
                    loading={isEvaluating}
                    disabled={!name.trim() || !brandName.trim() || isEvaluating}
                  >
                    {isEvaluating ? 'Evaluating with Deterministic Engine...' : 'Run Deterministic Evaluation'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Right: Evaluation Result Card */}
          <div className="lg:col-span-6 space-y-4">
            {evalError && (
              <div className="p-4 rounded-lg bg-[#FDF2F2] dark:bg-[#B3261E]/20 border border-[#B3261E]/30 text-xs text-[#B3261E] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-[#B3261E]" /> Evaluation Error
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleSingleSubmit(e)}
                    className="h-6 text-[11px] px-2.5 border-[#B3261E]/40 text-[#B3261E] hover:bg-[#B3261E] hover:text-white"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry Check
                  </Button>
                </div>
                <p className="font-mono text-[11px] leading-relaxed break-words">{evalError}</p>
              </div>
            )}

            {result ? (
              <Card className="p-5 space-y-5 border-2 border-[#0E5A52]/20">
                {/* Result Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
                        Evaluation Result
                      </h2>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#F7F5F0] dark:bg-[#0B1118] text-[#5B6675] dark:text-[#8B97A7] border border-[#E3DFD6] dark:border-[#243140]">
                        USER_SUBMITTED
                      </span>
                    </div>
                    <p className="text-xs text-[#5B6675] dark:text-[#8B97A7] mt-0.5">
                      Evaluated against verified profile of <strong className="text-[#0F1B2D] dark:text-[#E8EDF2]">{brandName}</strong>
                    </p>
                  </div>

                  {result.isExcluded ? (
                    <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-[#F0F9F5] text-[#2E7D5B] border border-[#2E7D5B]/30 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> Official Asset
                    </span>
                  ) : (
                    result.detection && <SeverityChip severity={result.detection.riskLevel} />
                  )}
                </div>

                {/* Official Asset Excluded Notification */}
                {result.isExcluded ? (
                  <div className="p-4 rounded-lg bg-[#F0F9F5] dark:bg-[#2E7D5B]/15 border border-[#2E7D5B]/30 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#2E7D5B]">
                      <CheckCircle2 className="w-4 h-4" />
                      Official Asset Verified: NOT FLAGGED
                    </div>
                    <p className="text-xs text-[#2E7D5B] dark:text-[#A8DBC5]">
                      {result.exclusionReason}
                    </p>
                    <p className="text-[11px] text-[#5B6675] dark:text-[#8B97A7]">
                      This asset matches an allowlisted handle, domain, or publisher on the verified profile. BrandShield AI will never flag legitimate organization properties.
                    </p>
                  </div>
                ) : result.detection ? (
                  <>
                    {/* Score Gauge & Breakdown */}
                    <div className="p-4 rounded-lg bg-[#F7F5F0] dark:bg-[#0B1118] border border-[#E3DFD6] dark:border-[#243140] flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[#5B6675] dark:text-[#8B97A7]">
                          Composite Risk Score
                        </p>
                        <p className="text-2xl font-black text-[#0F1B2D] dark:text-[#E8EDF2]">
                          {result.detection.riskScore} <span className="text-xs font-normal text-[#5B6675]">/ 100</span>
                        </p>
                        <p className="text-xs text-[#5B6675] dark:text-[#8B97A7]">
                          Multi-signal correlation required
                        </p>
                      </div>

                      {/* Mini Bar Breakdown */}
                      <div className="space-y-1.5 text-[11px] w-48">
                        <div className="flex justify-between text-[#5B6675] dark:text-[#8B97A7]">
                          <span>Name Similarity</span>
                          <span className="font-semibold text-[#0F1B2D] dark:text-[#E8EDF2]">{result.detection.nameSimilarityScore}%</span>
                        </div>
                        <div className="w-full bg-[#E3DFD6] dark:bg-[#243140] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#0E5A52] h-full"
                            style={{ width: `${Math.min(100, result.detection.nameSimilarityScore)}%` }}
                          />
                        </div>

                        {result.detection.logoSimilarityScore !== null && (
                          <>
                            <div className="flex justify-between text-[#5B6675] dark:text-[#8B97A7]">
                              <span>Logo Similarity</span>
                              <span className="font-semibold text-[#0F1B2D] dark:text-[#E8EDF2]">{result.detection.logoSimilarityScore}%</span>
                            </div>
                            <div className="w-full bg-[#E3DFD6] dark:bg-[#243140] h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-[#C8791A] h-full"
                                style={{ width: `${Math.min(100, result.detection.logoSimilarityScore)}%` }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Why this was flagged / Reasons with points */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
                        Detection Signals & Itemised Points
                      </h3>
                      <ul className="space-y-1 text-xs">
                        {result.detection.reasons.map((reason, idx) => (
                          <li
                            key={idx}
                            className="p-2 rounded bg-white dark:bg-[#1A2634] border border-[#E3DFD6] dark:border-[#243140] text-[#0F1B2D] dark:text-[#E8EDF2] flex items-start gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#B3261E] mt-1.5 flex-shrink-0" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Side by side comparison */}
                    <div className="p-3.5 rounded-lg border border-[#E3DFD6] dark:border-[#243140] bg-white dark:bg-[#121B25] space-y-2">
                      <h4 className="text-xs font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
                        Side-by-Side Asset Comparison
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-2 rounded bg-[#E6F0EE]/40 dark:bg-[#0E5A52]/10 border border-[#0E5A52]/20">
                          <p className="text-[10px] uppercase font-bold text-[#0E5A52] tracking-wider mb-1">
                            Official Brand Profile
                          </p>
                          <p className="font-semibold text-[#0F1B2D] dark:text-[#E8EDF2]">{brandName}</p>
                          <p className="text-[11px] text-[#5B6675] dark:text-[#8B97A7]">Verified Channels Protected</p>
                        </div>
                        <div className="p-2 rounded bg-[#FDF2F2]/60 dark:bg-[#B3261E]/10 border border-[#B3261E]/20">
                          <p className="text-[10px] uppercase font-bold text-[#B3261E] tracking-wider mb-1">
                            Candidate Submitted
                          </p>
                          <p className="font-semibold text-[#0F1B2D] dark:text-[#E8EDF2]">{name}</p>
                          <p className="text-[11px] text-[#5B6675] dark:text-[#8B97A7]">{publisher || 'Unknown Publisher'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Why not flagged (if low risk) or Recommended Action */}
                    {result.whyNotFlagged ? (
                      <div className="p-3 rounded bg-[#F7F5F0] dark:bg-[#0B1118] border border-[#E3DFD6] text-xs text-[#5B6675] dark:text-[#8B97A7]">
                        <strong className="text-[#0F1B2D] dark:text-[#E8EDF2]">Why this was not flagged as Critical/High:</strong> {result.whyNotFlagged}
                      </div>
                    ) : (
                      <div className="p-3 rounded bg-[#FEF9EC] dark:bg-[#332709] border border-[#F6DF9C] text-xs text-[#0F1B2D] dark:text-[#E8EDF2]">
                        <strong className="text-[#C8791A]">Recommended Action:</strong> {result.detection.recommendedAction}
                      </div>
                    )}

                    {/* AI Threat Intelligence Section (Asynchronous, Non-blocking) */}
                    {(isEnrichingAI || aiEnrichment) && (
                      <div className="p-3.5 rounded-lg border border-[#0E5A52]/30 bg-[#E6F0EE]/30 dark:bg-[#0E5A52]/10 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-[#0E5A52] dark:text-[#A8DBC5]">
                            <Sparkles className="w-3.5 h-3.5 text-[#0E5A52] dark:text-[#A8DBC5]" />
                            <span>AI Threat Intelligence</span>
                          </div>
                          {isEnrichingAI ? (
                            <span className="text-[10px] font-medium text-[#5B6675] dark:text-[#8B97A7] animate-pulse">
                              Enriching with AI...
                            </span>
                          ) : (
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-semibold border',
                                aiEnrichment?.provider?.includes('Gemini')
                                  ? 'bg-[#E6F0EE] text-[#0E5A52] border-[#0E5A52]/30 dark:bg-[#0E5A52]/30 dark:text-[#A8DBC5]'
                                  : 'bg-[#FEF9EC] text-[#C8791A] border-[#F6DF9C] dark:bg-[#332709] dark:text-[#E8BD68]'
                              )}
                            >
                              {aiEnrichment?.provider?.includes('Gemini')
                                ? 'Generated by Gemini'
                                : 'AI unavailable, showing rule-based analysis'}
                            </span>
                          )}
                        </div>

                        {isEnrichingAI ? (
                          /* Skeleton loader */
                          <div className="space-y-2 py-1 animate-pulse">
                            <div className="h-3 bg-[#0E5A52]/15 dark:bg-[#0E5A52]/25 rounded w-full" />
                            <div className="h-3 bg-[#0E5A52]/15 dark:bg-[#0E5A52]/25 rounded w-5/6" />
                            <div className="h-5 bg-[#0E5A52]/10 dark:bg-[#0E5A52]/20 rounded w-1/2 mt-2" />
                            <div className="space-y-1.5 pt-2">
                              <div className="h-2.5 bg-[#0E5A52]/10 dark:bg-[#0E5A52]/20 rounded w-4/5" />
                              <div className="h-2.5 bg-[#0E5A52]/10 dark:bg-[#0E5A52]/20 rounded w-3/4" />
                            </div>
                          </div>
                        ) : aiEnrichment ? (
                          <div className="space-y-2 text-xs">
                            <p className="text-[#0F1B2D] dark:text-[#E8EDF2] leading-relaxed">
                              {aiEnrichment.threatExplanation}
                            </p>

                            {/* Scam-intent AI-assisted signal */}
                            {aiEnrichment.scamIntent && (
                              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-white dark:bg-[#121B25] border border-[#0E5A52]/20 text-[11px]">
                                <span className="font-bold text-[#0E5A52] dark:text-[#A8DBC5]">
                                  AI-assisted signal:
                                </span>
                                <span className="text-[#5B6675] dark:text-[#8B97A7]">
                                  Scam intent: <strong className="text-[#0F1B2D] dark:text-[#E8EDF2] capitalize">{aiEnrichment.scamIntent.classification}</strong> (confidence: {Math.round(aiEnrichment.scamIntent.confidence * 100)}%)
                                </span>
                              </div>
                            )}

                            {/* Operational takedown steps */}
                            {aiEnrichment.actionChecklist?.length > 0 && (
                              <div className="pt-2 border-t border-[#0E5A52]/15 space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#0E5A52] dark:text-[#A8DBC5]">
                                  Recommended Takedown Steps
                                </p>
                                <ul className="space-y-1">
                                  {aiEnrichment.actionChecklist.map((step, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5 text-[11px] text-[#5B6675] dark:text-[#8B97A7]">
                                      <span className="text-[#0E5A52] font-semibold">{idx + 1}.</span>
                                      <span>{step}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="pt-2 flex items-center justify-between gap-3">
                      <Button
                        variant={isSaved ? 'outline' : 'primary'}
                        size="sm"
                        onClick={handleSaveToDetections}
                        disabled={isSaved || saveLoading}
                        className="text-xs w-full justify-center"
                      >
                        {isSaved ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-[#2E7D5B]" />
                            Added to User Detections
                          </>
                        ) : saveLoading ? (
                          'Saving...'
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 mr-1.5" />
                            Add to Detections (USER_SUBMITTED)
                          </>
                        )}
                      </Button>

                      {isSaved && onNavigate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onNavigate('detections')}
                          className="text-xs text-[#0E5A52] flex-shrink-0"
                        >
                          View in Detections <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      )}
                    </div>
                  </>
                ) : null}
              </Card>
            ) : (
              <Card className="p-8 text-center space-y-3 bg-[#F7F5F0]/50 dark:bg-[#0B1118]/50 border-dashed">
                <div className="w-12 h-12 rounded-full bg-[#E3DFD6] dark:bg-[#243140] mx-auto flex items-center justify-center text-[#5B6675]">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
                  No Candidate Evaluated Yet
                </h3>
                <p className="text-xs text-[#5B6675] dark:text-[#8B97A7] max-w-sm mx-auto">
                  Fill in the candidate parameters on the left and click "Run Deterministic Evaluation" to test against allowlists and threat models.
                </p>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* Bulk CSV Tab */
        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
                  Bulk CSV Ingestion (Up to 200 Rows)
                </h2>
                <p className="text-xs text-[#5B6675] dark:text-[#8B97A7]">
                  Paste or upload a CSV file with candidates across social profiles, mobile apps, and domains.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download CSV Template
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvFileUpload}
                  className="hidden"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Upload .CSV File
                </Button>
              </div>
            </div>

            {/* CSV Textarea */}
            <div>
              <label className="block text-xs font-semibold text-[#0F1B2D] dark:text-[#E8EDF2] mb-1">
                CSV Data Content
              </label>
              <textarea
                rows={8}
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  validateCsv(e.target.value);
                }}
                placeholder="brandName,type,name,urlOrListing,publisher,description&#10;HDFC Bank,social,HDFC Customer Care Support,https://twitter.com/hdfc_care,,Support desk&#10;PhonePe,app,PhonePe Gold Loan,https://play.google.com/store/apps/details?id=com.loan.phonepe,,Quick gold loans"
                className="w-full font-mono text-xs px-3 py-2 rounded-md bg-white dark:bg-[#0B1118] border border-[#E3DFD6] dark:border-[#243140] text-[#0F1B2D] dark:text-[#E8EDF2] focus:outline-none focus:ring-1 focus:ring-[#0E5A52]"
              />
            </div>

            {/* Bulk Validation Error List */}
            {bulkErrors.length > 0 && (
              <div className="p-3 rounded-lg bg-[#FDF2F2] dark:bg-[#B3261E]/20 border border-[#B3261E]/30 space-y-1">
                <p className="text-xs font-bold text-[#B3261E] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> CSV Validation Errors:
                </p>
                <ul className="text-[11px] text-[#B3261E] list-disc pl-5 space-y-0.5">
                  {bulkErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Run Bulk Button */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="primary"
                onClick={handleRunBulk}
                loading={isBulkEvaluating}
                disabled={csvText.trim().length === 0 || bulkErrors.length > 0}
                className="text-xs"
              >
                {isBulkEvaluating ? 'Evaluating Batch...' : 'Evaluate All Rows'}
              </Button>

              {bulkResults.some((r) => r.result?.detection && !r.saved) && (
                <Button
                  variant="outline"
                  onClick={handleBulkSaveAll}
                  className="text-xs border-[#0E5A52] text-[#0E5A52]"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add All Flagged to Detections
                </Button>
              )}
            </div>
          </Card>

          {/* Bulk Results Table */}
          {bulkResults.length > 0 && (
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
                  Bulk Evaluation Results ({bulkResults.length} evaluated)
                </h3>
                <span className="text-xs text-[#5B6675]">
                  Flagged: {bulkResults.filter((r) => r.result?.detection).length} | Excluded (Official): {bulkResults.filter((r) => r.result?.isExcluded).length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E3DFD6] dark:border-[#243140] text-[#5B6675]">
                      <th className="pb-2">Row</th>
                      <th className="pb-2">Brand</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Candidate Name</th>
                      <th className="pb-2">Result</th>
                      <th className="pb-2">Risk</th>
                      <th className="pb-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3DFD6]/60 dark:divide-[#243140]/60">
                    {bulkResults.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#F7F5F0]/50 dark:hover:bg-[#0B1118]/50">
                        <td className="py-2.5 font-mono text-[#5B6675]">#{item.row}</td>
                        <td className="py-2.5 font-medium text-[#0F1B2D] dark:text-[#E8EDF2]">{item.brandName}</td>
                        <td className="py-2.5 uppercase text-[10px] font-semibold text-[#5B6675]">{item.type}</td>
                        <td className="py-2.5 font-medium text-[#0F1B2D] dark:text-[#E8EDF2]">{item.name}</td>
                        <td className="py-2.5">
                          {item.error ? (
                            <span className="text-[#B3261E] font-medium">{item.error}</span>
                          ) : item.result?.isExcluded ? (
                            <span className="text-[#2E7D5B] font-semibold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Official Asset
                            </span>
                          ) : item.result?.detection ? (
                            <span className="font-semibold text-[#0F1B2D] dark:text-[#E8EDF2]">
                              Score {item.result.detection.riskScore}/100
                            </span>
                          ) : (
                            <span className="text-[#5B6675]">Safe</span>
                          )}
                        </td>
                        <td className="py-2.5">
                          {item.result?.detection ? (
                            <SeverityChip severity={item.result.detection.riskLevel} />
                          ) : (
                            <span className="text-[#5B6675]">-</span>
                          )}
                        </td>
                        <td className="py-2.5">
                          {item.result?.detection ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBulkSaveRow(idx)}
                              disabled={item.saved}
                              className="text-xs px-2 py-1"
                            >
                              {item.saved ? (
                                <span className="text-[#2E7D5B] font-medium flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Saved
                                </span>
                              ) : (
                                <span className="text-[#0E5A52] flex items-center gap-1">
                                  <Plus className="w-3 h-3" /> Add
                                </span>
                              )}
                            </Button>
                          ) : (
                            <span className="text-[#5B6675] text-[11px]">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
