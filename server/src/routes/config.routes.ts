/**
 * [routes/config.routes.ts]
 * Dynamic Configuration API Routes.
 * Allows live tuning of risk weights, thresholds, and severity cutoffs from the UI.
 */

import { Router, Request, Response } from 'express';
import { getDetectionConfig, updateDetectionConfig } from '../config/detection.config.js';

export const configRouter = Router();

configRouter.get('/', (_req: Request, res: Response) => {
  try {
    const config = getDetectionConfig();
    res.json({ success: true, config });
  } catch (error: any) {
    console.error(`[routes/config.routes.ts] Error retrieving config: ${error.message}`);
    res.status(500).json({
      success: false,
      file: 'routes/config.routes.ts',
      error: error.message,
    });
  }
});

configRouter.put('/', (req: Request, res: Response) => {
  try {
    const updated = updateDetectionConfig(req.body);
    res.json({ success: true, config: updated });
  } catch (error: any) {
    console.error(`[routes/config.routes.ts] Error updating config: ${error.message}`);
    res.status(400).json({
      success: false,
      file: 'routes/config.routes.ts',
      error: error.message,
    });
  }
});
