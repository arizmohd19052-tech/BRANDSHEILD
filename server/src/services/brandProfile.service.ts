/**
 * [services/brandProfile.service.ts]
 * Brand Profile Validation & Completeness Calculation Service for BrandShield AI.
 * Evaluates asset readiness, allowlists, and supports multiple verified brand profiles.
 */

import { BrandProfile, BrandProfileSchema } from '../db/schema.js';
import { db } from '../db/index.js';

export interface CompletenessReport {
  score: number; // 0 - 100%
  breakdown: {
    brandName: boolean;
    logoUrl: boolean;
    socialCount: number;
    appCount: number;
    domainCount: number;
    keywordCount: number;
  };
  suggestions: string[];
}

export function calculateProfileCompleteness(profile: BrandProfile): CompletenessReport {
  let score = 0;
  const suggestions: string[] = [];

  const hasName = Boolean(profile.brandName && profile.brandName.trim().length >= 2);
  if (hasName) score += 15;
  else suggestions.push('Specify official brand name (min 2 characters)');

  const hasLogo = Boolean(profile.officialLogoUrl && profile.officialLogoUrl.trim().length > 0);
  if (hasLogo) score += 15;
  else suggestions.push('Upload official high-resolution logo for visual fingerprinting');

  const socialCount = profile.officialSocials?.length || 0;
  if (socialCount >= 2) score += 25;
  else if (socialCount === 1) {
    score += 15;
    suggestions.push('Add at least 2 official social media handles (e.g. X, Instagram, LinkedIn)');
  } else {
    suggestions.push('Add registered official social channels to prevent self-flagging');
  }

  const appCount = profile.officialApps?.length || 0;
  if (appCount >= 1) score += 25;
  else suggestions.push('Register official mobile app package IDs (e.g. com.brand.app)');

  const domainCount = profile.domains?.length || 0;
  if (domainCount >= 1) score += 10;
  else suggestions.push('Add verified brand domains (e.g. brand.com)');

  const keywordCount = profile.keywords?.length || 0;
  if (keywordCount >= 3) score += 10;
  else suggestions.push('Add at least 3 industry keywords to guard against over-flagging');

  return {
    score: Math.min(100, score),
    breakdown: {
      brandName: hasName,
      logoUrl: hasLogo,
      socialCount,
      appCount,
      domainCount,
      keywordCount,
    },
    suggestions,
  };
}

export function getAllBrands(): BrandProfile[] {
  return db.getBrands();
}

export function getProfile(brandId?: string): { profile: BrandProfile; completeness: CompletenessReport } {
  try {
    const profile = db.getBrandProfile(brandId);
    const completeness = calculateProfileCompleteness(profile);
    return { profile, completeness };
  } catch (error: any) {
    console.error(`[services/brandProfile.service.ts] Error fetching profile: ${error.message}`);
    throw error;
  }
}

export function setActiveBrand(brandId: string): { profile: BrandProfile; completeness: CompletenessReport } {
  try {
    const profile = db.setActiveBrand(brandId);
    const completeness = calculateProfileCompleteness(profile);
    return { profile, completeness };
  } catch (error: any) {
    console.error(`[services/brandProfile.service.ts] Error setting active brand: ${error.message}`);
    throw error;
  }
}

export function updateProfile(data: unknown): { profile: BrandProfile; completeness: CompletenessReport } {
  try {
    const validated = BrandProfileSchema.parse(data);
    const updated = db.setBrandProfile(validated);
    const completeness = calculateProfileCompleteness(updated);
    return { profile: updated, completeness };
  } catch (error: any) {
    console.error(`[services/brandProfile.service.ts] Error updating profile: ${error.message}`);
    throw error;
  }
}
