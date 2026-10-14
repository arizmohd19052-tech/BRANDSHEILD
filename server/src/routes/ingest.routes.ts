/**
 * [routes/ingest.routes.ts]
 * Ingestion and live evaluation endpoint for user-submitted candidates.
 * Runs the deterministic multi-signal detection engine server-side,
 * verifies official allowlists first, and supports persistence with rate-limiting.
 */

import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { evaluateCandidate } from '../detection/engine.js';
import { Candidate, Detection } from '../db/schema.js';
import { analysisService } from '../services/analysis.service.js';

export const ingestRouter = Router();

// In-memory rate limiting map: ip -> timestamps
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return false;
}

// Helper: Sanitize string inputs
function sanitizeString(str: any, maxLen: number = 500): string {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '').slice(0, maxLen);
}

// POST /api/ingest/check - Deterministically check a name/listing without persisting
ingestRouter.post('/check', async (req: Request, res: Response) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (isRateLimited(clientIp)) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait a minute before submitting more checks.',
      });
    }

    const {
      brandName,
      type,
      platform,
      name,
      urlOrListing,
      publisherOrDeveloper,
      description,
      logoBase64,
    } = req.body;

    const cleanName = sanitizeString(name, 150);
    if (!cleanName) {
      return res.status(400).json({
        success: false,
        error: 'Account or app name is required',
        field: 'name',
      });
    }

    const cleanBrandName = sanitizeString(brandName, 100);
    if (brandName !== undefined && brandName !== null && cleanBrandName === '') {
      return res.status(400).json({
        success: false,
        error: 'Brand name cannot be blank. Please select or specify a brand.',
        field: 'brandName',
      });
    }
    const targetBrand = cleanBrandName || 'HDFC Bank';
    const cleanType = (type === 'appstore' ? 'appstore' : 'social') as 'social' | 'appstore';
    const cleanPlatform = sanitizeString(platform, 50) || (cleanType === 'appstore' ? 'Google Play' : 'X');
    const cleanUrl = sanitizeString(urlOrListing, 300);
    // If a URL was provided, validate that it has a reasonable format (http/https or clean path)
    if (cleanUrl) {
      const isValidUrlFormat = /^(https?:\/\/|[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/i.test(cleanUrl);
      if (!isValidUrlFormat && cleanUrl.includes('://')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid URL format. Please provide a valid web address starting with http:// or https://',
        });
      }
    }
    const cleanDev = sanitizeString(publisherOrDeveloper, 150);
    const cleanDesc = sanitizeString(description, 1000);

    // Retrieve active brand profile
    const profile = db.getBrandProfile(targetBrand);

    // Build Candidate object
    const candidateId = `ingest-${Date.now()}`;
    const candidate: Candidate = {
      id: candidateId,
      sourceId: 'user_ingest_check',
      sourceType: cleanType,
      platform: cleanPlatform,
      name: cleanName,
      handle: cleanType === 'social' ? cleanName.replace(/[@\s]/g, '') : undefined,
      profileUrl: cleanUrl,
      avatarUrl: logoBase64 || undefined,
      packageId: cleanType === 'appstore' ? cleanUrl.split('id=')[1] || cleanName.toLowerCase().replace(/\s+/g, '.') : undefined,
      developerName: cleanDev || undefined,
      description: cleanDesc,
      discoveredAt: new Date().toISOString(),
    };

    // Run deterministic detection engine
    const evaluation = evaluateCandidate(candidate, profile);

    if (evaluation.isExcluded) {
      // Official Asset: Excluded
      const excludedRecord: Detection = {
        recordId: `usr-excl-${Date.now()}`,
        id: `usr-excl-${Date.now()}`,
        dataClass: 'USER_SUBMITTED',
        brandName: profile.brandName,
        platform: cleanPlatform,
        accountOrAppName: cleanName,
        name: cleanName,
        handle: candidate.handle,
        packageId: candidate.packageId,
        urlOrListing: cleanUrl,
        publisherOrDeveloper: cleanDev || null,
        nameSimilarityScore: 1.0,
        logoSimilarityScore: 1.0,
        logoSimilarityReason: 'Matches registered brand profile vector',
        officialDomainMatch: 'Yes',
        riskScore: 0,
        riskLevel: 'Safe',
        severity: 'Safe',
        breakdown: {
          nameSimilarity: 0,
          logoSimilarity: 0,
          publisherMismatch: 0,
          scamSignals: 0,
          handleAnomaly: 0,
          unrelatedDeduction: 0,
        },
        reasons: [
          evaluation.exclusionReason || '[EXCLUDED_OFFICIAL_ASSET] Matches official verified asset allowlist in Brand Profile',
          'Asset is protected from automated takedowns or security flags.',
        ],
        recommendedAction: 'No action required. Asset is verified and protected as an official property.',
        actionChecklist: ['Allowlist active in Asset Auditor'],
        dataSource: 'user_ingest_check',
        datasetGenerated: new Date().toISOString().split('T')[0],
        isExcluded: true,
        exclusionReason: evaluation.exclusionReason || 'Matches official asset allowlist in Brand Profile',
        status: 'confirmed',
      };

      excludedRecord.analysis = analysisService.analyzeThreat(excludedRecord);

      return res.json({
        success: true,
        isExcluded: true,
        exclusionReason: evaluation.exclusionReason,
        detection: excludedRecord,
      });
    }

    if (!evaluation.detection) {
      return res.status(500).json({ success: false, error: 'Evaluation failed to produce detection result.' });
    }

    // Candidate scored by engine
    const resultDetection = evaluation.detection;
    resultDetection.dataClass = 'USER_SUBMITTED';
    resultDetection.urlOrListing = cleanUrl;
    resultDetection.publisherOrDeveloper = cleanDev || null;
    resultDetection.analysis = analysisService.analyzeThreat(resultDetection);

    res.json({
      success: true,
      isExcluded: false,
      detection: resultDetection,
    });
  } catch (error: any) {
    console.error(`[routes/ingest.routes.ts] Error evaluating candidate: ${error.message}`);
    res.status(500).json({
      success: false,
      file: 'routes/ingest.routes.ts',
      error: error.message,
    });
  }
});

// POST /api/ingest/save - Persist user-checked candidate to store as USER_SUBMITTED
ingestRouter.post('/save', (req: Request, res: Response) => {
  try {
    const { detection } = req.body;
    if (!detection || !detection.accountOrAppName && !detection.name) {
      return res.status(400).json({ success: false, error: 'Valid detection payload required.' });
    }

    const uniqueId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const savedRecord: Detection = {
      ...detection,
      recordId: uniqueId,
      id: uniqueId,
      dataClass: 'USER_SUBMITTED',
      datasetGenerated: new Date().toISOString().split('T')[0],
      status: detection.status || 'active',
    };

    db.addUserDetection(savedRecord);

    res.json({
      success: true,
      savedRecord,
    });
  } catch (error: any) {
    console.error(`[routes/ingest.routes.ts] Error saving record: ${error.message}`);
    res.status(500).json({
      success: false,
      file: 'routes/ingest.routes.ts',
      error: error.message,
    });
  }
});
