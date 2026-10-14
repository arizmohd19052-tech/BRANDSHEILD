/**
 * [tests/lookalike.test.ts]
 * Unit tests for Look-alike Name Detector & Exclusion Filter.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeLookalikeName,
  foldHomoglyphs,
  condenseText,
  levenshteinDistance,
  jaroWinklerSimilarity,
} from '../src/detection/lookalike.js';
import { checkOfficialExclusion } from '../src/detection/exclusion.js';
import { db } from '../src/db/index.js';
import { Candidate } from '../src/sources/types.js';

test('1. Homoglyph Folding & Character Swaps', () => {
  const brand = 'Acme Bank';

  // Test 'rn' for 'm'
  const rnTest = foldHomoglyphs('acrne bank');
  assert.equal(rnTest.folded, 'acme bank');
  assert.ok(rnTest.detected.length > 0);

  const rnAnalysis = analyzeLookalikeName('Acrne Bank', brand);
  assert.ok(rnAnalysis.isLookalike, 'Should be flagged as lookalike');
  assert.ok(rnAnalysis.score >= 80, `Expected score >= 80, got ${rnAnalysis.score}`);
  assert.ok(rnAnalysis.detectedVariations.some(v => v.includes("'rn' substituted for 'm'")));

  // Test '0' for 'o'
  const zeroTest = analyzeLookalikeName('Acme 0fficial', brand);
  assert.ok(zeroTest.score >= 70, `Expected score >= 70, got ${zeroTest.score}`);
  assert.ok(zeroTest.detectedVariations.some(v => v.includes("'0' (zero) substituted for 'o'")));
});

test('2. Added Impersonation Words', () => {
  const brand = 'Acme Bank';

  const supportAnalysis = analyzeLookalikeName('Acme Support', brand);
  assert.ok(supportAnalysis.isLookalike, 'Should flag Acme Support');
  assert.ok(supportAnalysis.tokenMatches.includes('support'));
  assert.ok(supportAnalysis.score >= 85, `Expected score >= 85, got ${supportAnalysis.score}`);

  const helpdeskAnalysis = analyzeLookalikeName('Acme Official Helpdesk', brand);
  assert.ok(helpdeskAnalysis.isLookalike);
  assert.ok(helpdeskAnalysis.tokenMatches.includes('official'));
  assert.ok(helpdeskAnalysis.tokenMatches.includes('helpdesk'));
});

test('3. Spacing & Punctuation Mutations', () => {
  const brand = 'Acme Bank';

  const spacingAnalysis = analyzeLookalikeName('A c m e Bank', brand);
  assert.ok(spacingAnalysis.isLookalike, 'Artificial spacing should be detected');
  assert.ok(spacingAnalysis.detectedVariations.some(v => v.includes('Artificial spacing')));
  assert.ok(spacingAnalysis.score >= 80);

  const underscoreAnalysis = analyzeLookalikeName('Acme_Bank_Official', brand);
  assert.ok(underscoreAnalysis.isLookalike);
  assert.ok(underscoreAnalysis.tokenMatches.includes('official'));
});

test('4. Over-flagging Prevention (Benign Entities Not Over-Flagged)', () => {
  const brand = 'Acme Bank';
  const keywords = ['banking', 'checking', 'finance', 'credit', 'loan'];

  // "Acme Bakery" shares the word Acme, but is an unrelated business
  const bakeryAnalysis = analyzeLookalikeName(
    'Acme Bakery & Cafe',
    brand,
    keywords,
    'Fresh artisan sourdough bread, pastries, and roasted coffee.'
  );

  assert.ok(
    bakeryAnalysis.overflaggingGuardTriggered,
    'Overflagging guard should trigger for bakery without banking keywords'
  );
  assert.ok(
    bakeryAnalysis.score < 60,
    `Expected bakery score to be depressed below threat threshold, got ${bakeryAnalysis.score}`
  );
  assert.ok(
    bakeryAnalysis.reasons.some(r => r.includes('[UNRELATED_SECTOR_GUARD]')),
    'Should cite unrelated sector guard'
  );

  // Unrelated business: Acme Auto Repair
  const autoAnalysis = analyzeLookalikeName(
    'Acme Auto Repair & Towing',
    brand,
    keywords,
    'Brake service, oil changes, engine diagnostics, and 24/7 towing.'
  );
  assert.ok(autoAnalysis.overflaggingGuardTriggered);
  assert.ok(autoAnalysis.score < 50);
});

test('5. Official Asset Exclusion Verification (Pillar A)', () => {
  const brandProfile = db.getBrandProfile('brand_hdfc');

  // Candidate matching official handle
  const officialSocialCand: Candidate = {
    id: 'test-official-soc',
    sourceId: 'x-social',
    sourceType: 'social',
    platform: 'X',
    name: 'HDFC Bank',
    handle: 'HDFC_Bank', // Matches brandProfile
    avatarUrl: 'https://example.com/logo.png',
    description: 'Official account',
    discoveredAt: new Date().toISOString(),
  };

  const socialResult = checkOfficialExclusion(officialSocialCand, brandProfile);
  assert.equal(socialResult.isExcluded, true, 'Official social handle must be excluded');
  assert.ok(socialResult.reason?.includes('[EXCLUDED_OFFICIAL_HANDLE]'));

  // Candidate matching official app package ID
  const officialAppCand: Candidate = {
    id: 'test-official-app',
    sourceId: 'google-play-store',
    sourceType: 'appstore',
    platform: 'Google Play',
    name: 'HDFC Bank MobileBanking',
    packageId: 'com.snapwork.hdfc', // Matches brandProfile
    developerName: 'HDFC Bank Ltd.',
    avatarUrl: 'https://example.com/logo.png',
    description: 'Official banking app',
    discoveredAt: new Date().toISOString(),
  };

  const appResult = checkOfficialExclusion(officialAppCand, brandProfile);
  assert.equal(appResult.isExcluded, true, 'Official app package ID must be excluded');
  assert.ok(appResult.reason?.includes('[EXCLUDED_OFFICIAL_APP]'));

  // Impersonator app should NOT be excluded
  const fakeAppCand: Candidate = {
    id: 'test-fake-app',
    sourceId: 'google-play-store',
    sourceType: 'appstore',
    platform: 'Google Play',
    name: 'HDFC Fast Loan Cash',
    packageId: 'com.fake.hdfcloan.scam',
    developerName: 'Scam Loan LLC',
    avatarUrl: 'https://example.com/logo.png',
    description: 'Instant loans',
    discoveredAt: new Date().toISOString(),
  };

  const fakeResult = checkOfficialExclusion(fakeAppCand, brandProfile);
  assert.equal(fakeResult.isExcluded, false, 'Impersonator app must NOT be excluded');
});
