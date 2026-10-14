/**
 * [routes/lookalike.routes.ts]
 * Look-alike Name Lab Live Testbench API.
 */

import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { analyzeLookalikeName } from '../detection/lookalike.js';

export const lookalikeRouter = Router();

lookalikeRouter.post('/test', (req: Request, res: Response) => {
  try {
    const { candidateName, context } = req.body;

    if (!candidateName || typeof candidateName !== 'string') {
      return res.status(400).json({
        success: false,
        file: 'routes/lookalike.routes.ts',
        error: 'candidateName string is required',
      });
    }

    const profile = db.getBrandProfile();
    const result = analyzeLookalikeName(
      candidateName,
      profile.brandName,
      profile.keywords,
      context || ''
    );

    res.json({
      success: true,
      targetBrand: profile.brandName,
      result,
    });
  } catch (error: any) {
    console.error(`[routes/lookalike.routes.ts] Error testing lookalike: ${error.message}`);
    res.status(500).json({
      success: false,
      file: 'routes/lookalike.routes.ts',
      error: error.message,
    });
  }
});
