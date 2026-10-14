/**
 * [detection/lookalike.ts]
 * Look-alike Name Detection Engine (Bonus Feature).
 * Detects:
 * - Homoglyphs & Character swaps (0 for o, rn for m, vv for w, 1 for l/I)
 * - Added words (Acme Support, Acme Official Helpdesk)
 * - Spacing and punctuation mutations (A c m e, Acme_Bank)
 * - Over-flagging guard against benign unrelated businesses (Acme Bakery)
 */

import { getDetectionConfig } from '../config/detection.config.js';

export interface LookalikeAnalysis {
  originalInput: string;
  normalizedInput: string;
  homoglyphFolded: string;
  condensedInput: string;
  brandNormalized: string;
  score: number;               // 0 - 100
  isLookalike: boolean;
  detectedVariations: string[];
  reasons: string[];
  tokenMatches: string[];
  overflaggingGuardTriggered: boolean;
}

// Common homoglyphs and visual confusion mappings
const HOMOGLYPH_MAP: Array<{ pattern: RegExp; replacement: string; label: string }> = [
  { pattern: /rn/g, replacement: 'm', label: "'rn' substituted for 'm'" },
  { pattern: /vv/g, replacement: 'w', label: "'vv' substituted for 'w'" },
  { pattern: /0/g, replacement: 'o', label: "'0' (zero) substituted for 'o'" },
  { pattern: /1/g, replacement: 'l', label: "'1' (one) substituted for 'l'" },
  { pattern: /3/g, replacement: 'e', label: "'3' substituted for 'e'" },
  { pattern: /4/g, replacement: 'a', label: "'4' substituted for 'a'" },
  { pattern: /@/g, replacement: 'a', label: "'@' substituted for 'a'" },
  { pattern: /5/g, replacement: 's', label: "'5' substituted for 's'" },
  { pattern: /\$/g, replacement: 's', label: "'$' substituted for 's'" },
  { pattern: /8/g, replacement: 'b', label: "'8' substituted for 'b'" },
  { pattern: /\|/g, replacement: 'l', label: "'|' substituted for 'l'" },
  { pattern: /cl/g, replacement: 'd', label: "'cl' substituted for 'd'" },
];

// Unrelated industry keywords to prevent over-flagging (e.g. bakery, plumbing)
const UNRELATED_INDUSTRY_TOKENS = [
  'bakery', 'bake', 'bread', 'cake', 'cafe', 'coffee', 'pizza', 'restaurant',
  'plumbing', 'electric', 'hardware', 'auto', 'motors', 'towing', 'cleaners',
  'laundry', 'salon', 'barber', 'dental', 'clinic', 'landscaping', 'pest',
  'roofing', 'carpentry', 'tours', 'travels', 'florist', 'shoes', 'apparel'
];

/**
 * Standardizes text into clean lowercase ascii
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Folds look-alike characters and records detected substitutions
 */
export function foldHomoglyphs(text: string): { folded: string; detected: string[] } {
  let folded = text.toLowerCase();
  const detected: string[] = [];

  for (const h of HOMOGLYPH_MAP) {
    if (h.pattern.test(folded)) {
      detected.push(h.label);
      folded = folded.replace(h.pattern, h.replacement);
    }
  }

  return { folded, detected };
}

/**
 * Strips all spacing and non-alphanumeric punctuation
 */
export function condenseText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Computes Levenshtein Distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,       // deletion
        dp[i][j - 1] + 1,       // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Computes Jaro-Winkler Similarity (0.0 to 1.0)
 */
export function jaroWinklerSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (!s1.length || !s2.length) return 0.0;

  const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro = (
    matches / s1.length +
    matches / s2.length +
    (matches - transpositions / 2) / matches
  ) / 3;

  // Winkler prefix scaling (up to 4 chars)
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(s1.length, s2.length)); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return Math.min(1.0, jaro + prefix * 0.1 * (1 - jaro));
}

/**
 * Main Look-alike Analysis Function
 */
