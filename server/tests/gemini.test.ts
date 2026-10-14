/**
 * [server/tests/gemini.test.ts]
 * Unit and integration tests for the Gemini enrichment service:
 * - Model name resolver (empty, MODEL_NAME placeholder, models/ prefix, valid)
 * - Error classification (permanent non-retryable vs retryable)
 * - Circuit breaker resilience and recovery
 * - Deterministic template fallback formatting
 * - Lightweight health probe
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveModelName,
  classifyError,
  generateTemplateFallback,
  DEFAULT_GEMINI_MODEL,
  probeAIHealth,
  getAIHealthStatus,
  getAIDetailedStatus,
  resetCircuitBreaker,
} from '../src/services/gemini.service.js';
import { Detection } from '../src/db/schema.js';

test('1. Model Name Resolver: Handles invalid, placeholder, and valid names', () => {
  // Empty input -> defaults to gemini-3.8-flash
  assert.equal(resolveModelName(''), DEFAULT_GEMINI_MODEL);
  assert.equal(resolveModelName('   '), DEFAULT_GEMINI_MODEL);

  // Literal placeholder "MODEL_NAME" -> defaults to gemini-3.8-flash
  assert.equal(resolveModelName('MODEL_NAME'), DEFAULT_GEMINI_MODEL);
  assert.equal(resolveModelName('  MODEL_NAME  '), DEFAULT_GEMINI_MODEL);

  // Names with spaces or bracket placeholders -> defaults to gemini-3.8-flash
  assert.equal(resolveModelName('gemini model with spaces'), DEFAULT_GEMINI_MODEL);
  assert.equal(resolveModelName('<INSERT_MODEL_NAME>'), DEFAULT_GEMINI_MODEL);

  // Valid model names
  assert.equal(resolveModelName('gemini-3.8-flash'), 'gemini-3.8-flash');
  assert.equal(resolveModelName('gemini-2.5-flash'), 'gemini-2.5-flash');

  // "models/" prefix form is preserved/accepted
  assert.equal(resolveModelName('models/gemini-3.8-flash'), 'models/gemini-3.8-flash');
});

test('2. Error Classification: Permanent (non-retryable) vs Retryable errors', () => {
  // Permanent: Invalid model name format (400)
  const invalidModelErr = classifyError(new Error('* GenerateContentRequest.model: unexpected model name format'));
  assert.equal(invalidModelErr.category, 'invalid_model');
  assert.equal(invalidModelErr.isRetryable, false, 'Invalid model format must NOT be retryable');

  // Permanent: Model not found (404)
  const notFoundErr = classifyError({ message: "404 Model 'gemini-does-not-exist' not found", status: 404 });
  assert.equal(notFoundErr.category, 'model_not_found');
  assert.equal(notFoundErr.isRetryable, false, '404 Model Not Found must NOT be retryable');

  // Permanent: Authentication error (401/403)
  const authErr = classifyError({ message: 'API key not valid', status: 401 });
  assert.equal(authErr.category, 'auth');
  assert.equal(authErr.isRetryable, false, 'Auth failures must NOT be retryable');

  // Retryable: Timeout / AbortError
  const timeoutErr = classifyError({ name: 'AbortError', message: 'Request timed out after 10000ms' });
  assert.equal(timeoutErr.category, 'timeout');
  assert.equal(timeoutErr.isRetryable, true, 'Timeouts must be retryable');

  // Retryable: Network failure
  const networkErr = classifyError(new Error('TypeError: fetch failed (ECONNREFUSED)'));
  assert.equal(networkErr.category, 'network');
  assert.equal(networkErr.isRetryable, true, 'Network connectivity drops must be retryable');

  // Retryable: 5xx server error
  const server503 = classifyError({ message: 'Service Unavailable', status: 503 });
  assert.equal(server503.isRetryable, true, 'HTTP 503 must be retryable');
});

test('3. Deterministic Template Fallback: Safe formatting with correct provider label', () => {
  const dummyDetection: Detection = {
    recordId: 'det-test-fallback-01',
    id: 'det-test-fallback-01',
    dataClass: 'SYNTHETIC_TEST_DATA',
    brandName: 'HDFC Bank',
    platform: 'X',
    accountOrAppName: 'HDFC Bnak Customer Support 24x7',
    name: 'HDFC Bnak Customer Support 24x7',
    handle: 'hdfc_bnak_help',
    urlOrListing: 'https://social.example.com/hdfc_bnak_help',
    publisherOrDeveloper: null,
    nameSimilarityScore: 0.9,
    logoSimilarityScore: null,
    logoSimilarityReason: null,
    officialDomainMatch: 'No',
    riskScore: 88,
    riskLevel: 'Critical',
    reasons: [
      '[TYPO_LOOKALIKE] 1-char transposition: HDFC Bnak vs HDFC Bank',
      '[SCAM_KEYWORD] Demands OTP and urgent account verification',
    ],
    recommendedAction: 'Submit urgent impersonation report',
    actionChecklist: ['Document URL', 'Send takedown form', 'Block handle'],
    dataSource: 'social_mock',
    datasetGenerated: '2026-10-14',
    isExcluded: false,
    exclusionReason: null,
  };

  const fallback = generateTemplateFallback(dummyDetection, 'HDFC Bank');
  assert.equal(fallback.provider, 'AI unavailable, showing rule-based analysis');
  assert.ok(fallback.threatExplanation.includes('HDFC Bnak Customer Support 24x7'));
  assert.ok(fallback.threatExplanation.includes('HDFC Bank'));
  assert.ok(fallback.actionChecklist.length > 0);
  assert.equal(fallback.evidencePoints.length, dummyDetection.reasons.length);
});

test('4. Live Health Probe: Returns structured report without throwing', async () => {
  const probe = await probeAIHealth();
  assert.ok(probe, 'Probe must return an object');
  assert.ok(typeof probe.status === 'string');
  assert.ok(['AVAILABLE', 'NO_KEY', 'INVALID_MODEL', 'QUOTA_EXCEEDED', 'NETWORK_ERROR', 'AUTH_ERROR'].includes(probe.status));
  assert.equal(probe.model, resolveModelName());
  assert.ok(typeof probe.verified === 'boolean');
});

test('5. Detailed Health Status API Contract', () => {
  const detailed = getAIDetailedStatus();
  assert.ok(['available', 'degraded', 'unavailable'].includes(detailed.status));
  assert.equal(detailed.model, resolveModelName());
  assert.ok(typeof detailed.isCircuitOpen === 'boolean');
  assert.ok(typeof detailed.consecutiveFailures === 'number');

  // Verify circuit breaker reset helper
  resetCircuitBreaker();
  const resetDetailed = getAIDetailedStatus();
  assert.equal(resetDetailed.consecutiveFailures, 0);
  assert.equal(resetDetailed.isCircuitOpen, false);
});
