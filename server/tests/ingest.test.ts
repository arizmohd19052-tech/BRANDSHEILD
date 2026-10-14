/**
 * [server/tests/ingest.test.ts]
 * Unit test suite for Ingestion, Deterministic Evaluation Engine, Allowlist Exclusion,
 * and Feedback mechanisms in BrandShield AI.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db/index.js';
import { evaluateCandidate } from '../src/detection/engine.js';
import { Candidate } from '../src/db/schema.js';

test('Ingest Engine: Official asset exclusion guarantees no false positives', () => {
  const hdfc = db.getProfile('brand-hdfc');
  assert.ok(hdfc, 'HDFC profile must exist in verified brands');

  // Candidate with official Twitter handle
  const officialCandidate: Candidate = {
    id: 'test-official-1',
    dataClass: 'USER_SUBMITTED',
    brandName: 'HDFC Bank',
    platform: 'x',
    name: 'HDFC Bank',
    handle: 'HDFC_Bank',
    urlOrListing: 'https://twitter.com/HDFC_Bank',
    publisherOrDeveloper: null,
    description: 'Official Twitter handle of HDFC Bank',
  };

  const evalResult = evaluateCandidate(officialCandidate, hdfc);
  assert.equal(evalResult.isExcluded, true, 'Official handle MUST be excluded');
  assert.ok(
    evalResult.exclusionReason?.includes('matches official') || evalResult.exclusionReason?.includes('EXCLUDED_OFFICIAL'),
    'Exclusion reason must state allowlist match'
  );
});

test('Ingest Engine: Multi-signal correlation required to flag high/critical threats', () => {
  const phonepe = db.getProfile('brand-phonepe');
  assert.ok(phonepe, 'PhonePe profile must exist in verified brands');

  // Rogue app with name similarity, mismatched publisher, scam keywords, and suspicious package
  const rogueAppCandidate: Candidate = {
    id: 'test-rogue-app-1',
    dataClass: 'USER_SUBMITTED',
    brandName: 'PhonePe',
    platform: 'google_play',
    name: 'PhonePe Instant UPI Cash Loan',
    handle: null,
    packageId: 'com.phonepe.instantloan.cash',
    urlOrListing: 'https://play.google.com/store/apps/details?id=com.phonepe.instantloan.cash',
    publisherOrDeveloper: 'Fast Rupee Tech Ltd',
    developerName: 'Fast Rupee Tech Ltd',
    description: 'Urgent 5 minute personal loans credited directly to your UPI account. Call 24x7 emergency helpline.',
  };

  const evalResult = evaluateCandidate(rogueAppCandidate, phonepe);
  assert.equal(evalResult.isExcluded, false, 'Rogue app must NOT be excluded');
  assert.ok(evalResult.detection && evalResult.detection.riskScore >= 45, `Risk score should be >= 45, got ${evalResult.detection?.riskScore}`);
  assert.ok(
    evalResult.detection && ['Critical', 'High', 'Medium'].includes(evalResult.detection.riskLevel),
    `Risk level should be flagged, got ${evalResult.detection?.riskLevel}`
  );
  assert.ok(
    evalResult.detection && evalResult.detection.reasons.length >= 2,
    'Must have multiple correlated reasons to justify elevated risk'
  );
});

test('Ingest Engine: False-positive prevention for benign entities', () => {
  const flipkart = db.getProfile('brand-flipkart');
  assert.ok(flipkart, 'Flipkart profile must exist');

  // Coincidental or generic candidate with low overlap and no scam indicators
  const benignCandidate: Candidate = {
    id: 'test-benign-1',
    dataClass: 'USER_SUBMITTED',
    brandName: 'Flipkart',
    platform: 'x',
    name: 'Art Flipkartist Reviews',
    handle: 'flipkart_art_reviews',
    urlOrListing: 'https://twitter.com/flipkart_art_reviews',
    publisherOrDeveloper: null,
    description: 'Independent art critique and gallery exhibition discussions.',
  };

  const evalResult = evaluateCandidate(benignCandidate, flipkart);
  assert.equal(evalResult.isExcluded, false);
  assert.ok(
    evalResult.detection.riskScore < 50,
    `Benign profile must score < 50, got ${evalResult.detection.riskScore}`
  );
  assert.ok(
    ['Low', 'Safe'].includes(evalResult.detection.riskLevel),
    `Risk level should be Low or Safe, got ${evalResult.detection.riskLevel}`
  );
});

test('Dataset Provenance: User-submitted records persist separately and reset cleanly', () => {
  const initialCounts = db.getDatasetCounts();
  const initialUserCount = initialCounts.byDataClass.USER_SUBMITTED;

  // Add a test user-submitted detection
  const testUserDetection: any = {
    recordId: 'user-det-test-999',
    id: 'user-det-test-999',
    dataClass: 'USER_SUBMITTED',
    brandName: 'HDFC Bank',
    platform: 'x',
    accountOrAppName: 'HDFC Test Impersonator',
    urlOrListing: 'https://twitter.com/hdfc_test_999',
    publisherOrDeveloper: null,
    nameSimilarityScore: 85,
    logoSimilarityScore: null,
    logoSimilarityReason: null,
    officialDomainMatch: 'No',
    riskScore: 78,
    riskLevel: 'High',
    breakdown: {
      nameSimilarity: 30,
      logoSimilarity: 0,
      publisherMismatch: 0,
      scamSignals: 25,
      handleAnomaly: 23,
      unrelatedDeduction: 0,
    },
    reasons: ['High token overlap', 'Unverified urgent care claim'],
    recommendedAction: 'Issue takedown notice',
    actionChecklist: ['Submit trademark abuse report'],
    dataSource: 'User Ingestion API',
    datasetGenerated: new Date().toISOString(),
    isExcluded: false,
    exclusionReason: null,
    status: 'active',
  };

  db.addUserDetection(testUserDetection);
  const afterAddCounts = db.getDatasetCounts();
  assert.equal(afterAddCounts.byDataClass.USER_SUBMITTED, initialUserCount + 1);

  // Reset user data
  db.resetToOriginalDataset();
  const afterResetCounts = db.getDatasetCounts();
  assert.equal(afterResetCounts.byDataClass.USER_SUBMITTED, 0, 'User submitted records must be reset to 0');
  assert.ok(afterResetCounts.byDataClass.VERIFIED_PUBLIC > 0, 'Verified public data must remain intact');
  assert.ok(afterResetCounts.byDataClass.SYNTHETIC_TEST_DATA > 0, 'Synthetic test data must remain intact');
});

test('Feedback Store: Successfully records feedback', () => {
  const feedback = db.addFeedback({
    rating: 5,
    category: 'detection_accuracy',
    comment: 'Look-alike engine correctly caught Cyrillic homoglyph swap on HDFC.',
    email: 'sec-analyst@example.com',
  });

  assert.ok(feedback.id);
  assert.equal(feedback.rating, 5);
  const allFeedbacks = db.getFeedbacks();
  assert.ok(allFeedbacks.some((f) => f.id === feedback.id));
});
