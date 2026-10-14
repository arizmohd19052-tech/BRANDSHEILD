/**
 * [routes/health.routes.ts]
 * Health check endpoint for BrandShield AI.
 * Accurately reports service health, data sources, and real-time AI status:
 * "available" | "degraded" | "unavailable".
 */

import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { getAIDetailedStatus, getAICircuitState } from '../services/gemini.service.js';
import { env } from '../config/env.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const sources = db.getSourceHealth();
    const detailedAI = getAIDetailedStatus();
    const circuit = getAICircuitState();

    res.json({
      status: 'ok',
      db: 'healthy',
      brands: db.getBrands().length,
      detections: db.getDetections().length,
      mode: 'demo-dataset',
      ai: {
        status: detailedAI.status,
        model: detailedAI.model,
        verified: detailedAI.verified,
        lastError: detailedAI.lastError,
        lastErrorCategory: detailedAI.lastErrorCategory,
      },
      aiStatus: detailedAI.status,
      aiAvailable: detailedAI.status !== 'unavailable',
      circuit,
      model: detailedAI.model,
      fallbackModel: env.GEMINI_FALLBACK_MODEL || null,
      timestamp: new Date().toISOString(),
      sources,
    });
  } catch (error: any) {
    console.error(`[routes/health.routes.ts] Error checking health: ${error.message}`);
    res.status(500).json({
      status: 'error',
      mode: 'demo-dataset',
      file: 'routes/health.routes.ts',
      message: error.message,
    });
  }
});
