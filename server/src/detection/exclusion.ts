/**
 * [detection/exclusion.ts]
 * Official Asset Allowlist Exclusion Engine (Pillar A).
 * Guarantees that registered legitimate brand assets (handles, apps, publishers)
 * are NEVER flagged as threats and are immediately excluded from detections.
 */

import { BrandProfile, Candidate, ExcludedAsset } from '../db/schema.js';

export interface ExclusionResult {
  isExcluded: boolean;
  reason?: string;
  auditRecord?: ExcludedAsset;
}

/**
 * Normalizes handles by trimming, lowercasing, and removing leading @ or url prefixes
 */
export function normalizeHandle(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim().toLowerCase();
  cleaned = cleaned.replace(/^@+/, '');
  cleaned = cleaned.replace(/^https?:\/\/(www\.)?(x|twitter|instagram|facebook|linkedin|t)\.(com|me)\//i, '');
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

/**
 * Evaluates whether a candidate belongs to the official brand assets.
 * Step 1 in the detection pipeline.
 */
export function checkOfficialExclusion(candidate: Candidate, profile: BrandProfile): ExclusionResult {
  try {
    const isApp =
      candidate.sourceType === 'appstore' ||
      ['google_play', 'apple_app_store', 'app'].includes((candidate.platform || '').toLowerCase()) ||
      Boolean(candidate.packageId);

    // 1. Check Social Media Handles (if not an app)
    if (!isApp) {
      const candidateHandle = normalizeHandle(candidate.handle || candidate.name);

      for (const social of profile.officialSocials) {
        if (!social.handle) continue;
        const officialHandle = normalizeHandle(social.handle);
        if (candidateHandle && officialHandle && candidateHandle === officialHandle) {
          const reason = `[EXCLUDED_OFFICIAL_HANDLE] Candidate matches official ${social.platform.toUpperCase()} handle: @${social.handle}`;
          return {
            isExcluded: true,
            reason,
            auditRecord: {
              id: `excl-${candidate.id}`,
              candidateId: candidate.id,
              name: candidate.name,
              handle: candidate.handle,
              platform: candidate.platform,
              exclusionReason: reason,
              excludedAt: new Date().toISOString(),
            },
          };
        }
      }
    }

    // 2. Check Mobile App Package IDs / Bundle Identifiers
    if (isApp) {
      const candPkg = (candidate.packageId || '').trim().toLowerCase();
      const candDev = (candidate.developerName || (candidate as any).publisherOrDeveloper || '').trim().toLowerCase();

      for (const app of profile.officialApps) {
        const officialPkg = app.packageId.trim().toLowerCase();
        const officialPub = app.publisherName.trim().toLowerCase();

        // Exact package ID match
        if (candPkg && officialPkg && candPkg === officialPkg) {
          const reason = `[EXCLUDED_OFFICIAL_APP] Candidate matches registered official app package: ${app.packageId}`;
          return {
            isExcluded: true,
            reason,
            auditRecord: {
              id: `excl-${candidate.id}`,
              candidateId: candidate.id,
              name: candidate.name,
              platform: candidate.platform,
              packageId: candidate.packageId,
              developerName: candidate.developerName,
              exclusionReason: reason,
              excludedAt: new Date().toISOString(),
            },
          };
        }

        // App name and official publisher match
        if (
          candidate.name.trim().toLowerCase() === app.appName.trim().toLowerCase() &&
          candDev && officialPub && candDev === officialPub
        ) {
          const reason = `[EXCLUDED_OFFICIAL_PUBLISHER] Candidate app matches official title and verified publisher: ${app.publisherName}`;
          return {
            isExcluded: true,
            reason,
            auditRecord: {
              id: `excl-${candidate.id}`,
              candidateId: candidate.id,
              name: candidate.name,
              platform: candidate.platform,
              packageId: candidate.packageId,
              developerName: candidate.developerName,
              exclusionReason: reason,
              excludedAt: new Date().toISOString(),
            },
          };
        }
      }
    }

    // 3. Domain match in profile URLs or name
    const candidateUrl = (candidate.profileUrl || '').trim().toLowerCase();
    const candidateName = candidate.name.trim().toLowerCase();

    for (const domain of profile.domains) {
      const cleanDomain = domain.trim().toLowerCase();
      const domainMatches =
        candidateUrl.includes(`://${cleanDomain}`) ||
        candidateUrl.includes(`://www.${cleanDomain}`) ||
        candidateUrl.includes(`.${cleanDomain}`) ||
        candidateUrl === cleanDomain ||
        candidateName === cleanDomain ||
        candidateName === `www.${cleanDomain}`;

      if (domainMatches) {
        const reason = `[EXCLUDED_OFFICIAL_DOMAIN] Candidate profile URL resides on verified brand domain: ${domain}`;
        return {
          isExcluded: true,
          reason,
          auditRecord: {
            id: `excl-${candidate.id}`,
            candidateId: candidate.id,
            name: candidate.name,
            platform: candidate.platform,
            exclusionReason: reason,
            excludedAt: new Date().toISOString(),
          },
        };
      }
    }

    return { isExcluded: false };
  } catch (error: any) {
    console.error(`[detection/exclusion.ts] Error checking official exclusion: ${error.message}`);
    // Safe fallback: don't exclude on internal error
    return { isExcluded: false };
  }
}
