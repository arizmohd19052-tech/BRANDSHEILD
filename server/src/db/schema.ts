/**
 * [db/schema.ts]
 * Core entity schemas and types for BrandShield AI.
 * Supports verified brand profiles, candidate telemetry, detections,
 * and deterministic threat analysis.
 */

import { z } from 'zod';

export type DataClass = 'VERIFIED_PUBLIC' | 'SYNTHETIC_TEST_DATA' | 'USER_SUBMITTED';
export type VerificationStatus = 'VERIFIED_OFFICIAL' | 'UNVERIFIED_NEEDS_MANUAL_CHECK';
export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Safe';

export const FeedbackSchema = z.object({
  id: z.string(),
  rating: z.number().int().min(1).max(5),
  category: z.enum(['UI', 'Detection accuracy', 'Performance', 'Other']),
  comment: z.string().max(500),
  email: z.string().email().optional().or(z.literal('')),
  createdAt: z.string(),
});
export type Feedback = z.infer<typeof FeedbackSchema>;

export const IngestCheckSchema = z.object({
  brandName: z.string().min(1, 'Brand is required'),
  type: z.enum(['social', 'appstore', 'domain']),
  platform: z.string().default('Web'),
  name: z.string().min(1, 'Account or app name is required').max(150),
  urlOrListing: z.string().max(300).optional().default(''),
  publisherOrDeveloper: z.string().max(150).optional().default(''),
  description: z.string().max(1000).optional().default(''),
  logoBase64: z.string().optional(),
});
export type IngestCheckInput = z.infer<typeof IngestCheckSchema>;

export const OfficialSocialSchema = z.object({
  id: z.string(),
  platform: z.enum(['x', 'instagram', 'facebook', 'linkedin', 'telegram', 'youtube', 'tiktok']),
  handle: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  verificationStatus: z.enum(['VERIFIED_OFFICIAL', 'UNVERIFIED_NEEDS_MANUAL_CHECK']).default('VERIFIED_OFFICIAL'),
});

export const OfficialAppSchema = z.object({
  id: z.string(),
  store: z.enum(['google_play', 'apple_app_store']),
  appName: z.string().min(1, 'App name is required'),
  packageId: z.string().min(1, 'Package ID is required'),
  publisherName: z.string().min(1, 'Publisher name is required'),
  storeUrl: z.string().url().optional().or(z.literal('')),
  verificationStatus: z.enum(['VERIFIED_OFFICIAL', 'UNVERIFIED_NEEDS_MANUAL_CHECK']).default('VERIFIED_OFFICIAL'),
});

export const BrandProfileSchema = z.object({
  id: z.string(),
  dataClass: z.enum(['VERIFIED_PUBLIC', 'SYNTHETIC_TEST_DATA']).default('VERIFIED_PUBLIC'),
  verificationStatus: z.enum(['VERIFIED_OFFICIAL', 'UNVERIFIED_NEEDS_MANUAL_CHECK']).default('VERIFIED_OFFICIAL'),
  brandName: z.string().min(2, 'Brand name must be at least 2 characters'),
  legalName: z.string().optional(),
  industry: z.string().default('Financial Services'),
  website: z.string().url(),
  officialDomain: z.string(),
  officialLogoUrl: z.string(),
  domains: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  officialSocials: z.array(OfficialSocialSchema).default([]),
  officialApps: z.array(OfficialAppSchema).default([]),
  datasetGenerated: z.string(),
});

export type OfficialSocial = z.infer<typeof OfficialSocialSchema>;
export type OfficialApp = z.infer<typeof OfficialAppSchema>;
export type BrandProfile = z.infer<typeof BrandProfileSchema>;

export type SeverityLevel = RiskLevel;

export interface Candidate {
  id: string;
  sourceId: string;
  sourceType: 'social' | 'appstore';
  platform: string;
  name: string;
  handle?: string;
  profileUrl?: string;
  avatarUrl: string;
  packageId?: string;
  developerName?: string;
  description: string;
  followers?: number;
  downloads?: string;
  category?: string;
  discoveredAt: string;
}

export interface ScoreBreakdown {
  nameSimilarity: number;       // 0 - 100
  logoSimilarity: number;       // 0 - 100
  publisherMismatch: number;    // 0 - 100
  scamSignals: number;          // 0 - 100
  handleAnomaly: number;        // 0 - 100
  unrelatedDeduction: number;   // 0 - 100
}

/**
 * Deterministic Threat Analysis Structure
 * Replace AI dependency with explainable, rule-based intelligence
 */
export interface ThreatAnalysis {
  threatExplanation: string;
  evidencePoints: Array<{ signal: string; score: number; detail: string }>;
  recommendedAction: string;
  actionChecklist: string[];
  officialComparison: {
    officialAsset: string;
    candidateAsset: string;
    mismatches: string[];
  };
  provider: string;
  generatedAt: string;
  scamIntent?: {
    classification: string;
    confidence: number;
  };
}

/**
 * Clean Detection Record matching all project requirements
 */
export interface Detection {
  recordId: string;
  id: string; // compatibility alias
  candidateId?: string; // compatibility alias
  dataClass: DataClass;
  brandName: string;
  platform: string;
  accountOrAppName: string;
  name?: string; // compatibility alias
  handle?: string | null;
  packageId?: string | null;
  urlOrListing: string;
  profileUrl?: string; // compatibility alias
  avatarUrl?: string;
  publisherOrDeveloper: string | null;
  developerName?: string | null; // compatibility alias
  description?: string; // compatibility alias
  nameSimilarityScore: number;  // 0.00 - 1.00
  logoSimilarityScore: number | null; // 0.00 - 1.00 or null
  logoSimilarityReason: string | null;
  officialDomainMatch: 'Yes' | 'No';
  riskScore: number;            // 0 - 100
  riskLevel: RiskLevel;
  severity?: RiskLevel;         // compatibility alias
  breakdown: ScoreBreakdown;
  reasons: string[];
  recommendedAction: string;
  actionChecklist: string[];
  analysis?: ThreatAnalysis;
  dataSource: string;
  datasetGenerated: string;
  isExcluded: boolean;
  exclusionReason: string | null;
  status: 'active' | 'confirmed' | 'false_positive';
}

export interface ExcludedAsset {
  id: string;
  recordId?: string;
  candidateId?: string;
  brandName?: string;
  name: string;
  handle?: string | null;
  platform: string;
  packageId?: string | null;
  developerName?: string | null;
  publisherOrDeveloper?: string | null;
  exclusionReason: string;
  datasetGenerated?: string;
  excludedAt?: string;
}

export interface SourceHealth {
  sourceId: string;
  name: string;
  type: 'social' | 'appstore';
  status: 'ok' | 'rate-limited' | 'unavailable' | 'disabled';
  lastChecked: string;
  candidatesCount: number;
  latencyMs: number;
  error?: string;
}
