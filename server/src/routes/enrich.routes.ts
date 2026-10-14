/**
 * [routes/enrich.routes.ts]
 * Google AI Studio / Gemini Threat Enrichment Endpoint.
 * Generates plain-language threat explanations, scam confidence, and takedown steps.
 */

import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { enrichThreatWithAI } from '../services/gemini.service.js';

export const enrichRouter = Router();

enrichRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { detectionId, detection: directDetection, brandName: directBrandName } = req.body;

    if (directDetection && directBrandName) {
      const enrichment = await enrichThreatWithAI(directDetection, directBrandName);
      return res.json({
        success: true,
        enrichment,
      });
    }

    if (!detectionId) {
      return res.status(400).json({
        success: false,
        file: 'routes/enrich.routes.ts',
        error: 'detectionId or (detection + brandName) is required',
      });
    }

    const detections = db.getDetections();
    const detection = detections.find(
      (d) => d.id === detectionId || d.recordId === detectionId
    );

    if (!detection) {
      return res.status(404).json({
        success: false,
        file: 'routes/enrich.routes.ts',
        error: `Detection ${detectionId} not found`,
      });
    }

    const profile = db.getBrandProfile(detection.brandName);
    const enrichment = await enrichThreatWithAI(detection, profile.brandName);
    db.updateDetectionEnrichment(detectionId, enrichment);

    res.json({
      success: true,
      detectionId,
      enrichment,
    });
  } catch (error: any) {
    console.error(`[routes/enrich.routes.ts] Error enriching threat: ${error.message}`);
    res.status(500).json({
      success: false,
      file: 'routes/enrich.routes.ts',
      error: error.message,
    });
  }
});
