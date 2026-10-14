/**
 * [detection/engine.ts]
 * Core Detection Orchestration Engine.
 * Synthesizes official asset exclusions, look-alike name variations,
 * perceptual logo similarity, publisher discrepancies, and scam signals
 * into a transparent 0-100 weighted risk score.
 */

import { BrandProfile, Candidate, Detection, SeverityLevel } from '../db/schema.js';
import { getDetectionConfig } from '../config/detection.config.js';
import { checkOfficialExclusion } from './exclusion.js';
import { analyzeLookalikeName } from './lookalike.js';
import { compareLogoSimilarity } from './logoMatcher.js';
import { detectScamSignals } from './scamSignals.js';

export interface EvaluationResult {
  isExcluded: boolean;
  exclusionReason?: string;
  detection?: Detection;
}

export function evaluateCandidate(candidate: Candidate, profile: BrandProfile): EvaluationResult {
  try {
    // -------------------------------------------------------------
    // STAGE 1: OFFICIAL ASSET EXCLUSION FIRST (Mandatory Allowlist)
    // -------------------------------------------------------------
    const exclusion = checkOfficialExclusion(candidate, profile);
    if (exclusion.isExcluded) {
      return {
        isExcluded: true,
        exclusionReason: exclusion.reason,
      };
    }

    const config = getDetectionConfig();
    const allReasons: string[] = [];

    // -------------------------------------------------------------
    // STAGE 2: LOOK-ALIKE & NAME SIMILARITY
    // -------------------------------------------------------------
    const lookalike = analyzeLookalikeName(
      candidate.name,
      profile.brandName,
      profile.keywords,
      candidate.description
    );
    allReasons.push(...lookalike.reasons);

    // -------------------------------------------------------------
    // STAGE 3: LOGO & VISUAL RESEMBLANCE
    // -------------------------------------------------------------
    const logoResult = compareLogoSimilarity(
      candidate.avatarUrl,
      profile.officialLogoUrl,
      candidate.name,
      profile.brandName
    );
    allReasons.push(...logoResult.reasons);

    // -------------------------------------------------------------
    // STAGE 4: PUBLISHER / DEVELOPER MISMATCH (APP STORES)
    // -------------------------------------------------------------
    const isApp =
      candidate.sourceType === 'appstore' ||
      ['google_play', 'apple_app_store', 'app'].includes((candidate.platform || '').toLowerCase()) ||
      Boolean(candidate.packageId);

    let publisherMismatchScore = 0;
    if (isApp) {
      const officialPublishers = profile.officialApps.map((a) => a.publisherName.toLowerCase());
      const candidateDev = (candidate.developerName || (candidate as any).publisherOrDeveloper || '').toLowerCase();

      if (candidateDev && !officialPublishers.includes(candidateDev)) {
        publisherMismatchScore = 95;
        allReasons.push(
          `[PUBLISHER_MISMATCH] App claimed by unauthorized developer "${candidateDev}" (official: "${profile.officialApps[0]?.publisherName || 'Authorized Entity'}")`
        );
      } else if (candidateDev) {
        allReasons.push('[VERIFIED_PUBLISHER] Developer identity matches official records');
      }
    }

    // -------------------------------------------------------------
    // STAGE 5: SCAM SIGNALS & PHISHING REASONING
    // -------------------------------------------------------------
    const scam = detectScamSignals(candidate.description, candidate.handle);
    allReasons.push(...scam.reasons);

    // -------------------------------------------------------------
    // STAGE 6: HANDLE ANOMALY CHECK (SOCIAL)
    // -------------------------------------------------------------
    let handleAnomalyScore = 0;
    if (candidate.sourceType === 'social' && candidate.handle) {
      const normHandle = candidate.handle.toLowerCase();
      const hasSuspiciousAffix = config.keywords.suspiciousHandles.some((affix) =>
        normHandle.includes(affix)
      );

      if (hasSuspiciousAffix) {
        handleAnomalyScore = 80;
        allReasons.push(`[SUSPICIOUS_HANDLE_PATTERN] Handle contains deceptive affiliate or support keywords`);
      }
    }

    // -------------------------------------------------------------
    // STAGE 7: WEIGHTED SCORE SYNTHESIS (NORMALIZED BY ACTIVE WEIGHTS)
    // -------------------------------------------------------------
    const w = config.weights;
    let scoreSum =
      lookalike.score * w.nameSimilarity +
      publisherMismatchScore * w.publisherMismatch +
      scam.score * w.scamSignals;
    let activeWeight = w.nameSimilarity + (isApp ? w.publisherMismatch : 0) + w.scamSignals;

    if (candidate.avatarUrl && logoResult.score > 0) {
      scoreSum += logoResult.score * w.logoSimilarity;
      activeWeight += w.logoSimilarity;
    }

    if (!isApp && handleAnomalyScore > 0) {
      scoreSum += handleAnomalyScore * w.handleAnomaly;
      activeWeight += w.handleAnomaly;
    }

    let finalScore = activeWeight > 0 ? Math.min(100, Math.max(0, Math.round(scoreSum / activeWeight))) : 0;

    // If only name was provided and strong lookalike/homoglyph/spacing anomaly was detected
    if (lookalike.score >= 80 && scam.score === 0 && !candidate.description && !isApp) {
      finalScore = Math.max(finalScore, Math.round(lookalike.score * 0.75));
    }

    // Map to Severity Levels
    const sev = config.thresholds.severity;
    let severity: SeverityLevel = 'Safe';
    if (finalScore >= sev.critical) {
      severity = 'Critical';
    } else if (finalScore >= sev.high) {
      severity = 'High';
    } else if (finalScore >= sev.medium) {
      severity = 'Medium';
    } else if (finalScore >= sev.low) {
      severity = 'Low';
    }

    const detection: Detection = {
      recordId: `det-${candidate.id}`,
      id: `det-${candidate.id}`,
      candidateId: candidate.id,
      dataClass: 'SYNTHETIC_TEST_DATA',
      brandName: profile.brandName,
      platform: candidate.platform,
      accountOrAppName: candidate.name,
      name: candidate.name,
      handle: candidate.handle || null,
      profileUrl: candidate.profileUrl || '',
      urlOrListing: candidate.profileUrl || '',
      avatarUrl: candidate.avatarUrl,
      packageId: candidate.packageId || null,
      publisherOrDeveloper: candidate.developerName || null,
      developerName: candidate.developerName || null,
      description: candidate.description,
      nameSimilarityScore: Number((lookalike.score / 100).toFixed(2)),
      logoSimilarityScore: logoResult.score > 0 ? Number((logoResult.score / 100).toFixed(2)) : null,
      logoSimilarityReason: logoResult.reasons[0] || null,
      officialDomainMatch: profile.domains.some(d => (candidate.description || '').toLowerCase().includes(d)) ? 'Yes' : 'No',
      riskScore: finalScore,
      riskLevel: severity,
      severity,
      breakdown: {
        nameSimilarity: lookalike.score,
        logoSimilarity: logoResult.score,
        publisherMismatch: publisherMismatchScore,
        scamSignals: scam.score,
        handleAnomaly: handleAnomalyScore,
        unrelatedDeduction: lookalike.overflaggingGuardTriggered ? 50 : 0,
      },
      reasons: allReasons,
      recommendedAction: finalScore >= 80 ? 'File immediate takedown request with platform Trust & Safety.' : 'Monitor candidate profile for escalation or policy violations.',
      actionChecklist: finalScore >= 80 ? ['Submit platform takedown request', 'Add to DNS threat blocklist', 'Document incident in BrandShield'] : ['Perform routine monitoring'],
      dataSource: candidate.sourceId || 'candidate_adapter',
      datasetGenerated: '2026-10-13T00:00:00Z',
      isExcluded: false,
      exclusionReason: null,
      status: 'active',
    };

    return {
      isExcluded: false,
      detection,
    };
  } catch (error: any) {
    console.error(`[detection/engine.ts] Error evaluating candidate ${candidate.id}: ${error.message}`);
    throw error;
  }
}
