/**
 * [routes/profile.routes.ts]
 * Brand Profile API Routes for BrandShield AI.
 */

import { Router, Request, Response } from 'express';
import { getProfile, updateProfile, getAllBrands, setActiveBrand } from '../services/brandProfile.service.js';

export const profileRouter = Router();

profileRouter.get('/brands', (_req: Request, res: Response) => {
  try {
    const brands = getAllBrands();
    res.json({ success: true, brands });
  } catch (error: any) {
    console.error(`[routes/profile.routes.ts] Error fetching brands: ${error.message}`);
    res.status(500).json({
      success: false,
      file: 'routes/profile.routes.ts',
      error: error.message,
    });
  }
});

profileRouter.get('/', (req: Request, res: Response) => {
  try {
    const brandId = req.query.brandId as string | undefined;
    const data = getProfile(brandId);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error(`[routes/profile.routes.ts] Error fetching profile: ${error.message}`);
    res.status(500).json({
      success: false,
      file: 'routes/profile.routes.ts',
      error: error.message,
    });
  }
});

profileRouter.post('/select', (req: Request, res: Response) => {
  try {
    const { brandId } = req.body;
    if (!brandId) {
      return res.status(400).json({ success: false, error: 'brandId is required' });
    }
    const data = setActiveBrand(brandId);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error(`[routes/profile.routes.ts] Error switching brand: ${error.message}`);
    res.status(500).json({
      success: false,
      file: 'routes/profile.routes.ts',
      error: error.message,
    });
  }
});

profileRouter.put('/', (req: Request, res: Response) => {
  try {
    const data = updateProfile(req.body);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error(`[routes/profile.routes.ts] Error updating profile: ${error.message}`);
    res.status(400).json({
      success: false,
      file: 'routes/profile.routes.ts',
      error: error.message,
    });
  }
});
