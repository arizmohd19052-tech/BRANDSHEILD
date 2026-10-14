/**
 * [routes/scan.routes.ts]
 * Digital Risk Scan & Threat Detection Routes for BrandShield AI.
 * Operates deterministically against verified public brands and synthetic test datasets.
 */

import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';

export const scanRouter = Router();

// GET dataset composition counts
scanRouter.get('/dataset/counts', (_req: Request, res: Response) => {
  try {
    const counts = db.getDatasetCounts();
    res.json({
      success: true,
      counts,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset dataset to baseline (removes USER_SUBMITTED only)
scanRouter.post('/dataset/reset', (_req: Request, res: Response) => {
  try {
    db.resetToOriginalDataset();
    const counts = db.getDatasetCounts();
    res.json({
      success: true,
      message: 'Successfully removed all user-submitted records and reloaded baseline datasets.',
      counts,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Retrieve all detections and excluded assets with optional brand filter
scanRouter.get('/detections', (req: Request, res: Response) => {
  try {
    const brand = req.query.brand as string | undefined;
    const detections = db.getDetections(brand);
    const excluded = db.getExcludedAssets(brand);
    const sources = db.getSourceHealth();

    const threats = detections.filter((d) => !d.isExcluded);

    const summary = {
      total: detections.length,
      threatsCount: threats.filter((d) => d.riskScore >= 40).length,
      critical: detections.filter((d) => d.riskLevel === 'Critical').length,
      high: detections.filter((d) => d.riskLevel === 'High').length,
      medium: detections.filter((d) => d.riskLevel === 'Medium').length,
      low: detections.filter((d) => d.riskLevel === 'Low').length,
      safe: detections.filter((d) => d.riskLevel === 'Safe').length,
      socialCount: detections.filter((d) => ['x', 'facebook', 'instagram', 'linkedin', 'telegram'].includes(d.platform.toLowerCase())).length,
      appCount: detections.filter((d) => ['google play', 'apple app store', 'app store', 'google_play'].includes(d.platform.toLowerCase())).length,
      excludedCount: excluded.length,
      datasetGenerated: '2026-10-13T00:00:00Z',
    };

    res.json({
      success: true,
      mode: 'demo-dataset',
      summary,
      detections,
      excluded,
      sources,
    });
  } catch (error: any) {
    console.error(`[routes/scan.routes.ts] Error retrieving detections: ${error.message}`);
    res.status(500).json({
      success: false,
      file: 'routes/scan.routes.ts',
      error: error.message,
    });
  }
});

// Retrieve single detection detail by ID
scanRouter.get('/detections/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const detections = db.getDetections();
    const item = detections.find((d) => d.recordId === id || d.id === id);

    if (!item) {
      return res.status(404).json({
        success: false,
        file: 'routes/scan.routes.ts',
        error: `Detection ${id} not found`,
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    console.error(`[routes/scan.routes.ts] Error retrieving detection ${req.params.id}: ${error.message}`);
    res.status(500).json({
      success: false,
      file: 'routes/scan.routes.ts',
      error: error.message,
    });
  }
});

// Update triage status (confirm threat / mark false positive)
scanRouter.patch('/detections/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'confirmed', 'false_positive'].includes(status)) {
      return res.status(400).json({
        success: false,
        file: 'routes/scan.routes.ts',
        error: 'Invalid status. Must be active, confirmed, or false_positive',
      });
    }

    const updated = db.updateDetectionStatus(id, status);
    if (!updated) {
      return res.status(404).json({
        success: false,
        file: 'routes/scan.routes.ts',
        error: `Detection with ID ${id} not found`,
      });
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error(`[routes/scan.routes.ts] Error updating detection status: ${error.message}`);
    res.status(500).json({
      success: false,
      file: 'routes/scan.routes.ts',
      error: error.message,
    });
  }
});
