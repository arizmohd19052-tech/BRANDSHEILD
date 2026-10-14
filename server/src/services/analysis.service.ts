/**
 * [services/analysis.service.ts]
 * Deterministic Threat Analysis Engine for BrandShield AI.
 * Provides explainable, rule-based intelligence
 * that operates instantly with 100% auditability and deterministic reproducibility.
 */

import { Detection, ThreatAnalysis } from '../db/schema.js';

export interface IEnrichmentService {
  analyzeThreat(detection: Detection): ThreatAnalysis;
}

export class DeterministicAnalysisService implements IEnrichmentService {
  public analyzeThreat(detection: Detection): ThreatAnalysis {
    const isThreat = detection.riskScore >= 40;
    const isCritical = detection.riskScore >= 85;

    // Generate Evidence Points
    const evidencePoints: Array<{ signal: string; score: number; detail: string }> = [];

    if (detection.breakdown.nameSimilarity > 0) {
      evidencePoints.push({
        signal: 'Name Similarity & Homoglyph Matching',
        score: Math.round(detection.breakdown.nameSimilarity * 0.35),
        detail: `Computed similarity score of ${detection.nameSimilarityScore}. Evaluated for character swaps, leetspeak, and token concatenation.`,
      });
    }

    if (detection.breakdown.publisherMismatch > 0) {
      evidencePoints.push({
        signal: 'Publisher / Developer Identity Verification',
        score: Math.round(detection.breakdown.publisherMismatch * 0.30),
        detail: `Claimed publisher "${detection.publisherOrDeveloper || 'Unknown'}" fails allowlist verification against official brand publisher records.`,
      });
    }

    if (detection.breakdown.scamSignals > 0) {
      evidencePoints.push({
        signal: 'Deceptive Intent & Scam Heuristics',
        score: Math.round(detection.breakdown.scamSignals * 0.20),
        detail: 'Candidate profile contains urgency keywords, fraudulent giveaway claims, or requests for customer credential/KYC submissions.',
      });
    }

    if (detection.breakdown.logoSimilarity > 0) {
      evidencePoints.push({
        signal: 'Perceptual Logo Geometry Match',
        score: Math.round(detection.breakdown.logoSimilarity * 0.15),
        detail: detection.logoSimilarityReason || `Perceptual dHash match indicates unauthorized reproduction of official brand mark.`,
      });
    }

    // Explanation
    let threatExplanation = '';
    if (detection.isExcluded) {
      threatExplanation = `Asset is verified as an official brand property and is excluded from threat alerting to prevent false positives.`;
    } else if (!isThreat) {
      threatExplanation = `Candidate asset exhibits low overall risk (${detection.riskScore}/100). Although sharing naming tokens with "${detection.brandName}", no deceptive signals, credential harvesting, or trademark confusion were detected. Classified as Legitimate / Benign.`;
    } else if (isCritical) {
      threatExplanation = `CRITICAL THREAT: Candidate asset presents an urgent risk of customer deception and fraud. Multiple independent indicators confirm unauthorized brand impersonation on ${detection.platform}, targeting customers of ${detection.brandName}.`;
    } else {
      threatExplanation = `ELEVATED RISK: Candidate exhibits deceptive branding and naming characteristics resembling ${detection.brandName}. While not actively harvesting credentials, it creates brand confusion and warrants takedown or continuous monitoring.`;
    }

    // Official Comparison
    const mismatches: string[] = [];
    if (detection.officialDomainMatch === 'No') {
      mismatches.push('Domain mismatch: Profile links to unofficial external landing page');
    }
    if (detection.publisherOrDeveloper) {
      mismatches.push(`Developer mismatch: "${detection.publisherOrDeveloper}" is not an authorized publisher`);
    }
    if (detection.handle && !detection.isExcluded) {
      mismatches.push(`Handle mismatch: "${detection.handle}" is not in verified official allowlist`);
    }

    const officialComparison = {
      officialAsset: `Official Verified ${detection.brandName} Property`,
      candidateAsset: detection.accountOrAppName,
      mismatches: mismatches.length > 0 ? mismatches : ['None (Official verified property)'],
    };

    return {
      threatExplanation,
      evidencePoints,
      recommendedAction: detection.recommendedAction,
      actionChecklist: detection.actionChecklist,
      officialComparison,
      provider: 'Deterministic Analysis Engine',
      generatedAt: detection.datasetGenerated,
    };
  }
}

export const analysisService = new DeterministicAnalysisService();