export function analyzeLookalikeName(
  candidateName: string,
  targetBrandName: string,
  targetKeywords: string[] = ['banking', 'finance', 'credit', 'loan', 'money'],
  candidateContext = ''
): LookalikeAnalysis {
  try {
    const config = getDetectionConfig();
    const reasons: string[] = [];
    const detectedVariations: string[] = [];

    const normCandidate = normalizeText(candidateName);
    const normBrand = normalizeText(targetBrandName);

    const { folded: foldedCandidate, detected: homoglyphs } = foldHomoglyphs(normCandidate);
    detectedVariations.push(...homoglyphs);

    const condCandidate = condenseText(foldedCandidate);
    const condBrand = condenseText(normBrand);

    // 1. Spacing Mutation Check (e.g. 'A c m e B a n k' -> 'acmebank')
    const hasSpacingMutation =
      candidateName.includes(' ') &&
      condenseText(candidateName).includes(condBrand) &&
      !normCandidate.includes(normBrand);
    if (hasSpacingMutation) {
      detectedVariations.push('Artificial spacing/punctuation separating brand characters');
      reasons.push(`[SPACING_ANOMALY] Deceptive spacing detected attempting to bypass filters`);
    }

    // 2. Added High-Risk Tokens Check (e.g., 'Acme Support', 'Acme Helpdesk')
    // Punctuation-separated text for reliable word-boundary matching (handles 'Acme_Bank_Official')
    const spacedCandidate = normCandidate.replace(/[^a-z0-9]+/g, ' ');
    const spacedContext = normalizeText(candidateContext).replace(/[^a-z0-9]+/g, ' ');

    const tokenMatches: string[] = [];
    for (const suffix of config.keywords.impersonationSuffixes) {
      const regex = new RegExp(`\\b${suffix}\\b`, 'i');
      if (regex.test(spacedCandidate) || regex.test(spacedContext)) {
        tokenMatches.push(suffix);
      }
    }

    if (tokenMatches.length > 0) {
      reasons.push(`[IMPERSONATION_SUFFIXES] Contains high-risk identity tokens: "${tokenMatches.join(', ')}"`);
    }

    // 3. String Distances
    const jwRaw = jaroWinklerSimilarity(normCandidate, normBrand);
    const jwCondensed = jaroWinklerSimilarity(condCandidate, condBrand);
    const levDistance = levenshteinDistance(condCandidate, condBrand);

    // Relative Levenshtein similarity (0 to 1)
    const maxLen = Math.max(condCandidate.length, condBrand.length);
    const levSim = maxLen > 0 ? (maxLen - levDistance) / maxLen : 1.0;

    // Best combined base similarity
    let baseScore = Math.max(jwRaw, jwCondensed, levSim) * 100;

    // If homoglyphs were detected, boost score confidence
    if (homoglyphs.length > 0) {
      reasons.push(`[HOMOGLYPH_DETECTED] Character swaps identified: ${homoglyphs.join(', ')}`);
      baseScore = Math.max(baseScore, 85);
    }

    // If spacing anomaly detected (e.g. H D F C B a n k), boost score confidence
    if (hasSpacingMutation) {
      baseScore = Math.max(baseScore, 85);
    }

    // Core brand tokens (e.g. 'acme' from 'acme bank')
    const brandTokens = normBrand.split(/\s+/).filter(Boolean);
    const brandFirstWord = brandTokens[0] || normBrand;

    // If candidate contains exact condensed brand + high-risk token, or core brand token + high-risk token
    if (tokenMatches.length > 0 && (condCandidate.includes(condBrand) || condCandidate.includes(brandFirstWord))) {
      baseScore = Math.max(baseScore, 88);
    }

    // 4. Over-flagging Guard (Pillar: Protect Benign Unrelated Businesses & Fan/Community Groups)
    let overflaggingGuardTriggered = false;
    const lowerFullContext = `${normCandidate} ${normalizeText(candidateContext)}`;

    const hasUnrelatedToken = UNRELATED_INDUSTRY_TOKENS.some((tok) =>
      new RegExp(`\\b${tok}\\b`, 'i').test(lowerFullContext)
    );

    const BENIGN_COMMUNITY_TOKENS = ['fan', 'fans', 'community', 'club', 'enthusiast', 'enthusiasts', 'memes', 'parody'];
    const hasBenignCommunityToken = BENIGN_COMMUNITY_TOKENS.some((tok) =>
      new RegExp(`\\b${tok}\\b`, 'i').test(lowerFullContext)
    );

    const hasBrandIndustryToken = targetKeywords.some((kw) => {
      const normKw = normalizeText(kw);
      if (normKw === normBrand || normKw === brandFirstWord) return false;
      return new RegExp(`\\b${normKw}\\b`, 'i').test(lowerFullContext);
    });

    // If it shares brand word ("Acme") but explicitly mentions an unrelated category
    // or is a benign community group without scam/impersonation tokens
    if (
      (hasUnrelatedToken && !hasBrandIndustryToken && tokenMatches.length === 0) ||
      (hasBenignCommunityToken && tokenMatches.length === 0)
    ) {
      overflaggingGuardTriggered = true;
      baseScore = Math.round(baseScore * config.thresholds.unrelatedPenalty);
      if (hasUnrelatedToken) {
        reasons.push(
          `[UNRELATED_SECTOR_GUARD] Safe benign entity: context indicates unrelated business sector without brand keywords`
        );
      } else {
        reasons.push(
          `[BENIGN_ENTITY_GUARD] Safe benign entity: context indicates community or fan page without deceptive tokens`
        );
      }
    }

    const finalScore = Math.min(100, Math.max(0, Math.round(baseScore)));
    const isLookalike = finalScore >= config.thresholds.lookalikeMatch * 100;

    if (isLookalike && !reasons.some(r => r.startsWith('[HIGH_SIMILARITY]'))) {
      reasons.unshift(
        `[HIGH_SIMILARITY] Name variation score (${finalScore}%) exceeds threshold (${config.thresholds.lookalikeMatch * 100}%)`
      );
    } else if (!isLookalike && !overflaggingGuardTriggered) {
      reasons.push(`[NORMAL_SIMILARITY] Name similarity (${finalScore}%) is within safe tolerance`);
    }

    return {
      originalInput: candidateName,
      normalizedInput: normCandidate,
      homoglyphFolded: foldedCandidate,
      condensedInput: condCandidate,
      brandNormalized: normBrand,
      score: finalScore,
      isLookalike,
      detectedVariations,
      reasons,
      tokenMatches,
      overflaggingGuardTriggered,
    };
  } catch (error: any) {
    console.error(`[detection/lookalike.ts] Error analyzing lookalike name: ${error.message}`);
    return {
      originalInput: candidateName,
      normalizedInput: candidateName,
      homoglyphFolded: candidateName,
      condensedInput: candidateName,
      brandNormalized: targetBrandName,
      score: 0,
      isLookalike: false,
      detectedVariations: [],
      reasons: [`[ERROR] Detection failed: ${error.message}`],
      tokenMatches: [],
      overflaggingGuardTriggered: false,
    };
  }
}
