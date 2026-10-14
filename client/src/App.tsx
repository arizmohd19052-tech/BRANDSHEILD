/**
 * [client/src/App.tsx]
 * Root Application Container for BrandShield AI — AI-Powered Digital Brand Protection.
 * Defaults to refined Light theme (#FFFFFF surfaces, #F7F5F0 warm page background, #0F1B2D ink, #0E5A52 teal).
 * Refined Sarvam design palette, rule-based detection with optional Gemini AI explanations.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { Navbar } from './components/Navbar.js';
import { SectionedHomePage } from './components/SectionedHomePage.js';
import { IngestCheckView } from './components/IngestCheckView.js';
import { BrandProfileForm } from './components/BrandProfileForm.js';
import { DetectionsView } from './components/DetectionsView.js';
import { LookalikeLab } from './components/LookalikeLab.js';
import { ExcludedAssetsView } from './components/ExcludedAssetsView.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { Button } from './components/ui/Button.js';
import { api } from './lib/api.js';
import {
  BrandProfile,
  CompletenessReport,
  Detection,
  ExcludedAsset,
  ScanSummary,
  SourceHealth,
} from './types/index.js';

export const App: React.FC = () => {
  // Requirement: Default to Light theme
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [completeness, setCompleteness] = useState<CompletenessReport | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [excluded, setExcluded] = useState<ExcludedAsset[]>([]);
  const [sources, setSources] = useState<SourceHealth[]>([]);
  const [summary, setSummary] = useState<ScanSummary>({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    safe: 0,
    socialCount: 0,
    appCount: 0,
    excludedCount: 0,
  });

  // Manage Dark Mode HTML Class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load brands list and initial detections
  const loadInitialData = useCallback(async (brandTarget?: string) => {
    try {
      const [brandsList, profileRes, detectionsRes] = await Promise.all([
        api.getBrands(),
        api.getProfile(),
        api.getDetections(brandTarget),
      ]);

      setBrands(brandsList);
      setProfile(profileRes.profile);
      setCompleteness(profileRes.completeness);
      setDetections(detectionsRes.detections);
      setExcluded(detectionsRes.excluded);
      setSources(detectionsRes.sources);
      setSummary(detectionsRes.summary);
      setIsOffline(false);
    } catch (err: any) {
      console.error('[client/src/App.tsx] Error loading data:', err.message);
      setIsOffline(true);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Periodic health polling: recover automatically when server comes back online
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        await api.getHealth();
        if (isOffline) {
          setIsOffline(false);
          loadInitialData();
        }
      } catch {
        setIsOffline(true);
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [isOffline, loadInitialData]);

  // Handle switching active brand scope
  const handleSelectBrand = useCallback(async (brandName: string) => {
    setSelectedBrand(brandName);
    try {
      const res = await api.getDetections(brandName);
      setDetections(res.detections);
      setExcluded(res.excluded);
      setSummary(res.summary);

      if (brandName !== 'All') {
        const found = brands.find((b) => b.brandName.toLowerCase() === brandName.toLowerCase());
        if (found) {
          const profileRes = await api.getProfile(found.id);
          setProfile(profileRes.profile);
          setCompleteness(profileRes.completeness);
        }
      }
    } catch (err: any) {
      console.error('[client/src/App.tsx] Error switching brand scope:', err.message);
    }
  }, [brands]);

  // Run Demo Analysis across verified & synthetic datasets
  const handleRunScan = useCallback(async () => {
    setIsScanning(true);
    try {
      await api.runScan();
      const detRes = await api.getDetections(selectedBrand);
      setDetections(detRes.detections);
      setExcluded(detRes.excluded);
      setSources(detRes.sources);
      setSummary(detRes.summary);
    } catch (err: any) {
      console.error('[client/src/App.tsx] Scan error:', err.message);
    } finally {
      setIsScanning(false);
    }
  }, [selectedBrand]);

  // Save Brand Profile
  const handleSaveProfile = useCallback(async (updated: BrandProfile) => {
    setIsSavingProfile(true);
    try {
      const res = await api.updateProfile(updated);
      setProfile(res.profile);
      setCompleteness(res.completeness);
      await handleRunScan();
    } catch (err: any) {
      console.error('[client/src/App.tsx] Save profile error:', err.message);
    } finally {
      setIsSavingProfile(false);
    }
  }, [handleRunScan]);

  // Update Threat Status
  const handleUpdateStatus = useCallback(async (
    id: string,
    status: 'active' | 'confirmed' | 'false_positive'
  ) => {
    try {
      const updated = await api.updateDetectionStatus(id, status);
      setDetections((prev) => prev.map((d) => ((d.recordId === id || d.id === id) ? updated : d)));
    } catch (err: any) {
      console.error('[client/src/App.tsx] Update status error:', err.message);
    }
  }, []);

  // When a candidate is saved via IngestCheckView
  const handleDetectionAdded = useCallback((newDetection: Detection) => {
    setDetections((prev) => [newDetection, ...prev]);
    setSummary((prev) => ({
      ...prev,
      total: prev.total + 1,
      critical: newDetection.riskLevel === 'Critical' ? prev.critical + 1 : prev.critical,
      high: newDetection.riskLevel === 'High' ? prev.high + 1 : prev.high,
      medium: newDetection.riskLevel === 'Medium' ? prev.medium + 1 : prev.medium,
      low: newDetection.riskLevel === 'Low' ? prev.low + 1 : prev.low,
      safe: newDetection.riskLevel === 'Safe' ? prev.safe + 1 : prev.safe,
      socialCount: ['x', 'instagram', 'facebook', 'telegram', 'social'].includes(newDetection.platform.toLowerCase())
        ? prev.socialCount + 1
        : prev.socialCount,
      appCount: ['google_play', 'apple_app_store', 'app'].includes(newDetection.platform.toLowerCase())
        ? prev.appCount + 1
        : prev.appCount,
    }));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] dark:bg-[#0B1118] text-[#0F1B2D] dark:text-[#E8EDF2] transition-colors">
      {/* Sticky Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        brands={brands}
        selectedBrand={selectedBrand}
        onSelectBrand={handleSelectBrand}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onRunScan={handleRunScan}
        isScanning={isScanning}
        threatCount={detections.length}
      />

      {/* Backend Offline Banner */}
      {isOffline && (
        <div className="bg-[#FEF2F2] dark:bg-[#451A1A] border-b border-[#F87171] px-4 py-2.5 text-xs text-[#991B1B] dark:text-[#FCA5A5] flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 max-w-4xl">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#DC2626]" />
            <span>
              <strong>Backend Offline:</strong> Cannot reach API server at <code>127.0.0.1:4000</code>. Ensure the server is running (<code>npm run dev</code> or <code>cd server &amp;&amp; npm run dev</code>).
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadInitialData()}
            className="text-xs py-1 px-3 border-[#DC2626]/40 text-[#DC2626] hover:bg-[#DC2626]/10 shrink-0"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry Connection
          </Button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Long Multi-Scroll Home Page */}
        {activeTab === 'dashboard' && (
          <ErrorBoundary fallbackTitle="Overview Dashboard Encountered an Error" onReset={loadInitialData}>
            <SectionedHomePage
              summary={summary}
              sources={sources}
              onRunScan={handleRunScan}
              isScanning={isScanning}
              onNavigate={setActiveTab}
              onNavigateToTab={setActiveTab}
              brandName={selectedBrand === 'All' ? 'All Monitored Brands' : selectedBrand}
              detections={detections}
              brands={brands}
            />
          </ErrorBoundary>
        )}

        {/* Data Ingestion & Live Check Workbench */}
        {activeTab === 'ingest' && (
          <ErrorBoundary fallbackTitle="Ingest & Check Workbench Encountered an Error" onReset={loadInitialData}>
            <IngestCheckView
              brands={brands}
              activeBrandName={selectedBrand === 'All' ? (brands[0]?.brandName ?? 'HDFC Bank') : selectedBrand}
              onDetectionAdded={handleDetectionAdded}
              onNavigate={setActiveTab}
            />
          </ErrorBoundary>
        )}

        {/* Brand Profile Manager */}
        {activeTab === 'profile' && (
          <ErrorBoundary fallbackTitle="Brand Profile Manager Encountered an Error" onReset={loadInitialData}>
            {profile && completeness ? (
              <BrandProfileForm
                initialProfile={profile}
                initialCompleteness={completeness}
                onSave={handleSaveProfile}
                isSaving={isSavingProfile}
              />
            ) : (
              <div className="max-w-4xl mx-auto p-12 text-center text-[#5B6675] dark:text-[#8B97A7]">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#0E5A52]" />
                <p className="font-semibold text-sm">Loading brand profile...</p>
                {isOffline && (
                  <p className="text-xs text-[#DC2626] mt-2">
                    Backend server is unreachable. Please start the server on port 4000 or click "Retry Connection".
                  </p>
                )}
              </div>
            )}
          </ErrorBoundary>
        )}

        {/* Detections Threat Intelligence View */}
        {activeTab === 'detections' && (
          <ErrorBoundary fallbackTitle="Threat Detections View Encountered an Error" onReset={loadInitialData}>
            {profile ? (
              <DetectionsView
                detections={detections}
                profile={profile}
                brands={brands}
                onUpdateStatus={handleUpdateStatus}
              />
            ) : (
              <div className="max-w-7xl mx-auto p-12 text-center text-[#5B6675] dark:text-[#8B97A7]">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#0E5A52]" />
                <p className="font-semibold text-sm">Loading threat intelligence detections...</p>
                {isOffline && (
                  <p className="text-xs text-[#DC2626] mt-2">
                    Backend server is unreachable. Please start the server on port 4000 or click "Retry Connection".
                  </p>
                )}
              </div>
            )}
          </ErrorBoundary>
        )}

        {/* Look-alike Permutation Lab */}
        {activeTab === 'lab' && (
          <ErrorBoundary fallbackTitle="Look-alike Lab Encountered an Error" onReset={loadInitialData}>
            {profile ? (
              <LookalikeLab brandName={selectedBrand === 'All' ? profile.brandName : selectedBrand} />
            ) : (
              <div className="max-w-4xl mx-auto p-12 text-center text-[#5B6675] dark:text-[#8B97A7]">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#0E5A52]" />
                <p className="font-semibold text-sm">Loading look-alike workbench...</p>
                {isOffline && (
                  <p className="text-xs text-[#DC2626] mt-2">
                    Backend server is unreachable. Please start the server on port 4000 or click "Retry Connection".
                  </p>
                )}
              </div>
            )}
          </ErrorBoundary>
        )}

        {/* Excluded Allowlist Asset Auditor */}
        {activeTab === 'excluded' && (
          <ErrorBoundary fallbackTitle="Asset Auditor Encountered an Error" onReset={loadInitialData}>
            {profile ? (
              <ExcludedAssetsView excluded={excluded} profile={profile} />
            ) : (
              <div className="max-w-7xl mx-auto p-12 text-center text-[#5B6675] dark:text-[#8B97A7]">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#0E5A52]" />
                <p className="font-semibold text-sm">Loading protected official assets...</p>
                {isOffline && (
                  <p className="text-xs text-[#DC2626] mt-2">
                    Backend server is unreachable. Please start the server on port 4000 or click "Retry Connection".
                  </p>
                )}
              </div>
            )}
          </ErrorBoundary>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E3DFD6] dark:border-[#243140] bg-[#FFFFFF] dark:bg-[#121B25] py-8 px-4 sm:px-6 text-center text-xs text-[#5B6675] dark:text-[#8B97A7]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">BrandShield AI</span>
            <span>&bull;</span>
            <span>AI-Powered Digital Brand Protection Platform</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="#hero" className="hover:underline">Home</a>
            <span>&bull;</span>
            <a href="#dashboard-live" className="hover:underline">Live Posture</a>
            <span>&bull;</span>
            <a href="#how-it-works" className="hover:underline">How It Works</a>
            <span>&bull;</span>
            <a href="#capabilities" className="hover:underline">Capabilities</a>
            <span>&bull;</span>
            <a href="#faq" className="hover:underline">FAQ</a>
            <span>&bull;</span>
            <a href="#feedback-section" className="hover:underline">Feedback</a>
          </div>
          <div className="flex items-center gap-3">
            <span>Mode: Demo Dataset</span>
            <span>&bull;</span>
            <span>Deterministic Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
