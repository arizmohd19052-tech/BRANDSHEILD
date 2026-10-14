/**
 * [client/src/types/index.ts]
 * Frontend TypeScript type declarations for BrandShield AI.
 */

export type DataClass = 'VERIFIED_PUBLIC' | 'SYNTHETIC_TEST_DATA' | 'USER_SUBMITTED';
export type VerificationStatus = 'VERIFIED_OFFICIAL' | 'UNVERIFIED_NEEDS_MANUAL_CHECK';
export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Safe';
export type SeverityLevel = RiskLevel;

export interface Feedback {
  id: string;
  rating: number;
  category: 'detection_accuracy' | 'performance' | 'ui_experience' | 'feature_request' | 'general';
  comment: string;
  email?: string | null;
  createdAt: string;
}

export interface IngestCheckInput {
  brandName: string;
  type: 'social' | 'app' | 'domain';
  name: string;
  urlOrListing?: string;
  publisher?: string;
  description?: string;
  logoDataUrl?: string;
}

export interface IngestCheckResponse {
  isExcluded: boolean;
  exclusionReason?: string;
  candidate: any;
  detection: Detection | null;
  analysis: ThreatAnalysis | null;
  whyNotFlagged?: string;
  timestamp: string;
}

export interface DatasetCounts {
  totalDetections: number;
  totalExcluded: number;
  byDataClass: {
    VERIFIED_PUBLIC: number;
    SYNTHETIC_TEST_DATA: number;
    USER_SUBMITTED: number;
  };
  totalFeedbacks: number;
}

export interface OfficialSocial {
  id: string;
  platform: 'x' | 'instagram' | 'facebook' | 'linkedin' | 'telegram' | 'youtube' | 'tiktok';
  handle: string | null;
  url?: string | null;
  verificationStatus?: VerificationStatus;
}

export interface OfficialApp {
  id: string;
  store: 'google_play' | 'apple_app_store';
  appName: string;
  packageId: string;
  publisherName: string;
  storeUrl?: string;
  verificationStatus?: VerificationStatus;
}

export interface BrandProfile {
  id: string;
  dataClass?: DataClass;
  verificationStatus?: VerificationStatus;
  brandName: string;
  legalName?: string;
  industry: string;
  website?: string;
  officialDomain?: string;
  officialLogoUrl: string;
  domains: string[];
  keywords: string[];
  officialSocials: OfficialSocial[];
  officialApps: OfficialApp[];
  datasetGenerated?: string;
  updatedAt?: string;
}

export interface CompletenessReport {
  score: number;
  breakdown: {
    brandName: boolean;
    logoUrl: boolean;
    socialCount: number;
    appCount: number;
    domainCount: number;
    keywordCount: number;
  };
  suggestions: string[];
}

export interface ScoreBreakdown {
  nameSimilarity: number;
  logoSimilarity: number;
  publisherMismatch: number;
  scamSignals: number;
  handleAnomaly: number;
  unrelatedDeduction: number;
}

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

export interface Detection {
  recordId: string;
  id: string; // compatibility alias
  candidateId?: string;
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
  developerName?: string | null;
  description?: string;
  nameSimilarityScore: number;
  logoSimilarityScore: number | null;
  logoSimilarityReason: string | null;
  officialDomainMatch: 'Yes' | 'No';
  riskScore: number;
  riskLevel: RiskLevel;
  severity?: RiskLevel;
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
  publisherOrDeveloper?: string | null;
  developerName?: string | null;
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

export interface ScanSummary {
  total: number;
  threatsCount?: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  safe: number;
  socialCount: number;
  appCount: number;
  excludedCount: number;
  datasetGenerated?: string;
}

export interface LookalikeTestResult {
  originalInput: string;
  normalizedInput: string;
  homoglyphFolded: string;
  condensedInput: string;
  brandNormalized: string;
  score: number;
  isLookalike: boolean;
  detectedVariations: string[];
  reasons: string[];
  tokenMatches: string[];
  overflaggingGuardTriggered: boolean;
}
