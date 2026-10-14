/**
 * [db/index.ts]
 * In-memory storage engine and dataset manager for BrandShield AI.
 * Loads verified public brands and synthetic test data at server startup,
 * persists user-submitted records and feedbacks in JSON files,
 * and supports zero-latency dataset resetting.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BrandProfile, Detection, ExcludedAsset, SourceHealth, ScoreBreakdown, Feedback, ThreatAnalysis } from './schema.js';
import { analysisService } from '../services/analysis.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class StorageEngine {
  private brands: BrandProfile[] = [];
  private activeBrandId: string = 'brand_hdfc';
  private detections: Map<string, Detection> = new Map();
  private excludedAssets: Map<string, ExcludedAsset> = new Map();
  private sourceHealth: Map<string, SourceHealth> = new Map();
  private feedbacks: Feedback[] = [];
  private dataDir: string;
  private userSubmittedPath: string;
  private feedbackPath: string;

  constructor() {
    this.dataDir = path.resolve(__dirname, '../../data');
    this.userSubmittedPath = path.join(this.dataDir, 'user-submitted-data.json');
    this.feedbackPath = path.join(this.dataDir, 'feedbacks.json');

    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    this.initDefaultSources();
    this.loadDatasets();
    this.loadFeedbacks();
  }

  private initDefaultSources() {
    const sources: SourceHealth[] = [
      {
        sourceId: 'x-social',
        name: 'X (Twitter) Monitor',
        type: 'social',
        status: 'ok',
        lastChecked: '2026-10-13T00:00:00Z',
        candidatesCount: 6,
        latencyMs: 120,
      },
      {
        sourceId: 'instagram-social',
        name: 'Instagram Graph Monitor',
        type: 'social',
        status: 'ok',
        lastChecked: '2026-10-13T00:00:00Z',
        candidatesCount: 4,
        latencyMs: 145,
      },
      {
        sourceId: 'linkedin-social',
        name: 'LinkedIn Company Index',
        type: 'social',
        status: 'ok',
        lastChecked: '2026-10-13T00:00:00Z',
        candidatesCount: 3,
        latencyMs: 95,
      },
      {
        sourceId: 'telegram-social',
        name: 'Telegram Public Channels',
        type: 'social',
        status: 'rate-limited',
        lastChecked: '2026-10-13T00:00:00Z',
        candidatesCount: 2,
        latencyMs: 820,
        error: 'HTTP 429 Too Many Requests: Rate limit exceeded. Serving cached candidates.',
      },
      {
        sourceId: 'google-play-store',
        name: 'Google Play Store Monitor',
        type: 'appstore',
        status: 'ok',
        lastChecked: '2026-10-13T00:00:00Z',
        candidatesCount: 5,
        latencyMs: 210,
      },
      {
        sourceId: 'apple-app-store',
        name: 'Apple App Store Monitor',
        type: 'appstore',
        status: 'ok',
        lastChecked: '2026-10-13T00:00:00Z',
        candidatesCount: 3,
        latencyMs: 180,
      },
    ];

    for (const s of sources) {
      this.sourceHealth.set(s.sourceId, s);
    }
  }

  public loadDatasets() {
    try {
      const verifiedBrandsPath = path.join(this.dataDir, 'verified-brands.json');
      const syntheticDataPath = path.join(this.dataDir, 'synthetic-test-data.json');

      if (fs.existsSync(verifiedBrandsPath)) {
        const raw = fs.readFileSync(verifiedBrandsPath, 'utf-8');
        this.brands = JSON.parse(raw);
      } else {
        console.warn(`[db/index.ts] Warning: verified-brands.json not found at ${verifiedBrandsPath}`);
      }

      this.detections.clear();
      this.excludedAssets.clear();

      // 1. Index Official Assets from Verified Brand Profiles as VERIFIED_PUBLIC
      for (const brand of this.brands) {
        for (const social of brand.officialSocials || []) {
          if (!social.handle) continue;
          const recId = `official-${social.id}`;
          this.indexRecord(
            {
              recordId: recId,
              candidateId: social.id,
              brandName: brand.brandName,
              platform: social.platform,
              accountOrAppName: `@${social.handle} (${brand.brandName} Official)`,
              handle: social.handle,
              urlOrListing: social.url || '',
              isExcluded: true,
              exclusionReason: `[EXCLUDED_OFFICIAL_HANDLE] Verified official ${social.platform.toUpperCase()} profile`,
              riskScore: 0,
              riskLevel: 'Safe',
              status: 'confirmed',
              dataClass: 'VERIFIED_PUBLIC',
            },
            'VERIFIED_PUBLIC'
          );
        }

        for (const app of brand.officialApps || []) {
          const recId = `official-${app.id}`;
          this.indexRecord(
            {
              recordId: recId,
              candidateId: app.id,
              brandName: brand.brandName,
              platform: app.store,
              accountOrAppName: app.appName,
              packageId: app.packageId,
              publisherOrDeveloper: app.publisherName,
              urlOrListing: app.storeUrl || '',
              isExcluded: true,
              exclusionReason: `[EXCLUDED_OFFICIAL_APP] Registered official app (${app.packageId})`,
              riskScore: 0,
              riskLevel: 'Safe',
              status: 'confirmed',
              dataClass: 'VERIFIED_PUBLIC',
            },
            'VERIFIED_PUBLIC'
          );
        }
      }

      // 2. Load Synthetic + Verified Benchmark Data
      if (fs.existsSync(syntheticDataPath)) {
        const rawSynthetic = fs.readFileSync(syntheticDataPath, 'utf-8');
        const syntheticRecords: any[] = JSON.parse(rawSynthetic);

        for (const item of syntheticRecords) {
          this.indexRecord(item, item.dataClass || 'SYNTHETIC_TEST_DATA');
        }
      }

      // 3. Load User-Submitted Data (Persisted)
      if (fs.existsSync(this.userSubmittedPath)) {
        try {
          const rawUser = fs.readFileSync(this.userSubmittedPath, 'utf-8');
          const userRecords: any[] = JSON.parse(rawUser);
          for (const item of userRecords) {
            this.indexRecord(item, 'USER_SUBMITTED');
          }
        } catch (e: any) {
          console.warn(`[db/index.ts] Failed to parse user-submitted records: ${e.message}`);
        }
      }
    } catch (error: any) {
      console.error(`[db/index.ts] Error loading datasets: ${error.message}`);
    }
  }

  private indexRecord(item: any, dataClass: 'VERIFIED_PUBLIC' | 'SYNTHETIC_TEST_DATA' | 'USER_SUBMITTED') {
    const breakdown: ScoreBreakdown = item.breakdown || {
      nameSimilarity: Math.round((item.nameSimilarityScore || 0) * 100),
      logoSimilarity: item.logoSimilarityScore ? Math.round(item.logoSimilarityScore * 100) : 0,
      publisherMismatch: item.reasons?.some((r: string) => r.includes('PUBLISHER_MISMATCH')) ? 90 : 0,
      scamSignals: item.reasons?.some((r: string) => r.includes('SCAM') || r.includes('HIGH_RISK') || r.includes('PHISHING')) ? 85 : 0,
      handleAnomaly: item.handle?.includes('care') || item.handle?.includes('bot') ? 75 : 0,
      unrelatedDeduction: item.reasons?.some((r: string) => r.includes('FALSE_POSITIVE') || r.includes('LEGITIMATE')) ? 60 : 0,
    };

    const detection: Detection = {
      recordId: item.recordId || item.id,
      id: item.recordId || item.id,
      candidateId: item.candidateId,
      dataClass,
      brandName: item.brandName,
      platform: item.platform,
      accountOrAppName: item.accountOrAppName || item.name,
      name: item.accountOrAppName || item.name,
      handle: item.handle || null,
      packageId: item.packageId || null,
      urlOrListing: item.urlOrListing || item.profileUrl || '',
      profileUrl: item.urlOrListing || item.profileUrl || '',
      avatarUrl: item.avatarUrl || 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=128&auto=format&fit=crop&q=80',
      publisherOrDeveloper: item.publisherOrDeveloper || item.developerName || null,
      developerName: item.publisherOrDeveloper || item.developerName || null,
      description: item.description,
      nameSimilarityScore: item.nameSimilarityScore ?? Number((breakdown.nameSimilarity / 100).toFixed(2)),
      logoSimilarityScore: item.logoSimilarityScore ?? null,
      logoSimilarityReason: item.logoSimilarityReason ?? null,
      officialDomainMatch: item.officialDomainMatch || 'No',
      riskScore: item.riskScore,
      riskLevel: item.riskLevel || item.severity || 'Low',
      severity: item.riskLevel || item.severity || 'Low',
      breakdown,
      reasons: item.reasons || [],
      recommendedAction: item.recommendedAction || 'Monitor candidate asset.',
      actionChecklist: item.actionChecklist || ['Review asset activity'],
      dataSource: item.dataSource || 'user_submission',
      datasetGenerated: item.datasetGenerated || '2026-10-13T00:00:00Z',
      isExcluded: Boolean(item.isExcluded),
      exclusionReason: item.exclusionReason || null,
      status: item.isExcluded ? 'confirmed' : (item.status || 'active'),
    };

    if (!detection.analysis) {
      detection.analysis = analysisService.analyzeThreat(detection);
    }

    if (item.isExcluded) {
      this.excludedAssets.set(detection.recordId, {
        id: detection.recordId,
        recordId: detection.recordId,
        brandName: detection.brandName,
        name: detection.accountOrAppName,
        handle: detection.handle,
        platform: detection.platform,
        packageId: detection.packageId,
        publisherOrDeveloper: detection.publisherOrDeveloper,
        exclusionReason: item.exclusionReason || '[EXCLUDED] Verified official brand asset allowlist match',
        datasetGenerated: detection.datasetGenerated,
      });
    }

    this.detections.set(detection.recordId, detection);
  }

  public addUserDetection(detection: Detection) {
    this.detections.set(detection.recordId, detection);
    this.saveUserSubmitted();
  }

  private saveUserSubmitted() {
    try {
      const userRecords = Array.from(this.detections.values()).filter(
        (d) => d.dataClass === 'USER_SUBMITTED'
      );
      fs.writeFileSync(this.userSubmittedPath, JSON.stringify(userRecords, null, 2), 'utf-8');
    } catch (e: any) {
      console.error(`[db/index.ts] Error saving user-submitted records: ${e.message}`);
    }
  }

  public resetToOriginalDataset() {
    try {
      // Remove all USER_SUBMITTED records from memory
      for (const [key, val] of Array.from(this.detections.entries())) {
        if (val.dataClass === 'USER_SUBMITTED') {
          this.detections.delete(key);
        }
      }
      for (const [key, val] of Array.from(this.excludedAssets.entries())) {
        if (this.detections.get(key)?.dataClass === 'USER_SUBMITTED') {
          this.excludedAssets.delete(key);
        }
      }

      // Remove the user submitted file on disk
      if (fs.existsSync(this.userSubmittedPath)) {
        fs.unlinkSync(this.userSubmittedPath);
      }

      // Reload fresh baseline datasets
      this.loadDatasets();
    } catch (e: any) {
      console.error(`[db/index.ts] Error resetting dataset: ${e.message}`);
    }
  }

  public getDatasetCounts() {
    const list = Array.from(this.detections.values());
    const verifiedPublic = list.filter((d) => d.dataClass === 'VERIFIED_PUBLIC').length;
    const syntheticTestData = list.filter((d) => d.dataClass === 'SYNTHETIC_TEST_DATA').length;
    const userSubmitted = list.filter((d) => d.dataClass === 'USER_SUBMITTED').length;

    return {
      totalDetections: list.length,
      totalExcluded: this.excludedAssets.size,
      byDataClass: {
        VERIFIED_PUBLIC: verifiedPublic,
        SYNTHETIC_TEST_DATA: syntheticTestData,
        USER_SUBMITTED: userSubmitted,
      },
      totalFeedbacks: this.feedbacks.length,
    };
  }

  // Feedbacks
  private loadFeedbacks() {
    if (fs.existsSync(this.feedbackPath)) {
      try {
        const raw = fs.readFileSync(this.feedbackPath, 'utf-8');
        this.feedbacks = JSON.parse(raw);
      } catch (e: any) {
        console.warn(`[db/index.ts] Failed to parse feedback file: ${e.message}`);
        this.feedbacks = [];
      }
    }
  }

  public addFeedback(feedback: Partial<Feedback> & { rating: number; category: any; comment: string }): Feedback {
    const full: Feedback = {
      id: feedback.id || `feedback-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      rating: feedback.rating,
      category: feedback.category,
      comment: feedback.comment,
      email: feedback.email || undefined,
      createdAt: feedback.createdAt || new Date().toISOString(),
    };
    this.feedbacks.unshift(full);
    try {
      fs.writeFileSync(this.feedbackPath, JSON.stringify(this.feedbacks, null, 2), 'utf-8');
    } catch (e: any) {
      console.error(`[db/index.ts] Error saving feedback: ${e.message}`);
    }
    return full;
  }

  public getFeedbacks(): Feedback[] {
    return this.feedbacks;
  }

  // Profile alias
  public getProfile(brandId?: string): BrandProfile {
    return this.getBrandProfile(brandId);
  }

  // Brands & Profiles
  public getBrands(): BrandProfile[] {
    return this.brands;
  }

  public getBrandProfile(brandId?: string): BrandProfile {
    const targetId = brandId || this.activeBrandId;
    const found = this.brands.find((b) => b.id === targetId || b.brandName.toLowerCase() === targetId.toLowerCase());
    return found || this.brands[0] || ({} as BrandProfile);
  }

  public setActiveBrand(brandId: string): BrandProfile {
    const found = this.brands.find((b) => b.id === brandId);
    if (found) {
      this.activeBrandId = found.id;
    }
    return this.getBrandProfile();
  }

  public setBrandProfile(profile: BrandProfile): BrandProfile {
    const idx = this.brands.findIndex((b) => b.id === profile.id);
    if (idx >= 0) {
      this.brands[idx] = profile;
    } else {
      this.brands.push(profile);
    }
    return profile;
  }

  public getDetections(brandName?: string): Detection[] {
    const list = Array.from(this.detections.values());
    if (brandName && brandName.toLowerCase() !== 'all') {
      return list.filter((d) => d.brandName.toLowerCase() === brandName.toLowerCase());
    }
    return list.sort((a, b) => b.riskScore - a.riskScore);
  }

  public getExcludedAssets(brandName?: string): ExcludedAsset[] {
    const list = Array.from(this.excludedAssets.values());
    if (brandName && brandName.toLowerCase() !== 'all') {
      return list.filter((e) => (e.brandName || '').toLowerCase() === brandName.toLowerCase());
    }
    return list;
  }

  public getSourceHealth(): SourceHealth[] {
    return Array.from(this.sourceHealth.values());
  }

  public updateSourceHealth(sourceId: string, update: Partial<SourceHealth>): void {
    const existing = this.sourceHealth.get(sourceId);
    if (existing) {
      this.sourceHealth.set(sourceId, { ...existing, ...update, lastChecked: new Date().toISOString() });
    }
  }

  public updateDetectionStatus(id: string, status: 'active' | 'confirmed' | 'false_positive'): Detection | null {
    const existing = this.detections.get(id);
    if (!existing) return null;
    existing.status = status;
    this.detections.set(id, existing);
    if (existing.dataClass === 'USER_SUBMITTED') {
      this.saveUserSubmitted();
    }
    return existing;
  }

  public updateDetectionEnrichment(id: string, enrichment: ThreatAnalysis): Detection | null {
    const existing = this.detections.get(id);
    if (!existing) return null;
    existing.analysis = enrichment;
    this.detections.set(id, existing);
    if (existing.dataClass === 'USER_SUBMITTED') {
      this.saveUserSubmitted();
    }
    return existing;
  }
}

export const db = new StorageEngine();
